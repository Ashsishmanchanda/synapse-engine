import { NextResponse } from 'next/server';
import { getProjectManifest, saveProjectManifest } from '@/src/core/projects/projectManager';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const manifest = getProjectManifest(id);
    return NextResponse.json({ success: true, manifest });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_GET_MANIFEST', message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const update = await request.json();
    const updated = saveProjectManifest(id, update);

    return NextResponse.json({
      success: true,
      message: `Manifest updated for project ${id}`,
      manifest: updated
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_UPDATE_MANIFEST', message: err.message },
      { status: 500 }
    );
  }
}
