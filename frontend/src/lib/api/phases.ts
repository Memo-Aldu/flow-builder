import { ExecutionPhase } from "@/types/phases";
import { api, getAuthHeaders } from "@/lib/api/axios";
import { AxiosResponse } from "axios";


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
  executionId: string
): Promise<ExecutionPhase[]> {
  const response: AxiosResponse<ExecutionPhase[]> = await api.get(
    `/api/v1/phases`,
    {
      headers: getAuthHeaders(token),
      params: { execution_id: executionId },
    }
  );
  return response.data;
}
