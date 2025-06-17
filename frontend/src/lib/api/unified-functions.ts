/**
 * Server-side unified API functions
 * These functions work for both authenticated and guest users in server components only
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
import { UnifiedServerAPI } from "./unified-server-api";

export const UnifiedCredentialsAPI = {
  // Server-side functions
  server: {
    async list(
      page: number = 1,
      limit: number = 10,
      sort: CredentialSortField = CredentialSortField.CREATED_AT,
      order: SortDir = "desc"
    ): Promise<Credential[]> {
      return UnifiedServerAPI.get("/api/v1/credentials", { page, limit, sort, order });
    },

    async create(data: CreateCredentialSchemaType): Promise<Credential> {
      return UnifiedServerAPI.post("/api/v1/credentials", data);
    },

    async delete(credentialId: string): Promise<void> {
      return UnifiedServerAPI.delete(`/api/v1/credentials/${credentialId}`);
    }
  }
};

export const UnifiedWorkflowsAPI = {
  // Server-side functions
  server: {
    async list(
      page: number = 1,
      limit: number = 10,
      sort: WorkflowSortField = WorkflowSortField.UPDATED_AT,
      order: SortDir = "desc"
    ): Promise<Workflow[]> {
      return UnifiedServerAPI.get("/api/v1/workflows", { page, limit, sort, order });
    },

    async get(workflowId: string): Promise<Workflow> {
      return UnifiedServerAPI.get(`/api/v1/workflows/${workflowId}`);
    },

    async create(data: CreateWorkflowSchemaType): Promise<Workflow> {
      return UnifiedServerAPI.post("/api/v1/workflows", { ...data, status: 'draft' });
    },

    async update(workflowId: string, data: WorkflowUpdateRequest): Promise<Workflow> {
      return UnifiedServerAPI.patch(`/api/v1/workflows/${workflowId}`, data);
    },

    async delete(workflowId: string): Promise<void> {
      return UnifiedServerAPI.delete(`/api/v1/workflows/${workflowId}`);
    },

    async publish(workflowId: string, data: WorkflowPublishRequest): Promise<Workflow> {
      return UnifiedServerAPI.patch(`/api/v1/workflows/${workflowId}/publish`, data);
    },

    async unpublish(workflowId: string): Promise<Workflow> {
      return UnifiedServerAPI.patch(`/api/v1/workflows/${workflowId}/unpublish`, null);
    },

    async unschedule(workflowId: string): Promise<Workflow> {
      return UnifiedServerAPI.patch(`/api/v1/workflows/${workflowId}/unschedule`, null);
    },

    async rollback(workflowId: string, versionId: string): Promise<Workflow> {
      // pass version_id as query param
      return UnifiedServerAPI.patch(`/api/v1/workflows/${workflowId}/rollback`, { version_id: versionId });
    }
  }
};

export const UnifiedExecutionsAPI = {
  // Server-side functions
  server: {
    async list(
      workflowId?: string,
      page: number = 1,
      limit: number = 10,
      sort: WorkflowExecutionSortField = WorkflowExecutionSortField.STARTED_AT,
      order: SortDir = "desc"
    ): Promise<WorkflowExecution[]> {
      const params: any = { page, limit, sort, order };
      if (workflowId) params.workflow_id = workflowId;
      return UnifiedServerAPI.get("/api/v1/executions", params);
    },

    async get(executionId: string): Promise<WorkflowExecution> {
      return UnifiedServerAPI.get(`/api/v1/executions/${executionId}`);
    },

    async create(data: WorkflowExecutionCreate): Promise<WorkflowExecution> {
      return UnifiedServerAPI.post("/api/v1/executions", data);
    },

    async update(executionId: string, data: WorkflowExecutionUpdate): Promise<WorkflowExecution> {
      return UnifiedServerAPI.patch(`/api/v1/executions/${executionId}`, data);
    },

    async delete(executionId: string): Promise<void> {
      return UnifiedServerAPI.delete(`/api/v1/executions/${executionId}`);
    },

    async getStats(startDate: string, endDate: string): Promise<ExecutionStats> {
      return UnifiedServerAPI.get("/api/v1/executions/stats", { 
        start_date: startDate, 
        end_date: endDate 
      });
    }
  }
};

export const UnifiedBalancesAPI = {
  // Server-side functions
  server: {
    async get(): Promise<Balance> {
      return UnifiedServerAPI.get("/api/v1/balances");
    }
  }
};

export const UnifiedPhasesAPI = {
  // Server-side functions
  server: {
    async get(phaseId: string): Promise<ExecutionPhase> {
      return UnifiedServerAPI.get(`/api/v1/phases/${phaseId}`);
    },

    async list(
      executionId: string,
      page: number = 1,
      limit: number = 25,
      sort: ExecutionPhaseSortField = ExecutionPhaseSortField.STARTED_AT,
      order: SortDir = "asc"
    ): Promise<ExecutionPhase[]> {
      return UnifiedServerAPI.get("/api/v1/phases", {
        execution_id: executionId,
        page,
        limit,
        sort,
        order
      });
    }
  }
};

export const UnifiedLogsAPI = {
  // Server-side functions
  server: {
    async get(logId: string): Promise<ExecutionLog> {
      return UnifiedServerAPI.get(`/api/v1/logs/${logId}`);
    },

    async list(
      executionPhaseId: string,
      page: number = 1,
      limit: number = 10,
      sort: ExecutionLogSortField = ExecutionLogSortField.TIMESTAMP,
      order: SortDir = "asc"
    ): Promise<ExecutionLog[]> {
      return UnifiedServerAPI.get("/api/v1/logs", {
        execution_phase_id: executionPhaseId,
        page,
        limit,
        sort,
        order
      });
    }
  }
};

export const UnifiedVersionsAPI = {
  // Server-side functions
  server: {
    async get(workflowId: string, versionId: string): Promise<WorkflowVersion> {
      return UnifiedServerAPI.get(`/api/v1/workflows/${workflowId}/versions/${versionId}`);
    },

    async getByNumber(workflowId: string, versionNumber: number): Promise<WorkflowVersion> {
      return UnifiedServerAPI.get(`/api/v1/workflows/${workflowId}/versions/number/${versionNumber}`);
    },

    async list(
      workflowId: string,
      page: number = 1,
      limit: number = 10,
      sort: WorkflowVersionSortField = WorkflowVersionSortField.VERSION_NUMBER,
      order: SortDir = "desc"
    ): Promise<WorkflowVersion[]> {
      return UnifiedServerAPI.get(`/api/v1/workflows/${workflowId}/versions`, {
        page,
        limit,
        sort,
        order
      });
    },

    async create(workflowId: string, data: WorkflowVersionCreate): Promise<WorkflowVersion> {
      return UnifiedServerAPI.post(`/api/v1/workflows/${workflowId}/versions`, data);
    }
  }
};

export const UnifiedPurchasesAPI = {
  // Server-side functions
  server: {
    async list(page: number = 1, limit: number = 10): Promise<Purchase[]> {
      return UnifiedServerAPI.get("/api/v1/purchases", { page, limit });
    },

    async createCheckoutSession(packageType: PackageType): Promise<CheckoutSession> {
      return UnifiedServerAPI.post("/api/v1/purchases/checkout", { package: packageType });
    }
  }
};

export const UnifiedUsersAPI = {
  // Server-side functions
  server: {
    async getCurrent(): Promise<any> {
      return UnifiedServerAPI.get("/api/v1/users/current");
    },

    async create(): Promise<any> {
      return UnifiedServerAPI.post("/api/v1/users", null);
    }
  }
};
