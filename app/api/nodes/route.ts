import { NextResponse } from 'next/server';
import { upsertGraphNode, removeGraphNode } from '../../../src/core/graph/graphStore';
import { evaluateNodeWithLisp } from '../../../src/core/lisp/constitutionalRulebook';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, 
      domain, 
      module, 
      action, 
      title, 
      category = 'transform', 
      code, 
      inputs = [], 
      outputs = [], 
      subgraphId, 
      isCompound, 
      targetSubgraphId, 
      collapsedChildCount,
      runtimeTarget
    } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'MISSING_ID', message: 'Node id is required' },
        { status: 400 }
      );
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'MISSING_CODE', message: 'Node code is required' },
        { status: 400 }
      );
    }

    // Constitutional Gatekeeper Evaluation
    const ruleMetrics = evaluateNodeWithLisp(code, category);

    if (ruleMetrics.status === 'violated') {
      return NextResponse.json(
        {
          success: false,
          error: 'CONSTITUTIONAL_VIOLATION',
          message: 'Node rejected by Synapse Constitutional Gatekeeper',
          ruleMetrics
        },
        { status: 422 }
      );
    }

    const result = upsertGraphNode({
      id,
      domain,
      module,
      action,
      title: title || id,
      category,
      code,
      inputs,
      outputs,
      subgraphId,
      isCompound,
      targetSubgraphId,
      collapsedChildCount,
      runtimeTarget
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Node mounted successfully',
        node: result.node,
        graph: result.graph
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'MISSING_ID', message: 'Node id is required' },
        { status: 400 }
      );
    }

    const updatedGraph = removeGraphNode(id);
    return NextResponse.json({
      success: true,
      message: `Node ${id} removed`,
      graph: updatedGraph
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
