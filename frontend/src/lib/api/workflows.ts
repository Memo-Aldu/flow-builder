import {
  WorkflowListResponse,
  WorkflowSingleResponse,
  WorkflowUpdateRequest,
  Workflow,
  WorkflowStatusEnum,
} from "@/types/workflows";
import { CreateWorkflowSchemaType, createWorkflowSchema } from "@/schema/workflow";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function fetchWithAuth(input: RequestInfo, token: string, init?: RequestInit) {

  if (!token) {
    throw new Error("User is not authenticated");
  }

  const headers = {
    ...init?.headers,
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };

  return fetch(input, { ...init, headers });
}

export async function getWorkflows(token: string): Promise<WorkflowListResponse> {
  const res = await fetchWithAuth(`${BASE_URL}/api/v1/workflows`, token);
  if (!res.ok) throw new Error(`Error listing workflows: ${res.statusText}`);
  return res.json();
}

export async function createWorkflow(
  form: CreateWorkflowSchemaType,
  token: string
): Promise<Workflow> {
  	const { success, data } = createWorkflowSchema.safeParse(form); 

    if (!success) {
        throw new Error("Invalid form data");
    }

  	const res = await fetchWithAuth(`${BASE_URL}/api/v1/workflows`, token, {
    	method: "POST",
    	body: JSON.stringify({ ...data, status: WorkflowStatusEnum.DRAFT }),
  	});
  	if (!res.ok) throw new Error(`Error creating workflow: ${res.statusText}`);
  	return res.json();
}

export async function getWorkflow(
  workflowId: string,
  token: string
): Promise<WorkflowSingleResponse> {
  const res = await fetchWithAuth(`${BASE_URL}/api/v1/workflows/${workflowId}`, token);
  if (!res.ok) throw new Error(`Error fetching workflow: ${res.statusText}`);
  return res.json();
}

export async function updateWorkflow(
  workflowId: string,
  data: WorkflowUpdateRequest,
  token: string
): Promise<Workflow> {
  const res = await fetchWithAuth(`${BASE_URL}/api/v1/workflows/${workflowId}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Error updating workflow: ${res.statusText}`);
  return res.json();
}

export async function deleteWorkflow(
  workflowId: string,
  token: string
): Promise<void> {
  const res = await fetchWithAuth(`${BASE_URL}/api/v1/workflows/${workflowId}`, token, {
	method: "DELETE",
  });
  if (!res.ok) throw new Error(`Error deleting workflow: ${res.statusText}`);
}
