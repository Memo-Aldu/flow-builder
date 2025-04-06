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
  CANCELED = "cancelled",
}


export enum WorkflowExecutionSortField {
  CREATED_AT = "created_at",
  STARTED_AT = "started_at",
  COMPLETED_AT = "completed_at",
  CREDITS_CONSUMED = "credits_consumed",
  TRIGGER = "trigger",
  STATUS = "status",
}

export const WorkflowExecutionSortFieldLabels: Record<WorkflowExecutionSortField, string> = {
  [WorkflowExecutionSortField.CREATED_AT]: "Created at",
  [WorkflowExecutionSortField.STARTED_AT]: "Started at",
  [WorkflowExecutionSortField.COMPLETED_AT]: "Completed at",
  [WorkflowExecutionSortField.CREDITS_CONSUMED]: "Credits consumed",
  [WorkflowExecutionSortField.TRIGGER]: "Trigger",
  [WorkflowExecutionSortField.STATUS]: "Status",
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


export interface ExecutionStats {
  num_executions: number;
  total_credits: number;
  num_phases: number;
  execution_dates_status: Array<{ date: string; success: number; failure: number }>;
  credits_dates_status: Array<{ date: string; success: number; failure: number }>;
}