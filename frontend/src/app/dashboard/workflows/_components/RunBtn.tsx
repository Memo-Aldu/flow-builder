import { Button } from '@/components/ui/button';
import { createExecution } from '@/lib/api/executions';
import { ExecutionStatus, ExecutionTrigger, WorkflowExecutionCreate } from '@/types/executions';
import { useAuth } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';
import { PlayIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react'
import { toast } from 'sonner';

const RunBtn = ({ workflowId } : {workflowId : string}) => {
  const { getToken } = useAuth();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const token  = await getToken();
      if (!token) {
        throw new Error("User not authenticated");
      }
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
    <Button variant={'outline'} className='flex items-center gap-2' size={'sm'}
    disabled={mutation.isPending} 
    onClick={() => {
        toast.loading("Starting Execution", { id: "execution-started" });
        mutation.mutate({ id: workflowId })
    }}>
        <PlayIcon size={16} className='stroke-green-400'/>
        Run
    </Button>
  )
}

export default RunBtn