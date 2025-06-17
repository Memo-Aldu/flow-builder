/**
 * Client-side unified API functions
 * These functions work for both authenticated and guest users in client components
 */

import { CreateCredentialSchemaType } from "@/schema/credential";
import { CreateWorkflowSchemaType } from "@/schema/workflow";
import { Balance } from "@/types/balances";
import { SortDir } from "@/types/base";
import { CheckoutSession, PackageType, Purchase } from "@/types/billing";
import {
    Credential,
    CredentialSortField
} from "@/types/credential";

import {
    ExecutionStats,
    WorkflowExecution,
    WorkflowExecutionCreate,
    WorkflowExecutionSortField,
    WorkflowExecutionUpdate
} from "@/types/executions";
import { ExecutionLog, ExecutionLogSortField } from "@/types/logs";
import { ExecutionPhase, ExecutionPhaseSortField } from "@/types/phases";
import { WorkflowVersion, WorkflowVersionCreate, WorkflowVersionSortField } from "@/types/versions";
import {
    Workflow,
    WorkflowPublishRequest,
    WorkflowSortField,
    WorkflowUpdateRequest
} from "@/types/workflows";
import { UnifiedClientAPI } from "./unified-api";

export const UnifiedCredentialsAPI = {
  // Client-side functions
  client: {
    async list(
      page: number = 1,
      limit: number = 10,
      sort: CredentialSortField = CredentialSortField.CREATED_AT,
      order: SortDir = "desc",
      token?: string
    ): Promise<Credential[]> {
      return UnifiedClientAPI.get("/api/v1/credentials", { page, limit, sort, order }, token);
    },

    async create(data: CreateCredentialSchemaType, token?: string): Promise<Credential> {
      return UnifiedClientAPI.post("/api/v1/credentials", data, token);
    },

    async delete(credentialId: string, token?: string): Promise<void> {
      return UnifiedClientAPI.delete(`/api/v1/credentials/${credentialId}`, token);
    }
  }
};

export const UnifiedWorkflowsAPI = {
  // Client-side functions
  client: {
    async list(
      page: number = 1,
      limit: number = 10,
      sort: WorkflowSortField = WorkflowSortField.UPDATED_AT,
      order: SortDir = "desc",
      token?: string
    ): Promise<Workflow[]> {
      return UnifiedClientAPI.get("/api/v1/workflows", { page, limit, sort, order }, token);
    },

    async get(workflowId: string, token?: string): Promise<Workflow> {
      return UnifiedClientAPI.get(`/api/v1/workflows/${workflowId}`, undefined, token);
    },

    async create(data: CreateWorkflowSchemaType, token?: string): Promise<Workflow> {
      return UnifiedClientAPI.post("/api/v1/workflows", { ...data, status: 'draft' }, token);
    },

    async update(workflowId: string, data: WorkflowUpdateRequest, token?: string): Promise<Workflow> {
      return UnifiedClientAPI.patch(`/api/v1/workflows/${workflowId}`, data, undefined, token);
    },

    async delete(workflowId: string, token?: string): Promise<void> {
      return UnifiedClientAPI.delete(`/api/v1/workflows/${workflowId}`, token);
    },

    async publish(workflowId: string, data: WorkflowPublishRequest, token?: string): Promise<Workflow> {
      return UnifiedClientAPI.patch(`/api/v1/workflows/${workflowId}/publish`, data, undefined, token);
    },

    async unpublish(workflowId: string, token?: string): Promise<Workflow> {
      return UnifiedClientAPI.patch(`/api/v1/workflows/${workflowId}/unpublish`, null, undefined, token);
    },

    async unschedule(workflowId: string, token?: string): Promise<Workflow> {
      return UnifiedClientAPI.patch(`/api/v1/workflows/${workflowId}/unschedule`, null, undefined, token);
    },

    async rollback(workflowId: string, versionId: string, token?: string): Promise<Workflow> {
      return UnifiedClientAPI.patch(`/api/v1/workflows/${workflowId}/rollback`, null, { version_id: versionId }, token);
    }
  }
};

