import { api, getAuthHeaders } from "@/lib/api/axios";
import { AxiosResponse } from "axios";
import { PackageType, CheckoutSession } from '@/types/billing';

export async function createCheckoutSession(
  token: string,
  _package: PackageType,
): Promise<CheckoutSession> {
  const response: AxiosResponse<CheckoutSession> = await api.post(
    "/api/v1/payments/checkout", null, {
        headers: getAuthHeaders(token),
        params: {
            package: _package,
        }
      });
  return response.data;
}

