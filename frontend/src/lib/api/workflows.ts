import {
  WorkflowListResponse,
  WorkflowSingleResponse,
  WorkflowUpdateRequest,
  Workflow,
  WorkflowStatusEnum,
  WorkflowSortField,
} from "@/types/workflows";
import { CreateWorkflowSchemaType, createWorkflowSchema } from "@/schema/workflow";
import { api, getAuthHeaders } from "@/lib/api/axios";
import { AxiosResponse } from "axios";
import { SortDir } from "@/types/base";


export async function getWorkflows(
  token: string,
  page: number = 1,
  limit: number = 10,
  sortField: WorkflowSortField = WorkflowSortField.UPDATED_AT,
  sortDir: SortDir = "desc"
): Promise<WorkflowListResponse> {
  const response: AxiosResponse<WorkflowListResponse> = await api.get("/api/v1/workflows", {
    headers: getAuthHeaders(token),
    params: {
      page: page,
      limit: limit,
      sort: sortField,
      order: sortDir
    }
  });
  return response.data;
}


export async function createWorkflow(
  form: CreateWorkflowSchemaType,
  token: string
): Promise<Workflow> {
  const { success, data } = createWorkflowSchema.safeParse(form);
  if (!success) {
    throw new Error("Invalid form data");
  }

  const payload = { ...data, status: WorkflowStatusEnum.DRAFT };

  const response: AxiosResponse<Workflow> = await api.post("/api/v1/workflows", payload, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}


export async function getWorkflow(
  workflowId: string,
  token: string
): Promise<WorkflowSingleResponse> {
  const response: AxiosResponse<WorkflowSingleResponse> = await api.get(
    `/api/v1/workflows/${workflowId}`,
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
}


export async function updateWorkflow(
  workflowId: string,
  data: WorkflowUpdateRequest,
  token: string
): Promise<Workflow> {
  const response: AxiosResponse<Workflow> = await api.patch(
    `/api/v1/workflows/${workflowId}`,
    data,
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
}


export async function rollbackWorkflow(
  workflowId: string,
  versionId: string,
  token: string
): Promise<Workflow> {
  const response: AxiosResponse<Workflow> = await api.patch(
    `/api/v1/workflows/${workflowId}/rollback`, null, {
    headers: getAuthHeaders(token),
    params: {
      version_id: versionId
    }
  });
  return response.data;
}


export async function deleteWorkflow(
  workflowId: string,
  token: string
): Promise<void> {
  await api.delete(`/api/v1/workflows/${workflowId}`, {
    headers: getAuthHeaders(token),
  });
}
