import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { getProjectStatus, getProjectLogs, stopProject } from './processOrchestrator';
import { createProject, deleteProject } from '../projects/projectManager';

describe('Process & Port Orchestrator', () => {
  const testProjectId = 'test-process-project';

  beforeEach(() => {
    createProject(testProjectId, 'Process Test Project');
  });

  afterEach(async () => {
    await stopProject(testProjectId);
    deleteProject(testProjectId);
  });

  it('reports stopped status when project is not running', () => {
    const status = getProjectStatus(testProjectId);
    expect(status.id).toBe(testProjectId);
    expect(status.status).toBe('stopped');
    expect(status.port).toBeGreaterThanOrEqual(3001);
  });

  it('retrieves project logs safely without crashing', () => {
    const logs = getProjectLogs(testProjectId, 20);
    expect(Array.isArray(logs)).toBe(true);
  });

  it('stops a project gracefully even if not currently running', async () => {
    const result = await stopProject(testProjectId);
    expect(result.success).toBe(true);
  });
});
