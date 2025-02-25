export interface WorkflowVersion {
    version_number: number;
    created_at: string;
    definition: Record<string, any> | null;
    execution_plan: Record<string, any> | null;
    created_by: string | null;
}


export enum WorkflowVersionSortField {
    CREATED_AT = "created_at",
    VERSION_NUMBER = "version_number",
    CREATED_BY = "created_by",
}