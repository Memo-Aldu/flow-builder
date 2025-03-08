"use client"
import { Button } from '@/components/ui/button'
import { updateWorkflow } from '@/lib/api/workflows'
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
    <Button 
    disabled={isPending}
    variant={'outline'} 
    className='flex items-center gap-2'
    onClick={() => {
        toast.loading("Saving workflow", { id: "save-workflow" });
        const workflowDef = toObject()
        const workflowUpdateRequest: WorkflowUpdateRequest = {
            definition: workflowDef
        }
        mutate({ id: workflowId, values: workflowUpdateRequest })
    }}> 
        <CheckIcon size={16} className='stroke-green-400'/>
        Save
    </Button>
  )
}

export default SaveBtn