import axios, { AxiosResponse } from "axios";
import {
  WorkflowListResponse,
  WorkflowSingleResponse,
  WorkflowUpdateRequest,
  Workflow,
  WorkflowStatusEnum,
} from "@/types/workflows";
import { CreateWorkflowSchemaType, createWorkflowSchema } from "@/schema/workflow";


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


export async function getWorkflows(token: string): Promise<WorkflowListResponse> {
  const response: AxiosResponse<WorkflowListResponse> = await api.get("/api/v1/workflows", {
    headers: getAuthHeaders(token),
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


export async function deleteWorkflow(
  workflowId: string,
  token: string
): Promise<void> {
  await api.delete(`/api/v1/workflows/${workflowId}`, {
    headers: getAuthHeaders(token),
  });
}
