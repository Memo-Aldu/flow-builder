import { api, getAuthHeaders } from "@/lib/api/axios";
import { User } from "@clerk/nextjs/server";
import { AxiosResponse } from "axios";


export async function getUser(
  token: string
): Promise<User> {
  let url = "/api/v1/users";
  const response: AxiosResponse<User> = await api.get(url, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}


export async function createUser(
  token: string
): Promise<User> {
  const response: AxiosResponse<User> = await api.post(`/api/v1/users`, null, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}