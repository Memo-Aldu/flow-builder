'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { UnifiedWorkflowsAPI } from '@/lib/api/unified-functions-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';

type DeleteWorkflowDialogProps = {
    open: boolean
    setOpen: (open: boolean) => void
    workflowName: string
    workflowId: string
}

export const DeleteWorkflowDialog = ({ open, setOpen, workflowName, workflowId }: DeleteWorkflowDialogProps) => {
  const [confirmText, setConfirmText] = React.useState('')
  const queryClient = useQueryClient();
  const { getToken, isAuthenticated } = useUnifiedAuth();
  const router = useRouter();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        if (isAuthenticated) {
            const token = await getToken();
            return await UnifiedWorkflowsAPI.client.delete(id, token);
        } else {
            return await UnifiedWorkflowsAPI.client.delete(id);
        }
    },
    onSuccess: () => {
        toast.success("Workflow deleted successfully", { id: workflowId });
        setConfirmText('')
        queryClient.invalidateQueries({ queryKey: ["workflows"] });

    },
    onError: () => {
        toast.error("Failed to delete workflow", { id: workflowId });
    }
  })
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="">
            <AlertDialogHeader>
                <AlertDialogTitle className="">
                    Are you sure you want to delete this workflow?
                </AlertDialogTitle>
                <AlertDialogDescription className="">
                    This action cannot be undone.
                    <div className="flex flex-col py-4 gap-2 items-center">
                        <span>
                            If you are sure, please type <b>{workflowName}</b> below to confirm.
                        </span>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}/>
                    </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col items-center w-full">
                <AlertDialogCancel 
                    onClick={() => {
                        setOpen(false)
                        setConfirmText('')
                    }}
                    className="w-full text-center">
                    Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                    disabled={confirmText !== workflowName || deleteMutation.isPending} 
                    onClick={() => {
                        toast.loading("Deleting workflow...", { id: workflowId })
                        deleteMutation.mutate(workflowId)
                    }}
                    className='w-full text-center bg-destructive 
                    text-destructive-foreground hover:bg-destructive/90'>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  )
}
