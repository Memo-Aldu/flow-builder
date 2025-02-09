import { TaskType } from "@/types/task"
import { AppNode } from "@/types/nodes"

const createFlowNode = (
    nodeType : TaskType, 
    position?: {x: number, y: number}): AppNode => {
    return {
        id: crypto.randomUUID(),
        type: 'FlowBuilderNode',
        dragHandle: '.drag-handle',
        position: position || { x: 0, y: 0 },
        data: {
            type: nodeType,
            inputs: {},
            outputs: {},
        } 
    }
}

export default createFlowNode