import { NextResponse } from 'next/server';
import { loadGraphFromDisk } from '../../../src/core/graph/graphStore';
import { exportNextjsApp } from '../../../src/core/compiler/codeExporter';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { targetDirName } = body;

    const graph = loadGraphFromDisk();

    if (!graph.nodes || graph.nodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'EMPTY_GRAPH', message: 'Cannot export an empty graph' },
        { status: 400 }
      );
    }

    const result = exportNextjsApp(graph, targetDirName);

    return NextResponse.json({
      success: true,
      message: 'Next.js 15 application synthesized and exported successfully',
      result
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'EXPORT_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
