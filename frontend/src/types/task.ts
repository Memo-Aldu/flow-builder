export enum TaskType {
    LAUNCH_BROWSER = "launch_browser",
    GET_HTML = "get_html",
    GET_TEXT_FROM_HTML = "get_text_from_html",


}

export enum TaskParamType {
    STRING = "STRING",
    BROWSER_INSTANCE = "BROWSER_INSTANCE",
}

export interface TaskParam {
    name: string;
    type: TaskParamType;
    helperText?: string;
    required?: boolean;
    hideHandle?: boolean;
    [key: string]: any;
}