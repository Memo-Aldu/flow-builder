'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { updateWorkflow } from '@/lib/api/workflows'
import { useAuth } from '@clerk/nextjs'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'sonner'

type DisableWorkflowDialogProps = {
    open: boolean
    setOpen: (open: boolean) => void
    disableWorkflow: boolean
    workflowId: string
}

export const DisableWorkflowDialog = ({ open, setOpen, disableWorkflow, workflowId }: DisableWorkflowDialogProps) => {
  const { getToken } = useAuth();
  const router = useRouter();   
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (id: string) => {
        const token  = await getToken();
        if (!token) {
            throw new Error("User not authenticated");
        }
        return await updateWorkflow(id, {
            status: disableWorkflow ? 'published' : 'disabled'
        }, token);
    },
    onSuccess: () => {
        toast.success(`Workflow ${ disableWorkflow ? "enabled" : "disabled" } successfully`, { id: workflowId });
        router.refresh();
        queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
    onError: (err) => {
        console.error(err);
        toast.error(`Failed to ${ disableWorkflow ? "enabled" : "disabled" } workflow`, { id: workflowId });
    }
  }) 
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="">
            <AlertDialogHeader>
                <AlertDialogTitle className="">
                    Are you sure you want to { disableWorkflow ? "enabled" : "disable" } this workflow?
                </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col items-center w-full">
                <AlertDialogCancel 
                    onClick={() => {
                        setOpen(false)
                    }}
                    className="w-full text-center">
                    Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                    disabled={mutation.isPending} 
                    onClick={() => {
                        toast.loading(`${ disableWorkflow ? "Enabling" : "Disabling" } workflow...`, { id: workflowId })
                        mutation.mutate(workflowId)
                    }}
                    className='w-full text-center 
                    text-foreground hover:bg-inherit/90'>
                    { disableWorkflow ? "Enable" : "Disable" }
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  )
}
