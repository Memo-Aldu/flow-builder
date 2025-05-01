import { api, getAuthHeaders } from "@/lib/api/axios";
import { AxiosResponse } from "axios";
import { PackageType, CheckoutSession } from '@/types/billing';

export async function createCheckoutSession(
  token: string,
  _package: PackageType,
): Promise<CheckoutSession> {
  const response: AxiosResponse<CheckoutSession> = await api.post(
    "/api/v1/purchases/checkout", null, {
        headers: getAuthHeaders(token),
        params: {
            package: _package,
        }
      });
  return response.data;
}


export async function getPurchases(
  token: string,
  page: number = 1,
  limit: number = 10,
): Promise<CheckoutSession[]> {
  const response: AxiosResponse<CheckoutSession[]> = await api.get(
    "/api/v1/purchases", {
        headers: getAuthHeaders(token),
        params: {
            page: page,
            limit: limit,
        }
      });
  return response.data;
}

