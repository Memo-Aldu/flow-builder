export interface Credential {
    id: string;
    name: string;
    created_at: string;
}

export interface CredentialCreate {
    name: string;
    value: string;
}

export enum CredentialSortField {
    CREATED_AT = "created_at",
    NAME = "name",
}