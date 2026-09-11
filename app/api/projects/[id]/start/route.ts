import { NextResponse } from 'next/server';
import { startProject } from '@/src/core/process/processOrchestrator';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { mode = 'dev' } = body;

    const result = await startProject(id, mode);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'START_FAILED', message: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Project ${id} started on port ${result.port}`,
      port: result.port,
      pid: result.pid,
      url: result.url
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'START_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
