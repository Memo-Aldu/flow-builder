"use client"
import { TooltipWrapper } from '@/components/TooltipWrapper'
import { Button } from '@/components/ui/button'
import { useUnifiedAuth } from '@/contexts/AuthContext'
import { UnifiedWorkflowsAPI } from '@/lib/api/unified-functions-client'
import { sanitizeHandleId } from '@/lib/workflow/handleUtils'
import { TaskRegistry } from '@/lib/workflow/task/registry'
import { AppNode } from '@/types/nodes'
import { WorkflowUpdateRequest } from '@/types/workflows'
import { useMutation } from '@tanstack/react-query'
import { useReactFlow } from '@xyflow/react'
import { CheckIcon } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

const SaveBtn = ({ workflowId }: { workflowId: string }) => {
  const { toObject } = useReactFlow()
  const { getToken } = useUnifiedAuth();

  const convertEdgesForBackend = (edges: any[], nodes: AppNode[]) => {
    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) {
        return edge;
      }

      const sourceTask = TaskRegistry[sourceNode.data.type];
      const targetTask = TaskRegistry[targetNode.data.type];

      const originalSourceHandle = sourceTask.outputs.find(output =>
        sanitizeHandleId(output.name) === edge.sourceHandle
      )?.name ?? edge.sourceHandle;

      const originalTargetHandle = targetTask.inputs.find(input =>
        sanitizeHandleId(input.name) === edge.targetHandle
      )?.name ?? edge.targetHandle;

      return {
        ...edge,
        sourceHandle: originalSourceHandle,
        targetHandle: originalTargetHandle
      };
    });
  };

  const { mutate, isPending } = useMutation({
  mutationFn: async ({ id, values }: { id: string, values: WorkflowUpdateRequest }) => {
    const token = await getToken();
    return await UnifiedWorkflowsAPI.client.update(id, values, token);
  },
	onSuccess: () => {
	  toast.success("Workflow saved successfully", { id: "save-workflow" });
	},
	onError: () => {
		toast.error("Failed to save workflow", { id: "save-workflow" });
	}
  })

  return (
    <TooltipWrapper content='Save the workflow'>
      <Button
      disabled={isPending}
      variant={'outline'}
      className='flex items-center gap-2'
      onClick={() => {
          toast.loading("Saving workflow", { id: "save-workflow" });
          const workflowDef = toObject()
          const convertedEdges = convertEdgesForBackend(workflowDef.edges, workflowDef.nodes as AppNode[]);
          const backendCompatibleDef = {
            ...workflowDef,
            edges: convertedEdges
          };

          const workflowUpdateRequest: WorkflowUpdateRequest = {
              definition: backendCompatibleDef
          }
          mutate({ id: workflowId, values: workflowUpdateRequest })
      }}>
          <CheckIcon size={16} className='stroke-green-400'/>
          Save
      </Button>
    </TooltipWrapper>
  )
}

export default SaveBtn