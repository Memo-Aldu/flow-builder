export enum TaskType {
    LAUNCH_STANDARD_BROWSER = "launch_standard_browser",
    LAUNCH_STEALTH_BROWSER = "launch_stealth_browser",
    LAUNCH_BRIGHT_DATA_BROWSER = "launch_bright_data_browser",
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
    SEND_SMS = "send_sms",
    BRANCH = "branch",
    JSON_TRANSFORM = "json_transform",
    MERGE_DATA = "merge_data",
    WRITE_PROPERTY_TO_JSON = "write_property_to_json",
    EMAIL_DELIVERY = "email_delivery",
}

export enum TaskParamType {
    STRING = "STRING",
    BROWSER_INSTANCE = "BROWSER_INSTANCE",
    CREDENTIAL = "CREDENTIAL",
    SELECT = "SELECT",
    NUMBER = "NUMBER",
    CONDITIONAL = "CONDITIONAL",
}

export interface TaskParam {
    name: string;
    type: TaskParamType;
    helperText?: string;
    required?: boolean;
    hideHandle?: boolean;
    defaultValue?: string;
    [key: string]: any;
}
