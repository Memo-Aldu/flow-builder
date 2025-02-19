import { TaskType } from "@/types/task"

export enum ExecutionPhaseStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
}
  

export interface ExecutionPhase {
    workflow_execution_id: string;
    number: number;
    name: TaskType;
    status: ExecutionPhaseStatus;
    started_at: string;
    completed_at: string | null;
    node?: Record<string, any>; 
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
    credits_consumed?: number;
    id: string;
}
  