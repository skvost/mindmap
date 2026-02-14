import type { NodeTypes } from "@xyflow/react";
import { GoalNode } from "./goal-node";
import { StepNode } from "./step-node";

export const nodeTypes: NodeTypes = {
  goal: GoalNode,
  step: StepNode,
};
