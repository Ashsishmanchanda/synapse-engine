import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createProject, deleteProject, getProjectGraph, getProjectManifest } from './projectManager';
import { executeDDL, executeQuery, getTables, resetDatabase } from '../db/sqliteRunner';
import { evaluateNodeWithLisp } from '../lisp/constitutionalRulebook';
import { exportNextjsApp } from '../compiler/codeExporter';
import path from 'path';
import fs from 'fs';

describe('End-to-End Engine Lifecycle Integration Test', () => {
  const projId = 'e2e-integration-app';

  beforeEach(() => {
    resetDatabase(projId);
    deleteProject(projId);
  });

  afterEach(() => {
    resetDatabase(projId);
    deleteProject(projId);
  });

  it('runs complete app lifecycle: project creation, db migration, blueprint ingestion, export synthesis, and cleanup', () => {
    // 1. Create Project
    const project = createProject(projId, 'E2E Integration App', 'Testing autonomous engine lifecycle');
    expect(project.id).toBe(projId);

    // 2. Run SQLite DDL Migration
    const ddl = executeDDL(
      projId,
      `CREATE TABLE IF NOT EXISTS lectures (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        video_url TEXT NOT NULL
      );`
    );
    expect(ddl.success).toBe(true);

    // 3. Seed Database
    const seed = executeQuery(
      projId,
      `INSERT INTO lectures (id, title, video_url) VALUES (?, ?, ?)`,
      ['lec-01', 'Calculus III: Vector Fields', 'https://www.youtube.com/watch?v=sample']
    );
    expect(seed.success).toBe(true);
    expect(seed.changes).toBe(1);

    const tables = getTables(projId);
    expect(tables.some(t => t.name === 'lectures')).toBe(true);

    // 4. Ingest Constitutional Nodes (Client + Server Action)
    const serverNodeCode = `import { z } from "zod";
export const input = z.string(), output = z.any();

export async function getLectureById(id: string) {
  const stmt = db.query('SELECT * FROM lectures WHERE id = ?');
  return stmt.get(id);
}`;

    const clientNodeCode = `import { z } from "zod";
import React, { useState } from "react";
export const input = z.void(), output = z.any();

export function LectureViewer() {
  const [active, setActive] = useState("lec-01");
  return (
    <div className="p-4 bg-slate-900 rounded-lg">
      <h2 className="text-sm font-bold text-amber-400">Active: {active}</h2>
    </div>
  );
}`;

    const serverMetrics = evaluateNodeWithLisp(serverNodeCode, 'logic');
    expect(serverMetrics.status).toBe('verified');

    const clientMetrics = evaluateNodeWithLisp(clientNodeCode, 'ui');
    expect(clientMetrics.status).toBe('verified');

    const graph = {
      version: '1.0.0',
      activeApp: projId,
      subgraphs: { root: { id: 'root', title: 'E2E Studio' } },
      nodes: [
        {
          id: 'n-get-lecture',
          type: 'codeSnippet',
          position: { x: 100, y: 100 },
          data: {
            id: 'n-get-lecture',
            domain: 'lecture',
            module: 'db',
            action: 'get',
            title: 'Fetch Lecture Action',
            category: 'logic' as const,
            runtimeTarget: 'server' as const,
            code: serverNodeCode,
            isExpanded: true,
            inputs: [{ id: 'in-id', name: 'in.id', typeSchema: 'z.string()', direction: 'in' as const }],
            outputs: [{ id: 'out-lec', name: 'out.lec', typeSchema: 'z.any()', direction: 'out' as const }],
            ruleMetrics: serverMetrics
          }
        },
        {
          id: 'n-lecture-view',
          type: 'codeSnippet',
          position: { x: 400, y: 100 },
          data: {
            id: 'n-lecture-view',
            domain: 'lecture',
            module: 'ui',
            action: 'render',
            title: 'Lecture UI Viewer',
            category: 'ui' as const,
            runtimeTarget: 'client' as const,
            code: clientNodeCode,
            isExpanded: true,
            inputs: [],
            outputs: [],
            ruleMetrics: clientMetrics
          }
        }
      ],
      wires: [
        {
          id: 'w-server-client',
          source: 'n-get-lecture',
          sourceHandle: 'out-lec',
          target: 'n-lecture-view',
          targetHandle: 'in-none',
          data: { contract: 'z.any()', sourceSchema: 'z.any()', targetSchema: 'z.any()', status: 'compatible' as const }
        }
      ]
    };

    // 5. Test Synthesis with Standalone Exporter
    const targetExportDir = path.join(process.cwd(), 'projects', projId, 'export');
    const exportRes = exportNextjsApp(graph, {
      targetDir: targetExportDir,
      projectId: projId
    });

    expect(exportRes.success).toBe(true);
    expect(fs.existsSync(path.join(targetExportDir, 'server', 'actions', 'GetLectureComponent.ts'))).toBe(true);
    expect(fs.existsSync(path.join(targetExportDir, 'components', 'nodes', 'LectureViewComponent.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(targetExportDir, 'lib', 'db.ts'))).toBe(true);

    // Verify Server Action file has 'use server'
    const serverFileContent = fs.readFileSync(
      path.join(targetExportDir, 'server', 'actions', 'GetLectureComponent.ts'),
      'utf8'
    );
    expect(serverFileContent.includes("'use server'")).toBe(true);
    expect(serverFileContent.includes("import { db, getDb } from '@/lib/db'")).toBe(true);

    // Verify Client Component has 'use client'
    const clientFileContent = fs.readFileSync(
      path.join(targetExportDir, 'components', 'nodes', 'LectureViewComponent.tsx'),
      'utf8'
    );
    expect(clientFileContent.includes("'use client'")).toBe(true);

    // 6. Delete project and verify clean workspace
    const deleted = deleteProject(projId);
    expect(deleted).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'projects', projId))).toBe(false);
  });
});
