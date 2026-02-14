"use client";

import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";
import type { GoalNodeData } from "@/components/canvas/goal-node";

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
}

let goalCounter = 0;

export const useCanvasStore = create<CanvasState>((set) => ({
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
    goalCounter++;
    const id = `goal-${Date.now()}-${goalCounter}`;
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
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
    })),

  toggleGoalCollapsed: (id) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, isCollapsed: !n.data.isCollapsed } }
          : n,
      ),
    })),
}));
