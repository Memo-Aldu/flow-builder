"use client";

import { TooltipWrapper } from '@/components/TooltipWrapper';
import { Button } from '@/components/ui/button';
import { UnifiedWorkflowsAPI } from '@/lib/api/unified-functions-client';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { DownloadIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';


type PublishBtnProps = {
    workflowId: string
}


const UnPublishBtn = ( { workflowId }: PublishBtnProps) => {
  const { getToken } = useUnifiedAuth();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: string}) => {
      const token = await getToken();
      return await UnifiedWorkflowsAPI.client.unpublish(id, token);
    },
    onSuccess: () => {
      toast.success("Workflow Unpublished", { id: workflowId });
      router.refresh();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to unpublished workflow", { id: workflowId });
  }})
  return (
    <TooltipWrapper content='Unpublish the workflow'>
    <Button variant={'outline'} className='flex items-center gap-2' disabled={mutation.isPending} onClick={() => { 
      toast.loading("Unpublishing Workflow", { id: workflowId });  
      mutation.mutate({ id: workflowId})
    }}
    >
        <DownloadIcon size={16} className='stroke-green-400'/>
        Unpublish
    </Button>
    </TooltipWrapper>
  )
}

export default UnPublishBtn