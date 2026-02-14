"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "@/components/canvas/canvas";

export default function Home() {
  return (
    <div className="h-screen w-screen">
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
    </div>
  );
}
