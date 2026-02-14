import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { StepNodeData } from "@/components/canvas/step-node";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 40;

/**
 * Run dagre layout on the steps of a single goal.
 * Returns updated node positions (top-down layout, offset relative to goal).
 */
export function layoutGoalSteps(
  goalNode: Node,
  stepNodes: Node[],
  edges: Edge[],
): Node[] {
  if (stepNodes.length === 0) return stepNodes;

  const stepIds = new Set(stepNodes.map((n) => n.id));
  const relevantEdges = edges.filter(
    (e) => stepIds.has(e.source) && stepIds.has(e.target),
  );

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 30,
    ranksep: 50,
    marginx: 0,
    marginy: 0,
  });

  for (const node of stepNodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of relevantEdges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  // Compute bounding box center of dagre output to center under goal
  let minX = Infinity;
  let maxX = -Infinity;
  for (const node of stepNodes) {
    const pos = g.node(node.id);
    if (pos.x - NODE_WIDTH / 2 < minX) minX = pos.x - NODE_WIDTH / 2;
    if (pos.x + NODE_WIDTH / 2 > maxX) maxX = pos.x + NODE_WIDTH / 2;
  }
  const layoutCenterX = (minX + maxX) / 2;

  // Goal center X (approximate, goal width ~200-300, use 250/2 = 125)
  const goalCenterX = goalNode.position.x + 125;
  const offsetX = goalCenterX - layoutCenterX;
  const offsetY = goalNode.position.y + 70; // below the goal node

  return stepNodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - NODE_WIDTH / 2 + offsetX,
        y: dagreNode.y - NODE_HEIGHT / 2 + offsetY,
      },
    };
  });
}