export const UnifiedExecutionsAPI = {
  // Client-side functions
  client: {
    async list(
      workflowId?: string,
      page: number = 1,
      limit: number = 10,
      sort: WorkflowExecutionSortField = WorkflowExecutionSortField.STARTED_AT,
      order: SortDir = "desc",
      token?: string
    ): Promise<WorkflowExecution[]> {
      const params: any = { page, limit, sort, order };
      if (workflowId) params.workflow_id = workflowId;
      return UnifiedClientAPI.get("/api/v1/executions", params, token);
    },

    async get(executionId: string, token?: string): Promise<WorkflowExecution> {
      return UnifiedClientAPI.get(`/api/v1/executions/${executionId}`, undefined, token);
    },

    async create(data: WorkflowExecutionCreate, token?: string): Promise<WorkflowExecution> {
      return UnifiedClientAPI.post("/api/v1/executions", data, token);
    },

    async update(executionId: string, data: WorkflowExecutionUpdate, token?: string): Promise<WorkflowExecution> {
      return UnifiedClientAPI.patch(`/api/v1/executions/${executionId}`, data, {}, token);
    },

    async delete(executionId: string, token?: string): Promise<void> {
      return UnifiedClientAPI.delete(`/api/v1/executions/${executionId}`, token);
    },

    async getStats(startDate: string, endDate: string, token?: string): Promise<ExecutionStats> {
      return UnifiedClientAPI.get("/api/v1/executions/stats", { 
        start_date: startDate, 
        end_date: endDate 
      }, token);
    }
  }
};

export const UnifiedBalancesAPI = {
  // Client-side functions
  client: {
    async get(token?: string): Promise<Balance> {
      return UnifiedClientAPI.get("/api/v1/balances", undefined, token);
    }
  }
};

export const UnifiedPhasesAPI = {
  // Client-side functions
  client: {
    async get(phaseId: string, token?: string): Promise<ExecutionPhase> {
      return UnifiedClientAPI.get(`/api/v1/phases/${phaseId}`, undefined, token);
    },

    async list(
      executionId: string,
      page: number = 1,
      limit: number = 25,
      sort: ExecutionPhaseSortField = ExecutionPhaseSortField.STARTED_AT,
      order: SortDir = "asc",
      token?: string
    ): Promise<ExecutionPhase[]> {
      return UnifiedClientAPI.get("/api/v1/phases", {
        execution_id: executionId,
        page,
        limit,
        sort,
        order
      }, token);
    }
  }
};

export const UnifiedLogsAPI = {
  // Client-side functions
  client: {
    async get(logId: string, token?: string): Promise<ExecutionLog> {
      return UnifiedClientAPI.get(`/api/v1/logs/${logId}`, undefined, token);
    },

    async list(
      executionPhaseId: string,
      page: number = 1,
      limit: number = 10,
      sort: ExecutionLogSortField = ExecutionLogSortField.TIMESTAMP,
      order: SortDir = "asc",
      token?: string
    ): Promise<ExecutionLog[]> {
      return UnifiedClientAPI.get("/api/v1/logs", {
        execution_phase_id: executionPhaseId,
        page,
        limit,
        sort,
        order
      }, token);
    }
  }
};

export const UnifiedVersionsAPI = {
  // Client-side functions
  client: {
    async get(workflowId: string, versionId: string, token?: string): Promise<WorkflowVersion> {
      return UnifiedClientAPI.get(`/api/v1/workflows/${workflowId}/versions/${versionId}`, undefined, token);
    },

    async getByNumber(workflowId: string, versionNumber: number, token?: string): Promise<WorkflowVersion> {
      return UnifiedClientAPI.get(`/api/v1/workflows/${workflowId}/versions/number/${versionNumber}`, undefined, token);
    },

    async list(
      workflowId: string,
      page: number = 1,
      limit: number = 10,
      sort: WorkflowVersionSortField = WorkflowVersionSortField.VERSION_NUMBER,
      order: SortDir = "desc",
      token?: string
    ): Promise<WorkflowVersion[]> {
      return UnifiedClientAPI.get(`/api/v1/workflows/${workflowId}/versions`, {
        page,
        limit,
        sort,
        order
      }, token);
    },

    async create(workflowId: string, data: WorkflowVersionCreate, token?: string): Promise<WorkflowVersion> {
      return UnifiedClientAPI.post(`/api/v1/workflows/${workflowId}/versions`, data, token);
    }
  }
};

export const UnifiedPurchasesAPI = {
  // Client-side functions
  client: {
    async list(page: number = 1, limit: number = 10, token?: string): Promise<Purchase[]> {
      return UnifiedClientAPI.get("/api/v1/purchases", { page, limit }, token);
    },

    async createCheckoutSession(packageType: PackageType, token?: string): Promise<CheckoutSession> {
      return UnifiedClientAPI.post("/api/v1/purchases/checkout", null, token);
    }
  }
};

export const UnifiedUsersAPI = {
  // Client-side functions
  client: {
    async getCurrent(token?: string): Promise<any> {
      return UnifiedClientAPI.get("/api/v1/users/current", undefined, token);
    },

    async create(token?: string): Promise<any> {
      return UnifiedClientAPI.post("/api/v1/users", null, token);
    }
  }
};
