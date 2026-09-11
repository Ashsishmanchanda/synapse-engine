import { NextResponse } from 'next/server';
import { stopProject } from '@/src/core/process/processOrchestrator';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await stopProject(id);

    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'STOP_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
