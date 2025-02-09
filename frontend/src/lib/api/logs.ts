import { ExecutionLog } from "@/types/phases";
import { api, getAuthHeaders } from "@/lib/api/axios";
import { AxiosResponse } from "axios";


export async function getLog(
    token: string,
    logId: string
  ): Promise<ExecutionLog> {
    const response: AxiosResponse<ExecutionLog> = await api.get(
      `/api/v1/logs/${logId}`,
      { headers: getAuthHeaders(token) }
    );
    return response.data;
}
  

export async function listLogs(
    token: string,
    executionPhaseId: string
  ): Promise<ExecutionLog[]> {
    const response: AxiosResponse<ExecutionLog[]> = await api.get(
      `/api/v1/logs`,
      {
        headers: getAuthHeaders(token),
        params: { execution_phase_id: executionPhaseId },
      }
    );
    return response.data;
}
  