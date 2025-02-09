export enum ExecutionTrigger {
  SCHEDULED = "scheduled",
  MANUAL = "manual",
  API = "api",
}

export enum ExecutionStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELED = "canceled",
}


export interface WorkflowExecution {
  workflow_id: string;
  trigger: ExecutionTrigger;
  status: ExecutionStatus;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  credits_consumed: number | null;
  id: string;
}


export interface WorkflowExecutionCreate {
  workflow_id: string;
  trigger?: ExecutionTrigger;
  status?: ExecutionStatus;
  created_at?: string;
  updated_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  credits_consumed?: number | null;
}


export interface WorkflowExecutionUpdate {
  trigger?: ExecutionTrigger;
  status?: ExecutionStatus;
  started_at?: string | null;
  completed_at?: string | null;
  credits_consumed?: number | null;
}
