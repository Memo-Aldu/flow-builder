import { Node } from "@xyflow/react";
import { TaskParam, TaskType } from "@/types/task";

export interface AppNodeData {
    [key: string]: any;
    type: TaskType;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
}

export interface TimelineNodeData {
    [key: string]: any;
    label: string;
    createdBy?: string;
}


export interface AppNode extends Node {
    data: AppNodeData
}

export interface TimelineNode extends Node {

}

export type ParamProps = {
    param: TaskParam
    value: string
    disabled?: boolean
    updateNodeParamValue: (newValue: string) => void
}

export type AppNodesMissingInputs = {
    nodeId: string
    inputs: string[]
}