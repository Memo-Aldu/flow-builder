export enum ExecutionPhaseStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
}
  

export interface ExecutionPhase {
    workflow_execution_id: string;
    number: number;
    name?: string;
    status: ExecutionPhaseStatus;
    started_at: string;
    completed_at: string | null;
    node?: Record<string, any>; 
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
    credits_consumed?: number;
    id: string;
}
  

export interface ExecutionLog {
    execution_phase_id: string;
    log_level: "debug" | "info" | "warning" | "error";
    message: string;
    timestamp: string;
    id: string;
}
  