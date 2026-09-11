import fs from 'fs';
import path from 'path';
import { SynapseGraph, ProjectMetadata, ProjectManifest } from '../../types';
import { INITIAL_SEED_NODES } from '../graph/graphStore';

export interface ProjectRegistry {
  activeProjectId: string;
  nextPort: number;
  projects: Record<string, ProjectMetadata>;
}

export function getProjectsRootDir(): string {
  const root = process.env.SYNAPSE_PROJECTS_DIR || path.join(process.cwd(), 'projects');
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
  return root;
}

export function getRegistryPath(): string {
  return path.join(getProjectsRootDir(), 'registry.json');
}

export function loadRegistry(): ProjectRegistry {
  const regPath = getRegistryPath();
  if (fs.existsSync(regPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(regPath, 'utf8'));
      return {
        activeProjectId: data.activeProjectId || 'default',
        nextPort: data.nextPort || 3001,
        projects: data.projects || {}
      };
    } catch {
      // fallback
    }
  }

  // Initialize with default project if none exists
  const initial: ProjectRegistry = {
    activeProjectId: 'default',
    nextPort: 3001,
    projects: {
      default: {
        id: 'default',
        name: 'Default Studio Project',
        description: 'Primary workspace canvas',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        port: 3001,
        status: 'stopped'
      }
    }
  };
  saveRegistry(initial);
  return initial;
}

export function saveRegistry(registry: ProjectRegistry): void {
  const regPath = getRegistryPath();
  fs.writeFileSync(regPath, JSON.stringify(registry, null, 2), 'utf8');
}

