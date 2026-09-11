import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { getProjectGraph, getProjectDir, getProject } from '@/src/core/projects/projectManager';
import { exportNextjsApp } from '@/src/core/compiler/codeExporter';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = getProject(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'PROJECT_NOT_FOUND', message: `Project ${id} does not exist` },
        { status: 404 }
      );
    }

    const graph = getProjectGraph(id);
    if (!graph.nodes || graph.nodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'EMPTY_GRAPH', message: 'Cannot build an empty graph. Add nodes first.' },
        { status: 400 }
      );
    }

    const pDir = getProjectDir(id);
    const exportDir = path.join(pDir, 'export');

    // 1. Synthesize Next.js 15 code
    const exportResult = exportNextjsApp(graph, {
      targetDir: exportDir,
      projectId: id
    });

    // 2. Run bun install in the exported directory to ensure packages are available
    let installOutput = '';
    try {
      installOutput = execSync('bun install', {
        cwd: exportDir,
        encoding: 'utf8',
        timeout: 60000,
        env: { ...process.env, PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}` }
      });
    } catch (installErr: any) {
      installOutput = installErr.stdout || installErr.message;
    }

    return NextResponse.json({
      success: true,
      message: `Project ${id} synthesized and built successfully`,
      exportPath: exportDir,
      nodeCount: exportResult.nodeCount,
      filesGenerated: exportResult.filesGenerated,
      installOutput: installOutput.slice(-500)
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'BUILD_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
