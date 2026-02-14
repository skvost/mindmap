"use client";

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useOnSelectionChange,
  useReactFlow,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type IsValidConnection,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";

import { useCanvasStore } from "@/store/canvas-store";
import type { GoalNodeData } from "./goal-node";
import type { StepNodeData } from "./step-node";
import { nodeTypes } from "./node-types";
import { edgeTypes } from "./edge-types";
import { EmptyState } from "./empty-state";
import { usePersistence } from "@/hooks/use-persistence";

export function Canvas() {
  usePersistence();
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const addGoal = useCanvasStore((s) => s.addGoal);
  const addDependencyEdge = useCanvasStore((s) => s.addDependencyEdge);
  const isValidConnection = useCanvasStore((s) => s.isValidConnection);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const { screenToFlowPosition } = useReactFlow();

  // Collapse: hide step nodes whose parent goal is collapsed
  const collapsedGoalIds = useMemo(() => {
    const ids = new Set<string>();
    for (const n of nodes) {
      if (n.type === "goal" && (n.data as GoalNodeData).isCollapsed) {
        ids.add(n.id);
      }
    }
    return ids;
  }, [nodes]);

  const visibleNodes = useMemo(() => {
    if (collapsedGoalIds.size === 0) return nodes;
    return nodes.filter((n) => {
      if (n.type !== "step") return true;
      return !collapsedGoalIds.has((n.data as StepNodeData).goalId);
    });
  }, [nodes, collapsedGoalIds]);

  const hiddenStepIds = useMemo(() => {
    if (collapsedGoalIds.size === 0) return new Set<string>();
    const ids = new Set<string>();
    for (const n of nodes) {
      if (n.type === "step" && collapsedGoalIds.has((n.data as StepNodeData).goalId)) {
        ids.add(n.id);
      }
    }
    return ids;
  }, [nodes, collapsedGoalIds]);

  // Auto-generate connector edges from leaf steps to their goal
  const connectorEdges = useMemo(() => {
    const stepNodes = nodes.filter((n) => n.type === "step");
    if (stepNodes.length === 0) return [];

    // Find steps that have outgoing dependency edges (they feed into other steps)
    const hasOutgoing = new Set<string>();
    for (const e of edges) {
      if (e.type === "dependency") hasOutgoing.add(e.source);
    }

    // Leaf steps = steps with no outgoing deps (final steps before goal)
    // Edge goes goal(bottom) → step(top) for clean downward routing
    const connectors: Edge[] = [];
    for (const step of stepNodes) {
      if (hasOutgoing.has(step.id)) continue;
      const goalId = (step.data as StepNodeData).goalId;
      connectors.push({
        id: `connector-${goalId}-${step.id}`,
        source: goalId,
        target: step.id,
        type: "smoothstep",
        style: { stroke: "var(--color-muted-foreground)", strokeWidth: 1.5, strokeDasharray: "6 3" },
        animated: false,
      });
    }
    return connectors;
  }, [nodes, edges]);

  const visibleEdges = useMemo(() => {
    const allEdges = [...edges, ...connectorEdges];
    if (hiddenStepIds.size === 0) return allEdges;
    return allEdges.filter(
      (e) => !hiddenStepIds.has(e.source) && !hiddenStepIds.has(e.target),
    );
  }, [edges, connectorEdges, hiddenStepIds]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => addDependencyEdge(connection),
    [addDependencyEdge],
  );

  const checkValidConnection: IsValidConnection = useCallback(
    (connection) => {
      if (!("source" in connection) || !("target" in connection)) return false;
      return isValidConnection(connection as { source: string; target: string; sourceHandle: string | null; targetHandle: string | null });
    },
    [isValidConnection],
  );

  useOnSelectionChange({
    onChange: ({ nodes: selected }) => {
      setSelectedNodeId(selected.length === 1 ? selected[0].id : null);
    },
  });

  const onDoubleClickCanvas = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addGoal(position);
    },
    [screenToFlowPosition, addGoal],
  );

  const isEmpty = nodes.length === 0;

  return (
    <ReactFlow
      nodes={visibleNodes}
      edges={visibleEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      isValidConnection={checkValidConnection}
      onDoubleClick={onDoubleClickCanvas}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      zoomOnDoubleClick={false}
      selectNodesOnDrag={false}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      <Controls showInteractive={false} />
      <MiniMap
        zoomable
        pannable
        className="!bg-background/80 !border-border"
      />
      {isEmpty && <EmptyState />}
    </ReactFlow>
  );
}
