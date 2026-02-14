"use client";

import { memo, useState, useRef, useEffect, useCallback } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { ChevronDown, ChevronRight, LayoutGrid, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCanvasStore } from "@/store/canvas-store";

export type GoalNodeData = {
  title: string;
  isCollapsed: boolean;
  stepCount: number;
  completedStepCount: number;
  color?: string;
};

type GoalNode = Node<GoalNodeData, "goal">;

function GoalNodeComponent({ id, data, selected }: NodeProps<GoalNode>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateGoalTitle = useCanvasStore((s) => s.updateGoalTitle);
  const deleteGoal = useCanvasStore((s) => s.deleteGoal);
  const toggleGoalCollapsed = useCanvasStore((s) => s.toggleGoalCollapsed);
  const addStep = useCanvasStore((s) => s.addStep);
  const layoutGoal = useCanvasStore((s) => s.layoutGoal);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== data.title) {
      updateGoalTitle(id, trimmed);
    } else {
      setEditValue(data.title);
    }
    setIsEditing(false);
  }, [editValue, data.title, id, updateGoalTitle]);

  const hasSteps = data.stepCount > 0;
  const isComplete = hasSteps && data.completedStepCount === data.stepCount;
  const progressPct = hasSteps
    ? Math.round((data.completedStepCount / data.stepCount) * 100)
    : 0;

  return (
    <div
      className={`
        rounded-xl border-2 bg-card px-4 py-3 shadow-md min-w-[200px] max-w-[300px] transition-shadow duration-300
        ${isComplete ? "border-green-500 shadow-green-500/25 shadow-lg" : selected ? "border-primary ring-2 ring-primary/20" : "border-border"}
      `}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2">
        {hasSteps && (
          <button
            className="mt-0.5 p-0.5 rounded hover:bg-muted text-muted-foreground"
            onClick={() => toggleGoalCollapsed(id)}
          >
            {data.isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              className="w-full bg-transparent text-base font-semibold outline-none border-b border-primary"
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
            <h3
              className="text-base font-semibold truncate cursor-text"
              onDoubleClick={() => setIsEditing(true)}
            >
              {data.title}
            </h3>
          )}

          {hasSteps && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isComplete ? "bg-green-500" : "bg-primary"}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {data.completedStepCount}/{data.stepCount}
              </span>
            </div>
          )}
        </div>

        <button
          className="mt-0.5 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          onClick={() => addStep(id)}
          title="Add step"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        {hasSteps && (
          <button
            className="mt-0.5 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={() => layoutGoal(id)}
            title="Tidy up steps"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="mt-0.5 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete goal?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &ldquo;{data.title}&rdquo;
                {hasSteps && ` and its ${data.stepCount} step(s)`}. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() => deleteGoal(id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-primary !border-background"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-primary !border-background"
      />
    </div>
  );
}

export const GoalNode = memo(GoalNodeComponent);
