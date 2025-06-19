import { Button } from '@/components/ui/button';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { UnifiedExecutionsAPI } from '@/lib/api/unified-functions-client';
import { ExecutionStatus, ExecutionTrigger, WorkflowExecutionCreate } from '@/types/executions';
import { useMutation } from '@tanstack/react-query';
import { PlayIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';

const RunBtn = ({ workflowId } : {workflowId : string}) => {
  const { getToken } = useUnifiedAuth();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const token = await getToken();
      const workflowExecution: WorkflowExecutionCreate = {
        workflow_id: id,
        trigger: ExecutionTrigger.MANUAL,
        status: ExecutionStatus.PENDING,
      }

      return await UnifiedExecutionsAPI.client.create(workflowExecution, token)
    },
    onSuccess: (execution) => {
      toast.success("Execution Started", { id: "execution-started" });
      router.push(`/workflow/runs/${workflowId}/${execution.id}`);
    },
    onError: () => {
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