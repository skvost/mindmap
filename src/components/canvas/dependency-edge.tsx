"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { X } from "lucide-react";
import { useCanvasStore } from "@/store/canvas-store";

export function DependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
          strokeWidth: selected ? 2 : 1.5,
        }}
        markerEnd="url(#dependency-arrow)"
      />
      {selected && (
        <EdgeLabelRenderer>
          <button
            className="absolute p-0.5 rounded-full bg-destructive text-white hover:bg-destructive/80 pointer-events-auto"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onClick={() => deleteEdge(id)}
          >
            <X className="h-3 w-3" />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
