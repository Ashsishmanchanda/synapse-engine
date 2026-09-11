import { NextResponse } from 'next/server';
import { getProjectLogs } from '@/src/core/process/processOrchestrator';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const linesParam = searchParams.get('lines');
    const maxLines = linesParam ? parseInt(linesParam, 10) : 100;

    const logs = getProjectLogs(id, maxLines);

    return NextResponse.json({
      success: true,
      projectId: id,
      count: logs.length,
      logs
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'LOGS_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
