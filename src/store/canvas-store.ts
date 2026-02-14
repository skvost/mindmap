"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Node, Edge } from "@xyflow/react";
import type { GoalNodeData } from "@/components/canvas/goal-node";
import type { StepNodeData } from "@/components/canvas/step-node";
import type { StepStatus } from "@/types";
import type { Connection } from "@xyflow/react";
import { layoutGoalSteps } from "@/lib/dagre-layout";
import { DEPENDENCY_MARKER_END } from "@/components/canvas/dependency-edge";

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  setSelectedNodeId: (id: string | null) => void;

  addGoal: (position: { x: number; y: number }) => void;
  updateGoalTitle: (id: string, title: string) => void;
  deleteGoal: (id: string) => void;
  toggleGoalCollapsed: (id: string) => void;

  addStep: (goalId: string) => void;
  updateStepTitle: (id: string, title: string) => void;
  updateStepStatus: (id: string, status: StepStatus) => void;
  deleteStep: (id: string) => void;

  addDependencyEdge: (connection: Connection) => void;
  deleteEdge: (id: string) => void;
  isValidConnection: (connection: Connection) => boolean;

  layoutGoal: (goalId: string) => void;
}

let counter = 0;
function uid(prefix: string) {
  counter++;
  return `${prefix}-${Date.now()}-${counter}`;
}

/** Recompute step counts on each goal node. */
function syncGoalStepCounts(nodes: Node[]): Node[] {
  const stepsByGoal = new Map<string, { total: number; completed: number }>();

  for (const n of nodes) {
    if (n.type === "step") {
      const d = n.data as StepNodeData;
      const counts = stepsByGoal.get(d.goalId) ?? { total: 0, completed: 0 };
      counts.total++;
      if (d.status === "completed") counts.completed++;
      stepsByGoal.set(d.goalId, counts);
    }
  }

  return nodes.map((n) => {
    if (n.type !== "goal") return n;
    const counts = stepsByGoal.get(n.id) ?? { total: 0, completed: 0 };
    const data = n.data as GoalNodeData;
    if (
      data.stepCount === counts.total &&
      data.completedStepCount === counts.completed
    )
      return n;
    return {
      ...n,
      data: {
        ...data,
        stepCount: counts.total,
        completedStepCount: counts.completed,
      },
    };
  });
}

/**
 * Recompute lock/available status for all steps based on dependency edges.
 * - A step with no incoming dependency edges stays as-is (available by default).
 * - A step with incoming edges: locked if any dependency is not completed,
 *   available (unlocked) if all are completed.
 * - Steps that are in_progress or completed are never reverted to locked/available.
 */
function recomputeStepLocks(nodes: Node[], edges: Edge[]): Node[] {
  // Build map: stepId -> set of dependency stepIds (incoming edges = things I depend on)
  const depsOf = new Map<string, Set<string>>();
  for (const e of edges) {
    if (e.type !== "dependency") continue;
    const set = depsOf.get(e.target) ?? new Set();
    set.add(e.source);
    depsOf.set(e.target, set);
  }

  // Build a lookup of step statuses
  const statusOf = new Map<string, StepStatus>();
  for (const n of nodes) {
    if (n.type === "step") {
      statusOf.set(n.id, (n.data as StepNodeData).status);
    }
  }

  return nodes.map((n) => {
    if (n.type !== "step") return n;
    const data = n.data as StepNodeData;

    // Don't touch in_progress or completed steps
    if (data.status === "in_progress" || data.status === "completed") return n;

    const deps = depsOf.get(n.id);
    if (!deps || deps.size === 0) {
      // No dependencies — should be available
      if (data.status === "locked") {
        return { ...n, data: { ...data, status: "available" as StepStatus } };
      }
      return n;
    }

    // Has dependencies — check if all are completed
    const allDepsCompleted = [...deps].every(
      (depId) => statusOf.get(depId) === "completed",
    );

    const shouldBe: StepStatus = allDepsCompleted ? "available" : "locked";
    if (data.status === shouldBe) return n;
    return { ...n, data: { ...data, status: shouldBe } };
  });
}

/** Run both sync passes: step locks then goal counts. */
function syncAll(nodes: Node[], edges: Edge[]): Node[] {
  return syncGoalStepCounts(recomputeStepLocks(nodes, edges));
}

