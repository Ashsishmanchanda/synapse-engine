import { NextResponse } from 'next/server';
import { getProjectStatus } from '@/src/core/process/processOrchestrator';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const status = getProjectStatus(id);

    return NextResponse.json({
      success: true,
      status
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'STATUS_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
