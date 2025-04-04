export enum TaskType {
    LAUNCH_BROWSER = "launch_browser",
    GET_HTML = "get_html",
    GET_TEXT_FROM_HTML = "get_text_from_html",
    CLICK_ELEMENT = "click_element",
    FILL_INPUT = "fill_input",
    EXTRACT_DATA_OPENAI = "extract_data_openai",
    READ_PROPERTY_FROM_JSON = "read_property_from_json",
    WAIT_FOR_ELEMENT = "wait_for_element",
    DELAY = "delay",
    CONDENSE_HTML = "condense_html",
    DELIVER_TO_WEBHOOK = "deliver_to_webhook",
}

export enum TaskParamType {
    STRING = "STRING",
    BROWSER_INSTANCE = "BROWSER_INSTANCE",
    CREDENTIAL = "CREDENTIAL",
    SELECT = "SELECT",
    NUMBER = "NUMBER",
}

export interface TaskParam {
    name: string;
    type: TaskParamType;
    helperText?: string;
    required?: boolean;
    hideHandle?: boolean;
    [key: string]: any;
}