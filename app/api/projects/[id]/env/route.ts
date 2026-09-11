import { NextResponse } from 'next/server';
import { getProjectEnv, setProjectEnv } from '@/src/core/projects/projectManager';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getProjectEnv(id);

    // Mask secret values in GET response
    const masked: Record<string, string> = {};
    for (const [k, v] of Object.entries(env)) {
      const val = String(v ?? '');
      if (val.length > 8) {
        masked[k] = `${val.slice(0, 4)}...${val.slice(-4)}`;
      } else {
        masked[k] = '********';
      }
    }

    return NextResponse.json({ success: true, envKeys: Object.keys(env), maskedEnv: masked });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_GET_ENV', message: err.message },
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
    const { env } = body;

    if (!env || typeof env !== 'object') {
      return NextResponse.json(
        { success: false, error: 'INVALID_ENV', message: 'env key-value object is required' },
        { status: 400 }
      );
    }

    setProjectEnv(id, env);

    return NextResponse.json({
      success: true,
      message: `Environment variables updated for project ${id}`,
      keys: Object.keys(env)
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_SET_ENV', message: err.message },
      { status: 500 }
    );
  }
}
