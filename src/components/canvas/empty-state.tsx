"use client";

export function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <p className="text-muted-foreground text-lg select-none">
        Double-click to create your first goal
      </p>
    </div>
  );
}
