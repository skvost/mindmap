export type StepStatus = "locked" | "available" | "in_progress" | "completed";

export interface Goal {
  id: string;
  title: string;
  positionX: number;
  positionY: number;
  isCollapsed: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Step {
  id: string;
  goalId: string;
  title: string;
  status: StepStatus;
  positionX: number;
  positionY: number;
  createdAt: string;
  updatedAt: string;
}

export interface StepDependency {
  id: string;
  stepId: string;
  dependsOnStepId: string;
  createdAt: string;
}
