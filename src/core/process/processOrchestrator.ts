import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getProject, getProjectDir, loadRegistry, saveRegistry } from '../projects/projectManager';
import { ProjectProcessStatus } from '../../types';

interface RunningInstance {
  process: ChildProcess;
  pid: number;
  port: number;
  startTime: number;
  logs: string[];
}

const activeProcesses = new Map<string, RunningInstance>();
const MAX_LOG_LINES = 500;

function appendLog(projectId: string, line: string, instance?: RunningInstance) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${line}`;

  if (instance) {
    instance.logs.push(formatted);
    if (instance.logs.length > MAX_LOG_LINES) {
      instance.logs.shift();
    }
  }

  // Also append to runtime.log file
  try {
    const pDir = getProjectDir(projectId);
    fs.appendFileSync(path.join(pDir, 'runtime.log'), formatted + '\n');
  } catch {}
}

export function getProjectLogs(projectId: string, maxLines = 100): string[] {
  const instance = activeProcesses.get(projectId);
  if (instance && instance.logs.length > 0) {
    return instance.logs.slice(-maxLines);
  }

  // Fallback to reading file
  try {
    const pDir = getProjectDir(projectId);
    const logFile = path.join(pDir, 'runtime.log');
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      return lines.slice(-maxLines);
    }
  } catch {}

  return [];
}

export function getProjectStatus(projectId: string): ProjectProcessStatus {
  const meta = getProject(projectId);
  const instance = activeProcesses.get(projectId);

  if (!meta) {
    return {
      id: projectId,
      status: 'stopped',
      port: 0
    };
  }

  if (instance) {
    // Verify if PID is still running
    try {
      // Sending signal 0 checks existence
      process.kill(instance.pid, 0);
      const uptime = Math.floor((Date.now() - instance.startTime) / 1000);
      return {
        id: projectId,
        status: 'running',
        port: instance.port,
        pid: instance.pid,
        uptime,
        url: `http://localhost:${instance.port}`
      };
    } catch {
      // Process died
      activeProcesses.delete(projectId);
      meta.status = 'stopped';
      meta.pid = undefined;
      const reg = loadRegistry();
      if (reg.projects[projectId]) {
        reg.projects[projectId].status = 'stopped';
        delete reg.projects[projectId].pid;
        saveRegistry(reg);
      }
    }
  }

  return {
    id: projectId,
    status: meta.status || 'stopped',
    port: meta.port,
    url: meta.status === 'running' ? `http://localhost:${meta.port}` : undefined
  };
}

export async function stopProject(projectId: string): Promise<{ success: boolean; message: string }> {
  const instance = activeProcesses.get(projectId);
  const meta = getProject(projectId);

  if (instance) {
    appendLog(projectId, `Stopping application process (PID: ${instance.pid})...`, instance);
    try {
      process.kill(-instance.pid, 'SIGTERM'); // Kill process group
    } catch {
      try {
        instance.process.kill('SIGTERM');
      } catch {}
    }
    activeProcesses.delete(projectId);
  }

  if (meta) {
    meta.status = 'stopped';
    meta.pid = undefined;
    const reg = loadRegistry();
    if (reg.projects[projectId]) {
      reg.projects[projectId].status = 'stopped';
      delete reg.projects[projectId].pid;
      saveRegistry(reg);
    }
  }

  return { success: true, message: `Project ${projectId} stopped successfully` };
}

export async function startProject(
  projectId: string,
  mode: 'dev' | 'start' = 'dev'
): Promise<{ success: boolean; port: number; pid?: number; url: string; error?: string }> {
  const meta = getProject(projectId);
  if (!meta) {
    return { success: false, port: 0, url: '', error: `Project ${projectId} does not exist` };
  }

  // If already running, stop it first
  if (activeProcesses.has(projectId)) {
    await stopProject(projectId);
  }

  const pDir = getProjectDir(projectId);
  const exportDir = path.join(pDir, 'export');

  if (!fs.existsSync(exportDir)) {
    return {
      success: false,
      port: meta.port,
      url: '',
      error: `Project has not been built/exported yet. Please export or build first.`
    };
  }

  const port = meta.port;
  appendLog(projectId, `Spawning ${mode} server on port ${port}...`);

  // Use bun or next
  const cmd = 'bun';
  const args = mode === 'dev' ? ['run', 'dev', '--', '-p', String(port)] : ['run', 'start', '--', '-p', String(port)];

  try {
    const child = spawn(cmd, args, {
      cwd: exportDir,
      detached: true,
      env: {
        ...process.env,
        PORT: String(port)
      }
    });

    const instance: RunningInstance = {
      process: child,
      pid: child.pid || 0,
      port,
      startTime: Date.now(),
      logs: []
    };

    activeProcesses.set(projectId, instance);

    child.stdout?.on('data', (data) => {
      appendLog(projectId, data.toString().trim(), instance);
    });

    child.stderr?.on('data', (data) => {
      appendLog(projectId, `[stderr] ${data.toString().trim()}`, instance);
    });

    child.on('error', (err) => {
      appendLog(projectId, `Process error: ${err.message}`, instance);
      activeProcesses.delete(projectId);
    });

    child.on('exit', (code, signal) => {
      appendLog(projectId, `Process exited with code ${code}, signal ${signal}`, instance);
      activeProcesses.delete(projectId);
      const reg = loadRegistry();
      if (reg.projects[projectId]) {
        reg.projects[projectId].status = 'stopped';
        delete reg.projects[projectId].pid;
        saveRegistry(reg);
      }
    });

    // Update metadata
    meta.status = 'running';
    meta.pid = child.pid;
    const reg = loadRegistry();
    if (reg.projects[projectId]) {
      reg.projects[projectId].status = 'running';
      reg.projects[projectId].pid = child.pid;
      saveRegistry(reg);
    }

    return {
      success: true,
      port,
      pid: child.pid,
      url: `http://localhost:${port}`
    };
  } catch (err: any) {
    appendLog(projectId, `Failed to start process: ${err.message}`);
    return {
      success: false,
      port,
      url: '',
      error: err.message
    };
  }
}
