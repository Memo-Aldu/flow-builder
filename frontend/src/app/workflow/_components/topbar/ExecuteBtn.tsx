"use client";

import useExecutionPlan from '@/components/hooks/useExecutionPlan';
import { TooltipWrapper } from '@/components/TooltipWrapper';
import { Button } from '@/components/ui/button';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { UnifiedExecutionsAPI, UnifiedWorkflowsAPI } from '@/lib/api/unified-functions-client';
import { ExecutionStatus, ExecutionTrigger, WorkflowExecutionCreate } from '@/types/executions';
import { WorkflowUpdateRequest } from '@/types/workflows';
import { useMutation } from '@tanstack/react-query';
import { PlayIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';


type ExecuteBtnProps = {
    workflowId: string,
    isPublished: boolean,
}


const ExecuteBtn = ( { workflowId, isPublished }: ExecuteBtnProps) => {
  const generate  = useExecutionPlan()
  const { getToken } = useUnifiedAuth();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ id, values }: { id: string, values: WorkflowUpdateRequest }) => {
      const token = await getToken();
      if (!isPublished) {
        await UnifiedWorkflowsAPI.client.update(id, values, token);
      }
      const workflowExecution: WorkflowExecutionCreate = {
        workflow_id: id,
        trigger: ExecutionTrigger.MANUAL,
        status: ExecutionStatus.PENDING,
      }

      return await UnifiedExecutionsAPI.client.create(workflowExecution, token);
    },
    onSuccess: (execution) => {
      toast.success("Execution Started", { id: "execution-started" });
      router.push(`/workflow/runs/${workflowId}/${execution.id}`);
    },
    onError: () => {
      toast.error("Execution Failed", { id: "execution-started" });
  }})
  return (
    <TooltipWrapper content='Execute the workflow'>
    <Button variant={'outline'} className='flex items-center gap-2' disabled={mutation.isPending} onClick={() => { 
        toast.loading("Starting Execution", { id: "execution-started" });
        const plan = generate()
        if (!plan) {
            return 
        }
        const workflowUpdateRequest = { execution_plan: plan } as WorkflowUpdateRequest
        mutation.mutate({ id: workflowId, values: workflowUpdateRequest })
    }}
    >
        <PlayIcon size={16} className='stroke-green-400'/>
        Execute
    </Button>
    </TooltipWrapper>
  )
}

export default ExecuteBtn