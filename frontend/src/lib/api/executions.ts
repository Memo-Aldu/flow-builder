import { WorkflowExecution, WorkflowExecutionCreate, WorkflowExecutionUpdate } from "@/types/executions";
import axios, { AxiosResponse } from "axios";


const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


const getAuthHeaders = (token: string) => {
  if (!token) {
    throw new Error("User is not authenticated");
  }
  return { Authorization: `Bearer ${token}` };
};


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
  return response.data;
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
