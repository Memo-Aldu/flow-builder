import { TaskParam, TaskParamType } from '@/types/task'
import React, { useCallback } from 'react'
import StringParam from '@/app/workflow/_components/nodes/param/StringParam'
import { useReactFlow } from '@xyflow/react'
import { AppNode } from '@/types/nodes'
import BrowserInstanceParam from '@/app/workflow/_components/nodes/param/BrowserInstanceParam'

const NodeParamField = ({ param, nodeId, disabled }: { param : TaskParam, nodeId: string, disabled: boolean }) => {
    const { updateNodeData, getNode } = useReactFlow()
    const node = getNode(nodeId) as AppNode
    const value = node?.data.inputs?.[param.name]

    const updateNodeParamValue = useCallback((newValue: string) => {
        updateNodeData(nodeId, {
            inputs: {
                ...node.data.inputs,
                [param.name]: newValue
            }
        })
    }, [updateNodeData, nodeId, node?.data.inputs, param.name])

    switch (param.type) {
        case TaskParamType.STRING:
            return (
                <StringParam disabled={disabled} param={param} value={value} updateNodeParamValue={updateNodeParamValue}/>
            )
        case TaskParamType.BROWSER_INSTANCE:
            return (
                <BrowserInstanceParam param={param} value={""} updateNodeParamValue={updateNodeParamValue}/>
            )
        default:
            return (
                <div className='w-full'>
                    <p className='text-xs text-muted-foreground'>Not Supported</p>
                </div>
            )
    }
}

export default NodeParamField