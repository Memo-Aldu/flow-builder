import { LucideProps } from "lucide-react";
import React from "react";
import { TaskParam, TaskType } from "@/types/task";
import { AppNode } from "@/types/nodes";
import { WorkflowVersion } from "./versions";

export type WorkflowStatus = "draft" | "active" | "disabled";

export enum WorkflowStatusEnum {
    DRAFT = "draft",
    ACTIVE = "active",
    DISABLED = "disabled",
}

export enum WorkflowSortField {
    NAME = "name",
    CREATED_AT = "created_at",
    UPDATED_AT = "updated_at",
    STATUS = "status",
    CREDITS_COST = "credits_cost",
    LAST_RUN_AT = "last_run_at",
    NEXT_RUN_AT = "next_run_at",
}

export type WorkflowExecutionPlanPhase = {
  phase: number;
  nodes: AppNode[];
};

export type WorkflowExecutionPlan = WorkflowExecutionPlanPhase[];

export type WorkflowTask = {
  label: string;
  icon: React.FC<LucideProps>;
  type: TaskType;
  description?: string;
  isEntryPoint?: boolean;
  inputs: TaskParam[];
  outputs: TaskParam[];
  credits: number;
}

export interface WorkflowCreateRequest {
  name: string;
  description?: string | null;
  cron?: string | null;
  status: WorkflowStatus;
  credits_cost?: number | null;
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
  active_version_id?: string | null;
}


export interface Workflow {
  id: string;
  name: string;
  description?: string | null;
  cron?: string | null;
  status: WorkflowStatus;
  created_at: string;
  updated_at: string;
  credits_cost?: number | null;
  last_run_id?: string | null;
  active_version_id?: string | null;
  last_run_status?: string | null;
  last_run_at?: string | null;
  next_run_at?: string | null;
  active_version?: WorkflowVersion | null;
  versions?: WorkflowVersion[];
}


export type WorkflowListResponse = Workflow[];


export type WorkflowSingleResponse = Workflow;