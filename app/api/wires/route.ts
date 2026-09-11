import { NextResponse } from 'next/server';
import { connectGraphWire, removeGraphWire } from '../../../src/core/graph/graphStore';
import { validateWireContract } from '../../../src/core/contracts/zodContractValidator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, source, sourceHandle, target, targetHandle, sourceSchema = 'z.any()', targetSchema = 'z.any()' } = body;

    if (!source || !target || !sourceHandle || !targetHandle) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_WIRE_PARAMS',
          message: 'source, sourceHandle, target, and targetHandle are required'
        },
        { status: 400 }
      );
    }

    // Zod Wire Contract Validation
    const contractCheck = validateWireContract(sourceSchema, targetSchema);

    if (contractCheck.status === 'mismatch') {
      return NextResponse.json(
        {
          success: false,
          error: 'WIRE_CONTRACT_MISMATCH',
          message: contractCheck.reason || 'Contract mismatch between connected ports',
          contractCheck
        },
        { status: 422 }
      );
    }

    const result = connectGraphWire({
      id,
      source,
      sourceHandle,
      target,
      targetHandle,
      contract: sourceSchema,
      sourceSchema,
      targetSchema
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Wire connected successfully',
        wire: result.wire,
        graph: result.graph,
        contractCheck
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
        { success: false, error: 'MISSING_ID', message: 'Wire id is required' },
        { status: 400 }
      );
    }

    const updatedGraph = removeGraphWire(id);
    return NextResponse.json({
      success: true,
      message: `Wire ${id} removed`,
      graph: updatedGraph
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
