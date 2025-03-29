import { cn } from '@/lib/utils'
import { TaskParam } from '@/types/task'
import { Handle, Position, useEdges, useReactFlow } from '@xyflow/react'
import React from 'react'
import NodeParamField from '@/app/workflow/_components/nodes/NodeParamField'
import { ColorForHandle } from '@/app/workflow/_components/nodes/common'
import useWorkflowValidation from '@/components/hooks/useWorkflowValidation'

export const NodeInputs = ({ children }: {children: React.ReactNode}) => {
  return (
    <div className='flex flex-col space-y-1'>
        {children}
    </div>
  )
}

export const NodeInput = ({ input, nodeId } : { input: TaskParam, nodeId: string }) => {
  const edges = useEdges()
  const { getNode } = useReactFlow();
  const { invalidInputs } = useWorkflowValidation()
  const isConnected = edges.some(edge => edge.target === nodeId && edge.targetHandle === input.name)

  const hasInvalidInputs = invalidInputs
    .find(node => node.nodeId === nodeId)
    ?.inputs.find((invalidInputs) => invalidInputs === input.name)

    const node = getNode(nodeId);
    const changedInputs = node?.data?.changedInputs as string[] || [];
    const isChanged = changedInputs.includes(input.name);

    console.log("isChanged", isChanged)

    return (
      <div
        className={cn(
          'relative flex items-center p-2 border bg-secondary/40 w-full text-sm',
          hasInvalidInputs
            ? 'border-destructive bg-destructive/30'
            : isChanged
            ? 'border-amber-300 bg-amber-300/20'
            : 'border-border'
        )}
      >
        <NodeParamField param={input} nodeId={nodeId} disabled={isConnected} />
  
        {!input.hideHandle && (
          <Handle
            id={input.name}
            isConnectable={!isConnected}
            type="target"
            position={Position.Left}
            className={cn(
              '!bg-muted-foreground !border-2 !border-background !-left-2 !w-4 !h-4',
              ColorForHandle[input.type]
            )}
          />
        )}
      </div>
    )
  }