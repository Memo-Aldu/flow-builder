import { api, getAuthHeaders } from "@/lib/api/axios";
import { AxiosResponse } from "axios";
import { SortDir } from "@/types/base";
import { WorkflowVersion, WorkflowVersionSortField } from "@/types/versions";

export const getWorkflowVersionByNumber = async (
  workflowId: string,
  versionNumber: number,
  token: string
): Promise<WorkflowVersion> => {
  const response: AxiosResponse<WorkflowVersion> = await api.get(`/api/v1/workflows/${workflowId}/versions/number/${versionNumber}`, {
    headers: getAuthHeaders(token)
  });
  return response.data;
}

export const getWorkflowVersion = async (
  workflowId: string,
  versionId: string,
  token: string
): Promise<WorkflowVersion> => {
  const response: AxiosResponse<WorkflowVersion> = await api.get(`/api/v1/workflows/${workflowId}/versions/${versionId}`, {
    headers: getAuthHeaders(token)
  });
  return response.data;
}

export const getWorkflowVersions = async (
  workflowId: string,
  token: string,
  page: number = 1,
  limit: number = 10,
  sortField: WorkflowVersionSortField = WorkflowVersionSortField.VERSION_NUMBER,
  sortDir: SortDir = "desc"
): Promise<WorkflowVersion[]> => {
  const response: AxiosResponse<WorkflowVersion[]> = await api.get(`/api/v1/workflows/${workflowId}/versions`, {
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