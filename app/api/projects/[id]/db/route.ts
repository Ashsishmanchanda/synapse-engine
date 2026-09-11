import { NextResponse } from 'next/server';
import { executeDDL, executeQuery, getTables, resetDatabase } from '@/src/core/db/sqliteRunner';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tables = getTables(id);
    return NextResponse.json({ success: true, tables });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_GET_TABLES', message: err.message },
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
    const { action = 'query', sql, params: sqlParams = [] } = body;

    if (action === 'reset') {
      resetDatabase(id);
      return NextResponse.json({ success: true, message: `Database for project ${id} reset successfully` });
    }

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { success: false, error: 'SQL_REQUIRED', message: 'sql string is required for exec/query actions' },
        { status: 400 }
      );
    }

    if (action === 'exec') {
      const res = executeDDL(id, sql);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, changes: res.changes });
    }

    // Default: query
    const res = executeQuery(id, sql, sqlParams);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      rows: res.rows,
      changes: res.changes,
      lastInsertRowid: res.lastInsertRowid
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'DATABASE_OPERATION_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
