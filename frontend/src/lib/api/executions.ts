import { WorkflowExecution, WorkflowExecutionCreate, WorkflowExecutionUpdate } from "@/types/executions";
import { api, getAuthHeaders } from "@/lib/api/axios";
import { AxiosResponse } from "axios";


export async function getExecutions(
  token: string,
  workflowId?: string
): Promise<WorkflowExecution[]> {
  let url = "/api/v1/executions";
  if (workflowId) {
    url += `?workflow_id=${workflowId}`;
  }
  const response: AxiosResponse<WorkflowExecution[]> = await api.get(url, {
    headers: getAuthHeaders(token),
  });
  return response.data.toSorted((a, b) => a.completed_at! < b.completed_at! ? 1 : -1)
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
