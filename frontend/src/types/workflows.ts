export type WorkflowStatus = "draft" | "active" | "disabled";

export enum WorkflowStatusEnum {
    DRAFT = "draft",
    ACTIVE = "active",
    DISABLED = "disabled",
}

export interface WorkflowCreateRequest {
  name: string;
  description?: string | null;
  definition?: Record<string, any> | null;
  execution_plan?: Record<string, any> | null;
  cron?: string | null;
  status: WorkflowStatus;
}


export interface WorkflowUpdateRequest {
  name?: string | null;
  description?: string | null;
  definition?: Record<string, any> | null;
  execution_plan?: Record<string, any> | null;
  cron?: string | null;
  status?: WorkflowStatus | null;
  credits_cost?: number | null;
  last_run_id?: string | null;
  last_run_status?: string | null;
  last_run_at?: string | null;
  next_run_at?: string | null;
}


export interface Workflow {
  id: string;
  name: string;
  description?: string | null;
  definition?: Record<string, any> | null;
  execution_plan?: Record<string, any> | null;
  cron?: string | null;
  status: WorkflowStatus;
  created_at: string;
  updated_at: string;
  credits_cost?: number | null;
  last_run_id?: string | null;
  last_run_status?: string | null;
  last_run_at?: string | null;
  next_run_at?: string | null;
}


export type WorkflowListResponse = Workflow[];


export type WorkflowSingleResponse = Workflow;