"use client";

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useOnSelectionChange,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback } from "react";

import { useCanvasStore } from "@/store/canvas-store";
import { nodeTypes } from "./node-types";
import { edgeTypes } from "./edge-types";
import { EmptyState } from "./empty-state";

export function Canvas() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  useOnSelectionChange({
    onChange: ({ nodes: selected }) => {
      setSelectedNodeId(selected.length === 1 ? selected[0].id : null);
    },
  });

  const isEmpty = nodes.length === 0;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
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
