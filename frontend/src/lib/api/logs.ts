import { api, getAuthHeaders } from "@/lib/api/axios";
import { SortDir } from "@/types/base";
import { ExecutionLog, ExecutionLogSortField } from "@/types/logs";
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
  

export async function getLogs(
    token: string,
    executionPhaseId: string,
    page: number = 1,
    limit: number = 10,
    sortField: ExecutionLogSortField = ExecutionLogSortField.TIMESTAMP,
    sortDir: SortDir = "asc"
  ): Promise<ExecutionLog[]> {
    const response: AxiosResponse<ExecutionLog[]> = await api.get(
      `/api/v1/logs`,
      {
        headers: getAuthHeaders(token),
        params: { 
          execution_phase_id: executionPhaseId,
          page: page,
          limit: limit,
          sort: sortField,
          order: sortDir
         },
      }
    );
    return response.data;
}
  