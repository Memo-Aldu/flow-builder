"use client"
import { TooltipWrapper } from '@/components/TooltipWrapper'
import { Button } from '@/components/ui/button'
import { updateWorkflow } from '@/lib/api/workflows'
import { useAuth } from '@clerk/nextjs'
import { useMutation } from '@tanstack/react-query'
import { CheckIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'sonner'

const EnableBtn = ({ workflowId }: { workflowId: string }) => {
  const { getToken } = useAuth();
  const router = useRouter();
  

  const { mutate, isPending } = useMutation({
  mutationFn: async ({ id }: { id: string}) => {
    const token  = await getToken();
    if (!token) {
      throw new Error("User not authenticated");
    }
    return await updateWorkflow(id, {
      status: 'published'
    }, token);
  },
	onSuccess: () => {
	  toast.success("Workflow enabled successfully", { id: "save-workflow" });
    router.refresh();
	},
	onError: (err) => {
		console.error(err);
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
