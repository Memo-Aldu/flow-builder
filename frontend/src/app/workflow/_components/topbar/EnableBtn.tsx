"use client"
import { TooltipWrapper } from '@/components/TooltipWrapper';
import { Button } from '@/components/ui/button';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { UnifiedWorkflowsAPI } from '@/lib/api/unified-functions-client';
import { useMutation } from '@tanstack/react-query';
import { CheckIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';

const EnableBtn = ({ workflowId }: { workflowId: string }) => {
  const { getToken } = useUnifiedAuth();
  const router = useRouter();


  const { mutate, isPending } = useMutation({
  mutationFn: async ({ id }: { id: string}) => {
    const token = await getToken();
    return await UnifiedWorkflowsAPI.client.update(id, {
      status: 'published'
    }, token);
  },
	onSuccess: () => {
	  toast.success("Workflow enabled successfully", { id: "save-workflow" });
    router.refresh();
	},
	onError: (err) => {
		toast.error("Failed to enable workflow", { id: "save-workflow" });
	}
  })

  return (
    <TooltipWrapper content='Enable workflow'>
    <Button 
    disabled={isPending}
    variant={'outline'} 
    className='flex items-center gap-2'
    onClick={() => {
        toast.loading("Enabling workflow", { id: "save-workflow" });
        mutate({ id: workflowId})
    }}> 
        <CheckIcon size={16} className='stroke-green-400'/>
        Enable
    </Button>
    </TooltipWrapper>
  )
}

export default EnableBtn
