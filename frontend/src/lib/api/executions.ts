import { WorkflowExecution, WorkflowExecutionCreate, WorkflowExecutionSortField, WorkflowExecutionUpdate } from "@/types/executions";
import { api, getAuthHeaders } from "@/lib/api/axios";
import { AxiosResponse } from "axios";
import { SortDir } from "@/types/base";


export async function getExecutions(
  token: string, 
  workflowId: string,
  page: number = 1, 
  limit: number = 10,
  sortField: WorkflowExecutionSortField = WorkflowExecutionSortField.STARTED_AT,
  sortDir: SortDir = "desc"
): Promise<WorkflowExecution[]> {
  const res = await api.get<WorkflowExecution[]>("/api/v1/executions", {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      workflow_id: workflowId,
      page: page,
      limit: limit,
      sort: sortField,
      order: sortDir
    }
  });
  return res.data;
}


export async function getExecution(
  token: string,
  executionId: string
): Promise<WorkflowExecution> {
  const response: AxiosResponse<WorkflowExecution> = await api.get(
    `/api/v1/executions/${executionId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
}


export async function createExecution(
  token: string,
  executionData: WorkflowExecutionCreate
): Promise<WorkflowExecution> {
  const response: AxiosResponse<WorkflowExecution> = await api.post(
    "/api/v1/executions",
    executionData,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
}


export async function updateExecution(
  token: string,
  executionId: string,
  updateData: WorkflowExecutionUpdate
): Promise<WorkflowExecution> {
  const response: AxiosResponse<WorkflowExecution> = await api.patch(
    `/api/v1/executions/${executionId}`,
    updateData,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
}


export async function deleteExecution(
  token: string,
  executionId: string
): Promise<void> {
  await api.delete(`/api/v1/executions/${executionId}`, {
    headers: getAuthHeaders(token),
  });
}
