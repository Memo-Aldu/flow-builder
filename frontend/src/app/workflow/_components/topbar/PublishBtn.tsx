"use client";

import { TooltipWrapper } from '@/components/TooltipWrapper';
import { Button } from '@/components/ui/button';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { UnifiedWorkflowsAPI } from '@/lib/api/unified-functions-client';
import { FlowToExecutionPlan } from '@/lib/workflow/executionPlan';
import { sanitizeHandleId } from '@/lib/workflow/handleUtils';
import CalculateWorkflowCost from '@/lib/workflow/helper';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { AppNode } from '@/types/nodes';
import { WorkflowPublishRequest } from '@/types/workflows';
import { useMutation } from '@tanstack/react-query';
import { useReactFlow } from '@xyflow/react';
import { UploadIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';


type PublishBtnProps = {
    workflowId: string
}


const PublishBtn = ( { workflowId }: PublishBtnProps) => {
  const { getToken } = useUnifiedAuth();
  const { toObject } = useReactFlow();
  const router = useRouter();

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

  const mutation = useMutation({
    mutationFn: async ({ id, values }: { id: string, values: WorkflowPublishRequest }) => {
      const token = await getToken();
      return await UnifiedWorkflowsAPI.client.publish(id, values, token);
    },
    onSuccess: () => {
      toast.success("Workflow Published", { id: workflowId });
      router.refresh();
    },
    onError: (err) => {
      toast.error("Failed to publish workflow", { id: workflowId });
  }})
  return (
    <TooltipWrapper content='Publish the workflow'>
      <Button variant={'outline'} className='flex items-center gap-2' disabled={mutation.isPending} onClick={() => {
          toast.loading("Publishing Workflow", { id: workflowId });

          const flowDefinition = toObject()
          const convertedEdges = convertEdgesForBackend(flowDefinition.edges, flowDefinition.nodes as AppNode[]);

          // Generate execution plan with converted edges (original handles)
          const { executionPlan, error } = FlowToExecutionPlan(flowDefinition.nodes as AppNode[], convertedEdges);
          if (error) {
              toast.error("Failed to generate execution plan");
              return;
          }

          const backendCompatibleDef = {
            ...flowDefinition,
            edges: convertedEdges
          };

          const workflowPublishRequest: WorkflowPublishRequest = {
              execution_plan: executionPlan,
              definition: backendCompatibleDef,
              credits_cost: CalculateWorkflowCost(flowDefinition.nodes as AppNode[])
          }
          mutation.mutate({ id: workflowId, values: workflowPublishRequest })
      }}
      >
          <UploadIcon size={16} className='stroke-green-400'/>
          Publish
      </Button>
    </TooltipWrapper>
  )
}

export default PublishBtn