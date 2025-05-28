"use client"
import { TooltipWrapper } from '@/components/TooltipWrapper'
import { Button } from '@/components/ui/button'
import { updateWorkflow } from '@/lib/api/workflows'
import { sanitizeHandleId } from '@/lib/workflow/handleUtils'
import { TaskRegistry } from '@/lib/workflow/task/registry'
import { AppNode } from '@/types/nodes'
import { WorkflowUpdateRequest } from '@/types/workflows'
import { useAuth } from '@clerk/nextjs'
import { useMutation } from '@tanstack/react-query'
import { useReactFlow } from '@xyflow/react'
import { CheckIcon } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

const SaveBtn = ({ workflowId }: { workflowId: string }) => {
  const { toObject } = useReactFlow()
  const { getToken } = useAuth();

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
    const token  = await getToken();
    if (!token) {
      throw new Error("User not authenticated");
    }
    return await updateWorkflow(id, values, token);
  },
	onSuccess: (workflow) => {
	  toast.success("Workflow saved successfully", { id: "save-workflow" });
	},
	onError: (err) => {
		console.error(err);
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