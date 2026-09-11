import { SynapseGraphNode, WireDefinition } from '../../types';

export const CAD_NODE_WIDTH = 380;
export const CAD_COLUMN_GAP = 140;
export const CAD_ROW_GAP = 48;
export const CAD_GRID_SNAP = 16;
export const CAD_X_START = 60;
export const CAD_Y_START = 80;

/**
 * Snaps a coordinate value to the nearest CAD grid unit (16px)
 */
export function snapToGrid(value: number, grid: number = CAD_GRID_SNAP): number {
  return Math.round(value / grid) * grid;
}

/**
 * Estimates the pixel height of a CodeSnippetNode based on its contents and state
 */
export function estimateNodeHeight(node: SynapseGraphNode): number {
  const data = node.data;
  const pinCount = Math.max(data.inputs?.length || 0, data.outputs?.length || 0);
  const pinHeight = pinCount * 28;
  const headerHeight = 76; // Title + Domain/Module badge
  const footerHeight = 36; // Lisp audit status footer

  if (!data.isExpanded) {
    return snapToGrid(headerHeight + pinHeight + footerHeight + 20);
  }

  const codeLines = (data.code || '').split('\n').length;
  const editorHeight = Math.min(Math.max(codeLines * 20 + 32, 100), 400);
  const violationsHeight = (data.ruleMetrics?.violations?.length || 0) * 32;

  return snapToGrid(headerHeight + pinHeight + editorHeight + footerHeight + violationsHeight + 24);
}

/**
 * Assigns a topological rank (column 0..3) to a node based on category and wire dependencies
 */
export function calculateNodeRank(
  nodeId: string,
  nodesMap: Map<string, SynapseGraphNode>,
  incomingWires: Map<string, WireDefinition[]>
): number {
  const node = nodesMap.get(nodeId);
  if (!node) return 0;

  const inWires = incomingWires.get(nodeId) || [];

  // If node is explicitly UI category, it belongs in Column 3 (Views)
  if (node.data.category === 'ui') {
    return 3;
  }

  // Root data or state nodes with 0 incoming wires belong in Column 0
  if (inWires.length === 0 || node.data.category === 'state' || node.data.category === 'io') {
    return 0;
  }

  // Compute rank based on parent ranks + 1
  let maxParentRank = 0;
  for (const wire of inWires) {
    const parentNode = nodesMap.get(wire.source);
    if (parentNode && parentNode.id !== nodeId) {
      const parentRank = parentNode.data.category === 'state' ? 0 :
        parentNode.data.category === 'transform' ? 1 :
        parentNode.data.category === 'logic' ? 2 : 0;
      if (parentRank >= maxParentRank) {
        maxParentRank = parentRank;
      }
    }
  }

  const assignedRank = Math.min(maxParentRank + 1, 3);
  return assignedRank;
}

/**
 * Executes a deterministic CAD-grade auto layout on the graph.
 * Eliminates overlapping boxes, creates consistent vertical lanes, and aligns coordinates to 16px.
 */
export function executeCADAutoLayout(
  nodes: SynapseGraphNode[],
  wires: WireDefinition[]
): SynapseGraphNode[] {
  if (nodes.length === 0) return [];

  const nodesMap = new Map<string, SynapseGraphNode>();
  nodes.forEach(n => nodesMap.set(n.id, n));

  const incomingWires = new Map<string, WireDefinition[]>();
  wires.forEach(w => {
    const list = incomingWires.get(w.target) || [];
    list.push(w);
    incomingWires.set(w.target, list);
  });

  // Group nodes into 4 topological columns (0: Data, 1: Transform, 2: Logic, 3: UI)
  const columns: SynapseGraphNode[][] = [[], [], [], []];

  nodes.forEach(n => {
    let rank = 0;
    if (n.data.category === 'ui') {
      rank = 3;
    } else if (n.data.category === 'logic' || n.data.category === 'compound') {
      rank = 2;
    } else if (n.data.category === 'transform') {
      rank = 1;
    } else {
      rank = calculateNodeRank(n.id, nodesMap, incomingWires);
    }
    columns[rank].push(n);
  });

  // Distribute and compute exact (x, y) coordinates
  const updatedNodes: SynapseGraphNode[] = [];

  columns.forEach((colNodes, colIndex) => {
    const colX = snapToGrid(CAD_X_START + colIndex * (CAD_NODE_WIDTH + CAD_COLUMN_GAP));
    let currentY = CAD_Y_START;

    colNodes.forEach(node => {
      const height = estimateNodeHeight(node);
      const alignedX = colX;
      const alignedY = snapToGrid(currentY);

      updatedNodes.push({
        ...node,
        position: { x: alignedX, y: alignedY }
      });

      currentY += height + CAD_ROW_GAP;
    });
  });

  return updatedNodes;
}
