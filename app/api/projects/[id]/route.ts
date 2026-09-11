import { NextResponse } from 'next/server';
import { getProject, deleteProject, getProjectManifest, listProjectAssets } from '../../../../src/core/projects/projectManager';
import { getProjectStatus, stopProject } from '../../../../src/core/process/processOrchestrator';
import { getTables } from '../../../../src/core/db/sqliteRunner';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = getProject(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'PROJECT_NOT_FOUND', message: `Project ${id} not found` },
        { status: 404 }
      );
    }

    const manifest = getProjectManifest(id);
    const status = getProjectStatus(id);
    const tables = getTables(id);
    const assets = listProjectAssets(id);

    return NextResponse.json({
      success: true,
      project,
      manifest,
      status,
      tables,
      assetCount: assets.length
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_GET_PROJECT', message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Stop process if running
    await stopProject(id);

    // Delete workspace files & registry
    const deleted = deleteProject(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'PROJECT_NOT_FOUND', message: `Project ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Project ${id} and all its workspace assets were deleted successfully`
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_DELETE_PROJECT', message: err.message },
      { status: 500 }
    );
  }
}
