'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteCredential } from '@/lib/api/credential'
import { useAuth } from '@clerk/nextjs'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'sonner'

type DeleteCredentialDialogProps = {
    credentialName: string
    credentialId: string
}

export const DeleteCredentialDialog = ({credentialName, credentialId }: DeleteCredentialDialogProps) => {
  const [confirmText, setConfirmText] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const router = useRouter();   
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        const token  = await getToken();
        if (!token) {
            throw new Error("User not authenticated");
        }
        return await deleteCredential(token, id);
    },
    onSuccess: () => {
        toast.success("Credential deleted successfully", { id: credentialId });
        setConfirmText('')
        queryClient.invalidateQueries({ queryKey: ["credentials"] });
        router.push("/dashboard/credentials");

    },
    onError: (err) => {
        console.error(err);
        toast.error("Failed to delete credential", { id: credentialId });
    }
  }) 
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
            <Button variant='destructive' size={"icon"}>
                <XIcon size={18} />
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="">
            <AlertDialogHeader>
                <AlertDialogTitle className="">
                    Are you sure you want to delete this credential?
                </AlertDialogTitle>
                <AlertDialogDescription className="">
                    This action cannot be undone.
                    <div className="flex flex-col py-4 gap-2 items-center">
                        <span>
                            If you are sure, please type <b>{credentialName}</b> below to confirm.
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
                    disabled={confirmText !== credentialName || deleteMutation.isPending} 
                    onClick={() => {
                        toast.loading("Deleting credential...", { id: credentialId })
                        deleteMutation.mutate(credentialId)
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
