import { Credential, CredentialCreate, CredentialSortField } from "@/types/credential";
import { api, getAuthHeaders } from "@/lib/api/axios";
import { AxiosResponse } from "axios";
import { SortDir } from "@/types/base";
import { createCredentialSchema, CreateCredentialSchemaType } from "@/schema/credential";

export async function getCredentials(
    token: string,
    page: number = 1,
    limit: number = 10,
    sort: CredentialSortField = CredentialSortField.CREATED_AT,
    order: SortDir = "desc"
): Promise<Credential[]> {
    const response = await api.get<Credential[]>("/api/v1/credentials", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
            page: page,
            limit: limit,
            sort: sort,
            order: order
        }
    });
    return response.data;
}


export async function getCredential(
    token: string,
    credentialId: string
): Promise<Credential> {
    const response: AxiosResponse<Credential> = await api.get(
        `/api/v1/credentials/${credentialId}`,
        { headers: getAuthHeaders(token) }
    );
    return response.data;
}


export async function createCredential(
    token: string,
    form: CreateCredentialSchemaType
): Promise<Credential> {
    const { success, data } = createCredentialSchema.safeParse(form);
    if (!success) {
        throw new Error("Invalid form data");
    }

    const response: AxiosResponse<Credential> = await api.post(
        "/api/v1/credentials",
        data,
        { headers: getAuthHeaders(token) }
    );
    return response.data;
}


export async function deleteCredential(
    token: string,
    credentialId: string
): Promise<void> {
    await api.delete(`/api/v1/credentials/${credentialId}`, {
        headers: getAuthHeaders(token)
    });
}
