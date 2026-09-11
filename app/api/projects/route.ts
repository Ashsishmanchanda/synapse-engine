import { NextResponse } from 'next/server';
import { listProjects, createProject, getActiveProjectId } from '../../../src/core/projects/projectManager';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = listProjects();
    const activeProjectId = getActiveProjectId();
    return NextResponse.json({
      success: true,
      activeProjectId,
      projects
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_LIST_PROJECTS', message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'INVALID_PROJECT_ID', message: 'Project id is required and must be a string' },
        { status: 400 }
      );
    }

    const project = createProject(id, name, description);
    return NextResponse.json({
      success: true,
      message: `Project ${project.id} created successfully`,
      project
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_CREATE_PROJECT', message: err.message },
      { status: 500 }
    );
  }
}
