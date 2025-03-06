export interface WorkflowVersion {
    id: string;
    version_number: number;
    created_at: string;
    definition: Record<string, any> | null;
    execution_plan: Record<string, any> | null;
    created_by: string | null;
    parent_version_id: string | null;
    is_active: boolean;
}


export enum WorkflowVersionSortField {
    CREATED_AT = "created_at",
    VERSION_NUMBER = "version_number",
    CREATED_BY = "created_by",
}

export const WorkflowVersionSortFieldLabels: Record<WorkflowVersionSortField, string> = {
    [WorkflowVersionSortField.CREATED_AT]: "Created At",
    [WorkflowVersionSortField.VERSION_NUMBER]: "Version Number",
    [WorkflowVersionSortField.CREATED_BY]: "Created By",
}