import { NextResponse } from 'next/server';
import { forkProject } from '@/src/core/projects/projectManager';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { targetId, targetName } = body;

    if (!targetId || typeof targetId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'INVALID_TARGET_ID', message: 'targetId string is required' },
        { status: 400 }
      );
    }

    const forked = forkProject(id, targetId, targetName);
    return NextResponse.json({
      success: true,
      message: `Project ${id} successfully forked into ${targetId}`,
      project: forked
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FORK_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
