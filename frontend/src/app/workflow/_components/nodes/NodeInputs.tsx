import { cn } from '@/lib/utils'
import { TaskParam } from '@/types/task'
import { Handle, Position, useEdges } from '@xyflow/react'
import React from 'react'
import NodeParamField from '@/app/workflow/_components/nodes/NodeParamField'
import { ColorForHandle } from '@/app/workflow/_components/nodes/common'
import useWorkflowValidation from '@/components/hooks/useWorkflowValidation'

export const NodeInputs = ({ children }: {children: React.ReactNode}) => {
  return (
    <div className='flex flex-col divide-y gap-1'>
        {children}
    </div>
  )
}

export const NodeInput = ({ input, nodeId } : { input: TaskParam, nodeId: string }) => {
  const edges = useEdges()
  const { invalidInputs } = useWorkflowValidation()
  const isConnected = edges.some(edge => edge.target === nodeId && edge.targetHandle === input.name)

  const hasInvalidInputs = invalidInputs.find(node => node.nodeId === nodeId)
                                ?.inputs.find((invalidInputs) => invalidInputs === input.name)
  return (
    <div className={cn('flex justify-start relative p-3 bg-secondary w-full',
        hasInvalidInputs && 'bg-destructive/30'
    )}>
      <NodeParamField param={input} nodeId={nodeId} disabled={isConnected} />
      {!input.hideHandle && (
              <Handle 
              id={input.name} 
              isConnectable={!isConnected}
              type="target" 
              position={Position.Left} 
              className={cn("!bg-muted-foreground !border-2 !border-background !-left-2 !w-4 !h-4",
                  ColorForHandle[input.type]
              )}
              />
      )}
    </div>
  )
}