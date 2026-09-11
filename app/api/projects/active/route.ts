import { NextResponse } from 'next/server';
import { getActiveProjectId, setActiveProjectId, getProject } from '../../../../src/core/projects/projectManager';

export const dynamic = 'force-dynamic';

export async function GET() {
  const activeProjectId = getActiveProjectId();
  const project = getProject(activeProjectId);
  return NextResponse.json({
    success: true,
    activeProjectId,
    project
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'INVALID_PROJECT_ID', message: 'Project id is required' },
        { status: 400 }
      );
    }

    setActiveProjectId(id);
    const project = getProject(id);

    return NextResponse.json({
      success: true,
      activeProjectId: id,
      project
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_SET_ACTIVE_PROJECT', message: err.message },
      { status: 500 }
    );
  }
}
