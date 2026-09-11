import { NextResponse } from 'next/server';
import { listProjectAssets, saveProjectAsset } from '@/src/core/projects/projectManager';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assets = listProjectAssets(id);
    return NextResponse.json({ success: true, assets });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_LIST_ASSETS', message: err.message },
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
    const body = await request.json();
    const { filename, content, isBase64 = false } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { success: false, error: 'INVALID_FILENAME', message: 'filename is required' },
        { status: 400 }
      );
    }

    if (content === undefined || content === null) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CONTENT', message: 'content is required' },
        { status: 400 }
      );
    }

    const saved = saveProjectAsset(id, filename, content, isBase64);

    return NextResponse.json({
      success: true,
      message: `Asset ${saved.filename} saved successfully`,
      asset: saved
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_SAVE_ASSET', message: err.message },
      { status: 500 }
    );
  }
}
