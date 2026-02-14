"use client";

import { useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/store/canvas-store";
import { loadCanvasState, saveCanvasState } from "@/lib/persistence";

export function usePersistence() {
  const { setViewport } = useReactFlow();
  const hasLoaded = useRef(false);

  // Load persisted state on mount
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const saved = loadCanvasState();
    if (!saved) return;

    useCanvasStore.getState().setNodes(saved.nodes);
    useCanvasStore.getState().setEdges(saved.edges);
    if (saved.viewport) {
      setViewport(saved.viewport);
    }
  }, [setViewport]);

  // Subscribe to store changes and save (debounced)
  useEffect(() => {
    const unsub = useCanvasStore.subscribe(
      (state) => ({ nodes: state.nodes, edges: state.edges }),
      (slice) => {
        saveCanvasState({ nodes: slice.nodes, edges: slice.edges });
      },
      { equalityFn: Object.is },
    );
    return unsub;
  }, []);
}
