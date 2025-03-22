import { ExecutionPhase, ExecutionPhaseSortField } from "@/types/phases";
import { api, getAuthHeaders } from "@/lib/api/axios";
import { AxiosResponse } from "axios";
import { SortDir } from "@/types/base";


export async function getPhase(
  token: string,
  phaseId: string
): Promise<ExecutionPhase> {
  const response: AxiosResponse<ExecutionPhase> = await api.get(
    `/api/v1/phases/${phaseId}`,
    { headers: getAuthHeaders(token) }
  );
  return response.data;
}


export async function listPhases(
  token: string,
  executionId: string,
  page: number = 1,
  limit: number = 25,
  sortField: ExecutionPhaseSortField = ExecutionPhaseSortField.STARTED_AT,
  sortDir: SortDir = "asc"
): Promise<ExecutionPhase[]> {
  const response: AxiosResponse<ExecutionPhase[]> = await api.get(
    `/api/v1/phases`,
    {
      headers: getAuthHeaders(token),
      params: { 
        execution_id: executionId,
        page: page,
        limit: limit,
        sort: sortField,
        order: sortDir
      },
    }
  );
  return response.data;
}
