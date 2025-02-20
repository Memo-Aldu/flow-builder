import { Balance } from "@/types/balances";
import { api, getAuthHeaders } from "@/lib/api/axios";
import { AxiosResponse } from "axios";


export async function getCredit(
  token: string
): Promise<number> {
  let url = "/api/v1/balances";
  const response: AxiosResponse<Balance> = await api.get(url, {
    headers: getAuthHeaders(token),
  });
  if (response.data) {
    return response.data.credits;
  }
  return -1;
}