export function getProjectDir(projectId: string): string {
  const safeId = projectId.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const dir = path.join(getProjectsRootDir(), safeId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getAssetsDir(projectId: string): string {
  const dir = path.join(getProjectDir(projectId), 'assets');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function listProjects(): ProjectMetadata[] {
  const registry = loadRegistry();
  return Object.values(registry.projects);
}

export function getProject(projectId: string): ProjectMetadata | null {
  const registry = loadRegistry();
  return registry.projects[projectId] || null;
}

export function getActiveProjectId(): string {
  const registry = loadRegistry();
  return registry.activeProjectId || 'default';
}

export function setActiveProjectId(projectId: string): void {
  const registry = loadRegistry();
  if (!registry.projects[projectId]) {
    createProject(projectId, projectId);
  }
  registry.activeProjectId = projectId;
  saveRegistry(registry);
}

export function createProject(
  projectId: string,
  name?: string,
  description?: string
): ProjectMetadata {
  const registry = loadRegistry();
  const safeId = projectId.toLowerCase().replace(/[^a-z0-9-_]/g, '-');

  if (registry.projects[safeId]) {
    return registry.projects[safeId];
  }

  const port = registry.nextPort++;
  const now = new Date().toISOString();

  const metadata: ProjectMetadata = {
    id: safeId,
    name: name || safeId,
    description: description || `Synapse Engine workspace for ${name || safeId}`,
    createdAt: now,
    updatedAt: now,
    port,
    status: 'stopped'
  };

  registry.projects[safeId] = metadata;
  saveRegistry(registry);

  // Initialize directory & files
  const pDir = getProjectDir(safeId);
  getAssetsDir(safeId);

  const initialGraph: SynapseGraph = {
    version: '1.0.0',
    activeApp: safeId,
    subgraphs: {},
    nodes: [],
    wires: []
  };
  fs.writeFileSync(path.join(pDir, 'graph.json'), JSON.stringify(initialGraph, null, 2));

  const initialManifest: ProjectManifest = {
    name: safeId,
    version: '0.1.0',
    dependencies: {
      next: '^15.0.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      zod: '^3.24.0',
      'lucide-react': '^1.16.0'
    },
    allocatedPort: port
  };
  fs.writeFileSync(path.join(pDir, 'manifest.json'), JSON.stringify(initialManifest, null, 2));
  fs.writeFileSync(path.join(pDir, 'env.json'), JSON.stringify({}, null, 2));

  return metadata;
}

export function deleteProject(projectId: string): boolean {
  const registry = loadRegistry();
  const safeId = projectId.toLowerCase().replace(/[^a-z0-9-_]/g, '-');

  if (!registry.projects[safeId]) {
    return false;
  }

  delete registry.projects[safeId];
  if (registry.activeProjectId === safeId) {
    registry.activeProjectId = Object.keys(registry.projects)[0] || 'default';
  }
  saveRegistry(registry);

  const pDir = path.join(getProjectsRootDir(), safeId);
  if (fs.existsSync(pDir)) {
    fs.rmSync(pDir, { recursive: true, force: true });
  }

  return true;
}

export function forkProject(sourceId: string, targetId: string, targetName?: string): ProjectMetadata {
  const source = getProject(sourceId);
  if (!source) {
    throw new Error(`Source project ${sourceId} does not exist`);
  }

  const target = createProject(targetId, targetName || `${source.name} (Fork)`);
  const srcDir = getProjectDir(sourceId);
  const destDir = getProjectDir(target.id);

  // Copy graph.json
  const srcGraphPath = path.join(srcDir, 'graph.json');
  if (fs.existsSync(srcGraphPath)) {
    const graphData = JSON.parse(fs.readFileSync(srcGraphPath, 'utf8'));
    graphData.activeApp = target.id;
    fs.writeFileSync(path.join(destDir, 'graph.json'), JSON.stringify(graphData, null, 2));
  }

  // Copy manifest.json
  const srcManifestPath = path.join(srcDir, 'manifest.json');
  if (fs.existsSync(srcManifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(srcManifestPath, 'utf8'));
    manifest.name = target.id;
    manifest.allocatedPort = target.port;
    fs.writeFileSync(path.join(destDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  }

  // Copy env.json
  const srcEnvPath = path.join(srcDir, 'env.json');
  if (fs.existsSync(srcEnvPath)) {
    fs.copyFileSync(srcEnvPath, path.join(destDir, 'env.json'));
  }

  // Copy assets
  const srcAssets = getAssetsDir(sourceId);
  const destAssets = getAssetsDir(target.id);
  if (fs.existsSync(srcAssets)) {
    const files = fs.readdirSync(srcAssets);
    for (const f of files) {
      fs.copyFileSync(path.join(srcAssets, f), path.join(destAssets, f));
    }
  }

  return target;
}

export function getProjectGraph(projectId: string): SynapseGraph {
  const pDir = getProjectDir(projectId);
  const graphFile = path.join(pDir, 'graph.json');

  if (fs.existsSync(graphFile)) {
    try {
      return JSON.parse(fs.readFileSync(graphFile, 'utf8'));
    } catch {
      // fallback
    }
  }

  // Fallback to legacy root synapse-graph.json if requesting default and exists
  const legacyFile = path.join(process.cwd(), 'synapse-graph.json');
  if (projectId === 'default' && fs.existsSync(legacyFile)) {
    try {
      return JSON.parse(fs.readFileSync(legacyFile, 'utf8'));
    } catch {}
  }

  return {
    version: '1.0.0',
    activeApp: projectId,
    subgraphs: {},
    nodes: INITIAL_SEED_NODES,
    wires: []
  };
}

export function saveProjectGraph(projectId: string, graph: SynapseGraph): void {
  const pDir = getProjectDir(projectId);
  const graphFile = path.join(pDir, 'graph.json');
  fs.writeFileSync(graphFile, JSON.stringify(graph, null, 2), 'utf8');

  // Update project updatedAt
  const registry = loadRegistry();
  if (registry.projects[projectId]) {
    registry.projects[projectId].updatedAt = new Date().toISOString();
    saveRegistry(registry);
  }
}

export function getProjectManifest(projectId: string): ProjectManifest {
  const pDir = getProjectDir(projectId);
  const file = path.join(pDir, 'manifest.json');
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {}
  }
  return {
    name: projectId,
    version: '0.1.0',
    dependencies: {
      next: '^15.0.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      zod: '^3.24.0',
      'lucide-react': '^1.16.0'
    }
  };
}

export function saveProjectManifest(
  projectId: string,
  update: Partial<ProjectManifest>
): ProjectManifest {
  const current = getProjectManifest(projectId);
  const merged: ProjectManifest = {
    ...current,
    ...update,
    dependencies: {
      ...current.dependencies,
      ...(update.dependencies || {})
    },
    devDependencies: {
      ...(current.devDependencies || {}),
      ...(update.devDependencies || {})
    },
    env: {
      ...(current.env || {}),
      ...(update.env || {})
    }
  };

  const pDir = getProjectDir(projectId);
  fs.writeFileSync(path.join(pDir, 'manifest.json'), JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

export function getProjectEnv(projectId: string): Record<string, string> {
  const pDir = getProjectDir(projectId);
  const file = path.join(pDir, 'env.json');
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {}
  }
  return {};
}

export function setProjectEnv(projectId: string, env: Record<string, string>): void {
  const pDir = getProjectDir(projectId);
  const current = getProjectEnv(projectId);
  const merged = { ...current, ...env };
  fs.writeFileSync(path.join(pDir, 'env.json'), JSON.stringify(merged, null, 2), 'utf8');
}

export function saveProjectAsset(
  projectId: string,
  filename: string,
  content: Buffer | string,
  isBase64 = false
): { filename: string; path: string; size: number } {
  const assetsDir = getAssetsDir(projectId);
  const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetPath = path.join(assetsDir, safeName);

  if (Buffer.isBuffer(content)) {
    fs.writeFileSync(targetPath, content);
  } else if (isBase64) {
    const cleanBase64 = content.replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(targetPath, Buffer.from(cleanBase64, 'base64'));
  } else {
    fs.writeFileSync(targetPath, content, 'utf8');
  }

  const stat = fs.statSync(targetPath);
  return {
    filename: safeName,
    path: `/assets/${safeName}`,
    size: stat.size
  };
}

export function listProjectAssets(projectId: string): Array<{ filename: string; url: string; size: number }> {
  const assetsDir = getAssetsDir(projectId);
  if (!fs.existsSync(assetsDir)) return [];

  const files = fs.readdirSync(assetsDir);
  return files.map(filename => {
    const stat = fs.statSync(path.join(assetsDir, filename));
    return {
      filename,
      url: `/api/projects/${projectId}/assets/${filename}`,
      size: stat.size
    };
  });
}
