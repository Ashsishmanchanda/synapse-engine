import { NextResponse } from 'next/server';
import { getProjectGraph, saveProjectGraph, getProject, createProject } from '@/src/core/projects/projectManager';
import { SynapseGraph, SynapseGraphNode, WireDefinition, PortDefinition } from '@/src/types';
import { evaluateNodeWithLisp } from '@/src/core/lisp/constitutionalRulebook';
import { executeCADAutoLayout } from '@/src/core/layout/cadAutoLayout';
import { validateWireContract } from '@/src/core/contracts/zodContractValidator';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const graph = getProjectGraph(id);
    return NextResponse.json({ success: true, graph });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'FAILED_TO_LOAD_BLUEPRINT', message: err.message },
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
    const { nodes, wires, subgraphs, autoLayout = true } = body;

    if (!Array.isArray(nodes)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_NODES', message: 'nodes array is required' },
        { status: 400 }
      );
    }

    // Ensure project exists
    if (!getProject(id)) {
      createProject(id, id);
    }

    // 1. Evaluate all nodes with Lisp Constitutional Rulebook
    const totalViolations: Array<{ nodeId: string; code: string; message: string }> = [];
    const verifiedNodes: SynapseGraphNode[] = nodes.map((node: SynapseGraphNode) => {
      const code = node.data?.code || '';
      const ruleMetrics = evaluateNodeWithLisp(code);

      if (ruleMetrics.violations && ruleMetrics.violations.length > 0) {
        for (const v of ruleMetrics.violations) {
          totalViolations.push({ nodeId: node.id, code: v.code, message: v.message });
        }
      }

      return {
        ...node,
        data: {
          ...node.data,
          ruleMetrics
        }
      };
    });

    // 2. Validate all wires with Zod Contract Validator
    const wireList: WireDefinition[] = Array.isArray(wires) ? wires : [];
    const validatedWires: WireDefinition[] = wireList.map(wire => {
      const sourceNode = verifiedNodes.find(n => n.id === wire.source);
      const targetNode = verifiedNodes.find(n => n.id === wire.target);

      const sourcePort = sourceNode?.data?.outputs?.find((p: PortDefinition) => p.id === wire.sourceHandle);
      const targetPort = targetNode?.data?.inputs?.find((p: PortDefinition) => p.id === wire.targetHandle);

      const srcSchema = sourcePort?.typeSchema || wire.data?.sourceSchema || 'z.any()';
      const tgtSchema = targetPort?.typeSchema || wire.data?.targetSchema || 'z.any()';

      const validation = validateWireContract(srcSchema, tgtSchema);

      return {
        ...wire,
        type: wire.type || 'zodWire',
        animated: true,
        data: {
          contract: srcSchema,
          sourceSchema: srcSchema,
          targetSchema: tgtSchema,
          status: validation.status
        }
      };
    });

    // 3. Apply CAD Auto-Layout if requested
    const finalNodes = autoLayout
      ? executeCADAutoLayout(verifiedNodes, validatedWires)
      : verifiedNodes;

    const graph: SynapseGraph = {
      version: '1.0.0',
      activeApp: id,
      subgraphs: subgraphs || { root: { id: 'root', title: `${id} Root Studio` } },
      nodes: finalNodes,
      wires: validatedWires
    };

    saveProjectGraph(id, graph);

    return NextResponse.json({
      success: true,
      message: `Atomic blueprint ingested for project ${id}`,
      nodeCount: finalNodes.length,
      wireCount: validatedWires.length,
      violationsCount: totalViolations.length,
      violations: totalViolations,
      graph
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'BLUEPRINT_INGESTION_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
