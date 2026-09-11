import { NextResponse } from 'next/server';
import { loadGraphFromDisk, clearGraph, getDefaultGraph, saveGraphToDisk } from '../../../src/core/graph/graphStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const graph = loadGraphFromDisk();
    return NextResponse.json({ success: true, graph });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_LOAD_GRAPH', message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resetToSeed = searchParams.get('reset') === 'seed';

    if (resetToSeed) {
      const seedGraph = getDefaultGraph();
      saveGraphToDisk(seedGraph);
      return NextResponse.json({ success: true, message: 'Reset to seed graph', graph: seedGraph });
    }

    const blankGraph = clearGraph();
    return NextResponse.json({ success: true, message: 'Graph cleared', graph: blankGraph });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_CLEAR_GRAPH', message: err.message },
      { status: 500 }
    );
  }
}