export const useCanvasStore = create<CanvasState>()(
  subscribeWithSelector((set) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,

    setNodes: (nodes) =>
      set((state) => ({
        nodes: typeof nodes === "function" ? nodes(state.nodes) : nodes,
      })),
    setEdges: (edges) =>
      set((state) => ({
        edges: typeof edges === "function" ? edges(state.edges) : edges,
      })),
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),

    addGoal: (position) => {
      const id = uid("goal");
      const newNode: Node<GoalNodeData> = {
        id,
        type: "goal",
        position,
        data: {
          title: "New Goal",
          isCollapsed: false,
          stepCount: 0,
          completedStepCount: 0,
        },
      };
      set((state) => ({ nodes: [...state.nodes, newNode] }));
    },

    updateGoalTitle: (id, title) =>
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, title } } : n,
        ),
      })),

    deleteGoal: (id) =>
      set((state) => {
        const stepIds = new Set(
          state.nodes
            .filter(
              (n) =>
                n.type === "step" &&
                (n.data as StepNodeData).goalId === id,
            )
            .map((n) => n.id),
        );
        return {
          nodes: state.nodes.filter((n) => n.id !== id && !stepIds.has(n.id)),
          edges: state.edges.filter(
            (e) =>
              e.source !== id &&
              e.target !== id &&
              !stepIds.has(e.source) &&
              !stepIds.has(e.target),
          ),
        };
      }),

    toggleGoalCollapsed: (id) =>
      set((state) => ({
        nodes: state.nodes.map((n) => {
          if (n.id !== id) return n;
          const data = n.data as GoalNodeData;
          return { ...n, data: { ...data, isCollapsed: !data.isCollapsed } };
        }),
      })),

    addStep: (goalId) =>
      set((state) => {
        const goal = state.nodes.find((n) => n.id === goalId);
        if (!goal) return state;

        const existingSteps = state.nodes.filter(
          (n) =>
            n.type === "step" &&
            (n.data as StepNodeData).goalId === goalId,
        );
        const offset = existingSteps.length;

        const stepId = uid("step");
        const newStep: Node<StepNodeData> = {
          id: stepId,
          type: "step",
          position: {
            x: goal.position.x + 20,
            y: goal.position.y + 80 + offset * 60,
          },
          data: {
            title: "New Step",
            goalId,
            status: "available",
          },
        };

        return { nodes: syncAll([...state.nodes, newStep], state.edges) };
      }),

    updateStepTitle: (id, title) =>
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, title } } : n,
        ),
      })),

    updateStepStatus: (id, status) =>
      set((state) => {
        const nodes = state.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, status } } : n,
        );
        return { nodes: syncAll(nodes, state.edges) };
      }),

    deleteStep: (id) =>
      set((state) => {
        const filtered = state.nodes.filter((n) => n.id !== id);
        const edges = state.edges.filter(
          (e) => e.source !== id && e.target !== id,
        );
        return { nodes: syncAll(filtered, edges), edges };
      }),

    addDependencyEdge: (connection) => {
      if (!connection.source || !connection.target) return;
      set((state) => {
        const duplicate = state.edges.some(
          (e) =>
            e.source === connection.source &&
            e.target === connection.target,
        );
        if (duplicate) return state;

        const edge: Edge = {
          id: uid("edge"),
          source: connection.source,
          target: connection.target,
          type: "dependency",
          markerEnd: DEPENDENCY_MARKER_END,
        };
        const edges = [...state.edges, edge];
        return { nodes: syncAll(state.nodes, edges), edges };
      });
    },

    deleteEdge: (id) =>
      set((state) => {
        const edges = state.edges.filter((e) => e.id !== id);
        return { nodes: syncAll(state.nodes, edges), edges };
      }),

    isValidConnection: (connection) => {
      const state = useCanvasStore.getState();
      if (!connection.source || !connection.target) return false;
      if (connection.source === connection.target) return false;

      const sourceNode = state.nodes.find(
        (n) => n.id === connection.source,
      );
      const targetNode = state.nodes.find(
        (n) => n.id === connection.target,
      );
      if (!sourceNode || !targetNode) return false;
      if (sourceNode.type !== "step" || targetNode.type !== "step")
        return false;

      const sourceGoalId = (sourceNode.data as StepNodeData).goalId;
      const targetGoalId = (targetNode.data as StepNodeData).goalId;
      if (sourceGoalId !== targetGoalId) return false;

      const duplicate = state.edges.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target,
      );
      if (duplicate) return false;

      // Prevent cycles: check if target can already reach source
      const visited = new Set<string>();
      const queue = [connection.target];
      while (queue.length > 0) {
        const current = queue.pop()!;
        if (current === connection.source) return false;
        if (visited.has(current)) continue;
        visited.add(current);
        for (const e of state.edges) {
          if (e.source === current) queue.push(e.target);
        }
      }

      return true;
    },

    layoutGoal: (goalId) =>
      set((state) => {
        const goal = state.nodes.find((n) => n.id === goalId);
        if (!goal) return state;

        const stepNodes = state.nodes.filter(
          (n) =>
            n.type === "step" &&
            (n.data as StepNodeData).goalId === goalId,
        );
        if (stepNodes.length === 0) return state;

        const laid = layoutGoalSteps(goal, stepNodes, state.edges);
        const laidMap = new Map(laid.map((n) => [n.id, n]));

        return {
          nodes: state.nodes.map((n) => laidMap.get(n.id) ?? n),
        };
      }),
  })),
);
