"use client";

import useExecutionPlan from '@/components/hooks/useExecutionPlan';
import { Button } from '@/components/ui/button';
import { createExecution } from '@/lib/api/executions';
import { updateWorkflow } from '@/lib/api/workflows';
import { ExecutionStatus, ExecutionTrigger, WorkflowExecutionCreate } from '@/types/executions';
import { WorkflowUpdateRequest } from '@/types/workflows';
import { useAuth } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';
import { PlayIcon } from 'lucide-react';
import { useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'sonner';


type ExecuteBtnProps = {
    workflowId: string
}


const ExecuteBtn = ( { workflowId }: ExecuteBtnProps) => {
  const generate  = useExecutionPlan()
  const { getToken } = useAuth();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ id, values }: { id: string, values: WorkflowUpdateRequest }) => {
      const token  = await getToken();
      if (!token) {
        throw new Error("User not authenticated");
      }
      await updateWorkflow(id, values, token)
      // TODO: ADD STARTED DATE MAYBE
      const workflowExecution: WorkflowExecutionCreate = {
        workflow_id: id,
        trigger: ExecutionTrigger.MANUAL,
        status: ExecutionStatus.PENDING,
      }

      return await createExecution(token, workflowExecution)
    },
    onSuccess: (execution) => {
      toast.success("Execution Started", { id: "execution-started" });
      router.push(`/workflow/runs/${workflowId}/${execution.id}`);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Execution Failed", { id: "execution-started" });
  }})
  return (
    <Button variant={'outline'} className='flex items-center gap-2' disabled={mutation.isPending} onClick={() => { 
        const plan = generate()
        if (!plan) {
            return 
        }
        console.log(plan)
        const executionPlan = { execution_plan: plan }
        const workflowUpdateRequest: WorkflowUpdateRequest = {
            execution_plan: executionPlan
        }
        mutation.mutate({ id: workflowId, values: workflowUpdateRequest })
    }}
    >
        <PlayIcon size={16} className='stroke-green-400'/>
        Execute
    </Button>
  )
}

export default ExecuteBtn