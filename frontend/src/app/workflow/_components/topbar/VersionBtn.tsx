"use client"
import useExecutionPlan from '@/components/hooks/useExecutionPlan'
import { TooltipWrapper } from '@/components/TooltipWrapper'
import { Button } from '@/components/ui/button'
import { useUnifiedAuth } from '@/contexts/AuthContext'
import { UnifiedVersionsAPI } from '@/lib/api/unified-functions-client'
import { WorkflowVersionCreate } from '@/types/versions'
import { useMutation } from '@tanstack/react-query'
import { useReactFlow } from '@xyflow/react'
import { FilePlus } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

const VersionBtn = ({ workflowId }: { workflowId: string }) => {
  const generate  = useExecutionPlan()
  const { toObject } = useReactFlow()
  const { getToken } = useUnifiedAuth();

  const { mutate, isPending } = useMutation({
  mutationFn: async ({ version }: {version: WorkflowVersionCreate }) => {
    const token = await getToken();
    return await UnifiedVersionsAPI.client.create(workflowId, version, token);
  },
	onSuccess: () => {
	  toast.success("Version created successfully", { id: "created-version" });
	},
	onError: (err) => {
		console.error(err);
		toast.error("Failed to create version", { id: "created-version" });			
	}
  })

  return (
    <TooltipWrapper content='Create a new version'>
      <Button 
      disabled={isPending}
      variant={'outline'} 
      className='flex items-center gap-2'
      onClick={() => {
          toast.loading("Creating version...", { id: "created-version" });
          const workflowDef = toObject()
          const plan = generate()
          if (!plan) {
              return 
          }
          const version: WorkflowVersionCreate = {
              definition: workflowDef,
              execution_plan: plan,
              // -1 is a placeholder for the version number, it will be set by the backend
              version_number: -1
          }
          mutate({ version })
      }}> 
          <FilePlus size={16} className='stroke-green-400'/>
          Version
      </Button>
    </TooltipWrapper>
  )
}

export default VersionBtn