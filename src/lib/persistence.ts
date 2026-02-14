"use client";

import type { Node, Edge, Viewport } from "@xyflow/react";

const STORAGE_KEY = "taskflow-canvas";

interface PersistedState {
  nodes: Node[];
  edges: Edge[];
  viewport?: Viewport;
}

export function loadCanvasState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges))
      return null;
    return parsed;
  } catch {
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveCanvasState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }, 300);
}
