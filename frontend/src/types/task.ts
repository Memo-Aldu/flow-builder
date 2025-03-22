export enum TaskType {
    LAUNCH_BROWSER = "launch_browser",
    GET_HTML = "get_html",
    GET_TEXT_FROM_HTML = "get_text_from_html",
    CLICK_ELEMENT = "click_element",
    FILL_INPUT = "fill_input",
    EXTRACT_DATA_OPENAI = "extract_data_openai",
    READ_PROPERTY_FROM_JSON = "read_property_from_json",
}

export enum TaskParamType {
    STRING = "STRING",
    BROWSER_INSTANCE = "BROWSER_INSTANCE",
    CREDENTIAL = "CREDENTIAL",
}

export interface TaskParam {
    name: string;
    type: TaskParamType;
    helperText?: string;
    required?: boolean;
    hideHandle?: boolean;
    [key: string]: any;
}