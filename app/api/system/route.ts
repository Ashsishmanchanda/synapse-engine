import { NextResponse } from 'next/server';
import { listProjects, getActiveProjectId } from '../../../src/core/projects/projectManager';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = listProjects();
    const activeProjectId = getActiveProjectId();

    return NextResponse.json({
      success: true,
      engine: 'Synapse Constitutional Blueprint Engine',
      version: '1.5.0',
      locked: true,
      activeProjectId,
      totalProjects: projects.length,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        port: p.port,
        status: p.status
      })),
      capabilities: [
        'project-multi-tenancy',
        'atomic-blueprint-ingestion',
        'native-sqlite-runner',
        'dual-server-client-compiler',
        'dynamic-port-orchestrator',
        'runtime-logs-telemetry',
        'static-assets-pipeline',
        'manifest-dependencies-manager',
        'project-forking'
      ]
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'SYSTEM_STATUS_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
