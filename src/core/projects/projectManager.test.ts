import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import fs from 'fs';
import path from 'path';
import {
  createProject,
  getProject,
  listProjects,
  deleteProject,
  forkProject,
  getActiveProjectId,
  setActiveProjectId,
  getProjectGraph,
  saveProjectGraph,
  getProjectManifest,
  saveProjectManifest,
  getProjectEnv,
  setProjectEnv,
  saveProjectAsset,
  listProjectAssets,
  getProjectsRootDir
} from './projectManager';

describe('Multi-Tenant Project Manager', () => {
  const testProjectId = 'test-unit-project';
  const testForkId = 'test-fork-project';

  beforeEach(() => {
    // cleanup test projects if present
    deleteProject(testProjectId);
    deleteProject(testForkId);
  });

  afterEach(() => {
    deleteProject(testProjectId);
    deleteProject(testForkId);
  });

  it('creates and retrieves a new isolated project', () => {
    const project = createProject(testProjectId, 'Test Project', 'A test app workspace');
    expect(project.id).toBe(testProjectId);
    expect(project.name).toBe('Test Project');
    expect(project.port).toBeGreaterThanOrEqual(3001);

    const fetched = getProject(testProjectId);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(testProjectId);

    const all = listProjects();
    expect(all.some(p => p.id === testProjectId)).toBe(true);
  });

  it('manages active project switching', () => {
    createProject(testProjectId, 'Test Project');
    setActiveProjectId(testProjectId);
    expect(getActiveProjectId()).toBe(testProjectId);
  });

  it('saves and loads isolated project graphs', () => {
    createProject(testProjectId, 'Test Project');
    const graph = getProjectGraph(testProjectId);
    expect(graph.activeApp).toBe(testProjectId);

    graph.nodes.push({
      id: 'n-test-custom',
      type: 'codeSnippet',
      position: { x: 10, y: 20 },
      data: {
        id: 'n-test-custom',
        domain: 'test',
        module: 'unit',
        action: 'run',
        title: 'Custom Test Node',
        category: 'logic',
        code: 'export function test() { return 42; }',
        isExpanded: true,
        inputs: [],
        outputs: [],
        ruleMetrics: {
          lines: 1,
          maxLines: 50,
          statements: 1,
          maxStatements: 40,
          maxCharsPerLine: 40,
          hasMutation: false,
          hasThis: false,
          hasThrow: false,
          status: 'verified',
          violations: []
        }
      }
    });

    saveProjectGraph(testProjectId, graph);

    const reloaded = getProjectGraph(testProjectId);
    expect(reloaded.nodes.length).toBe(1);
    expect(reloaded.nodes[0].id).toBe('n-test-custom');
  });

  it('manages manifest dependencies and secrets', () => {
    createProject(testProjectId, 'Test Project');
    saveProjectManifest(testProjectId, {
      dependencies: {
        '@google/genai': '^0.1.0',
        katex: '^0.16.0'
      }
    });

    const manifest = getProjectManifest(testProjectId);
    expect(manifest.dependencies['@google/genai']).toBe('^0.1.0');
    expect(manifest.dependencies['katex']).toBe('^0.16.0');

    setProjectEnv(testProjectId, {
      GEMINI_API_KEY: 'test-secret-key-123'
    });

    const env = getProjectEnv(testProjectId);
    expect(env.GEMINI_API_KEY).toBe('test-secret-key-123');
  });

  it('uploads and lists static project assets', () => {
    createProject(testProjectId, 'Test Project');
    const asset = saveProjectAsset(testProjectId, 'slide_01.txt', 'Slide 1 content');
    expect(asset.filename).toBe('slide_01.txt');
    expect(asset.path).toBe('/assets/slide_01.txt');

    const assets = listProjectAssets(testProjectId);
    expect(assets.some(a => a.filename === 'slide_01.txt')).toBe(true);
  });

  it('forks an existing project into a new isolated workspace', () => {
    createProject(testProjectId, 'Original Project');
    setProjectEnv(testProjectId, { KEY: 'VALUE' });

    const forked = forkProject(testProjectId, testForkId, 'Forked Project');
    expect(forked.id).toBe(testForkId);
    expect(forked.port).not.toBe(getProject(testProjectId)?.port);

    const forkedEnv = getProjectEnv(testForkId);
    expect(forkedEnv.KEY).toBe('VALUE');
  });

  it('deletes a project and its workspace completely', () => {
    createProject(testProjectId, 'To Delete');
    expect(getProject(testProjectId)).not.toBeNull();

    const success = deleteProject(testProjectId);
    expect(success).toBe(true);
    expect(getProject(testProjectId)).toBeNull();
  });
});
