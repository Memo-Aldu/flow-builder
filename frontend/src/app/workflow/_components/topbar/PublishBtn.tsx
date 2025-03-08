"use client";

import useExecutionPlan from '@/components/hooks/useExecutionPlan';
import { Button } from '@/components/ui/button';
import { publishWorkflow } from '@/lib/api/workflows';
import CalculateWorkflowCost from '@/lib/workflow/helper';
import { AppNode } from '@/types/nodes';
import { WorkflowPublishRequest } from '@/types/workflows';
import { useAuth } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';
import { useReactFlow } from '@xyflow/react';
import { UploadIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react'
import { toast } from 'sonner';


type PublishBtnProps = {
    workflowId: string
}


const PublishBtn = ( { workflowId }: PublishBtnProps) => {
  const generate  = useExecutionPlan()
  const { getToken } = useAuth();
  const { toObject } = useReactFlow();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ id, values }: { id: string, values: WorkflowPublishRequest }) => {
      const token  = await getToken();
      if (!token) {
        throw new Error("User not authenticated");
      }
      return await publishWorkflow(values, id, token)
    },
    onSuccess: () => {
      toast.success("Workflow Published", { id: workflowId });
      router.refresh();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to publish workflow", { id: workflowId });
  }})
  return (
    <Button variant={'outline'} className='flex items-center gap-2' disabled={mutation.isPending} onClick={() => { 
        toast.loading("Publishing Workflow", { id: workflowId });
        const plan = generate()
        if (!plan) {
            return 
        }

        const flowDefinition = toObject()
        const workflowPublishRequest: WorkflowPublishRequest = {
            execution_plan: plan,
            definition: flowDefinition,
            credits_cost: CalculateWorkflowCost(flowDefinition.nodes as AppNode[])
        }
        mutation.mutate({ id: workflowId, values: workflowPublishRequest })
    }}
    >
        <UploadIcon size={16} className='stroke-green-400'/>
        Publish
    </Button>
  )
}

export default PublishBtn