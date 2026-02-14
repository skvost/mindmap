"use client";

import { memo, useState, useRef, useEffect, useCallback } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Circle, CheckCircle2, Loader2, Lock, Trash2 } from "lucide-react";
import { useCanvasStore } from "@/store/canvas-store";
import type { StepStatus } from "@/types";

export type StepNodeData = {
  title: string;
  goalId: string;
  status: StepStatus;
};

type StepNode = Node<StepNodeData, "step">;

const statusConfig: Record<
  StepStatus,
  { icon: typeof Circle; className: string; label: string }
> = {
  locked: { icon: Lock, className: "text-muted-foreground/50", label: "Locked" },
  available: { icon: Circle, className: "text-blue-500", label: "Available" },
  in_progress: { icon: Loader2, className: "text-amber-500", label: "In progress" },
  completed: { icon: CheckCircle2, className: "text-green-500", label: "Completed" },
};

const statusCycle: StepStatus[] = ["available", "in_progress", "completed"];

function StepNodeComponent({ id, data, selected }: NodeProps<StepNode>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateStepTitle = useCanvasStore((s) => s.updateStepTitle);
  const updateStepStatus = useCanvasStore((s) => s.updateStepStatus);
  const deleteStep = useCanvasStore((s) => s.deleteStep);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== data.title) {
      updateStepTitle(id, trimmed);
    } else {
      setEditValue(data.title);
    }
    setIsEditing(false);
  }, [editValue, data.title, id, updateStepTitle]);

  const cycleStatus = useCallback(() => {
    if (data.status === "locked") return;
    const idx = statusCycle.indexOf(data.status);
    const next = statusCycle[(idx + 1) % statusCycle.length];
    updateStepStatus(id, next);
  }, [id, data.status, updateStepStatus]);

  const { icon: StatusIcon, className: statusClass, label: statusLabel } =
    statusConfig[data.status];

  return (
    <div
      className={`
        rounded-lg border bg-card px-3 py-2 shadow-sm min-w-[160px] max-w-[240px]
        ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"}
      `}
    >
      <div className="flex items-center gap-2">
        <button
          className={`shrink-0 ${statusClass} ${data.status === "locked" ? "cursor-not-allowed" : "cursor-pointer hover:opacity-70"}`}
          onClick={cycleStatus}
          title={statusLabel}
        >
          <StatusIcon className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              className="w-full bg-transparent text-sm outline-none border-b border-primary"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") {
                  setEditValue(data.title);
                  setIsEditing(false);
                }
              }}
            />
          ) : (
            <span
              className={`text-sm truncate block cursor-text ${data.status === "completed" ? "line-through text-muted-foreground" : ""}`}
              onDoubleClick={() => setIsEditing(true)}
            >
              {data.title}
            </span>
          )}
        </div>

        <button
          className="shrink-0 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          onClick={() => deleteStep(id)}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-1.5 !h-1.5 !bg-muted-foreground !border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-1.5 !h-1.5 !bg-muted-foreground !border-background"
      />
    </div>
  );
}

export const StepNode = memo(StepNodeComponent);
