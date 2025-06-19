"use client";

import { CustomDialogHeader } from '@/components/CustomDialogHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { UnifiedCredentialsAPI } from '@/lib/api/unified-functions-client';
import { createCredentialSchema, CreateCredentialSchemaType } from '@/schema/credential';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldEllipsis } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';


type CreateCredentialDialogProps = {
    triggerText?: string
}

export const CreateCredentialDialog = ({ triggerText }: CreateCredentialDialogProps) => {
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient();
  const { getToken } = useUnifiedAuth();
  const router = useRouter();

  const form = useForm<CreateCredentialSchemaType>({
	resolver: zodResolver(createCredentialSchema),
	defaultValues: {}
  })

  const { mutate, isPending } = useMutation({
	mutationFn: async (values: CreateCredentialSchemaType) => {
		const token = await getToken();
		return await UnifiedCredentialsAPI.client.create(values, token);
	},
	onSuccess: () => {
	  toast.success("Credential created successfully", { id: "create-credential" });
	  setOpen(false);
	  queryClient.invalidateQueries({ queryKey: ["credentials"] });
	  router.push("/dashboard/credentials");
	},
	onError: (err) => {
		toast.error("Failed to create credential", { id: "create-credential" });
	}
  })

  const onSubmit = useCallback((values: CreateCredentialSchemaType) => {
	toast.loading("Creating workflow...", { id: "create-credential" });
	mutate(values);
  }, [mutate])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button>{triggerText ?? "Create"}</Button>
        </DialogTrigger>
        <DialogContent className='px-0'>
            <CustomDialogHeader 
                icon={ShieldEllipsis}
                title="Create Credential"
            />
			<div className="p-6">
				<Form {...form}>
					<form className="space-y-8 w-full" onSubmit={form.handleSubmit(onSubmit)}>
						<FormField 
						control={form.control} 
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel className='flex gap-1 items-center'>Name
									<p className="text-xs text-primary">(required)</p>
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormDescription>
									Choose a name for your credential
								</FormDescription>
								<FormMessage />
							</FormItem>
							
						)}
						/>

						<FormField 
						control={form.control} 
						name="value"
						render={({ field }) => (
							<FormItem>
								<FormLabel className='flex gap-1 items-center'>Value
									<p className="text-xs text-primary">(required)</p>
								</FormLabel>
								<FormControl>
									<Textarea className='resize-none' {...field}
										
									 />
								</FormControl>
								<FormDescription>
									Past the value of your credential here
									<br />
									This value will be encrypted and stored securely
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
						/>
						<Button className='w-full' type="submit" disabled={isPending}>
							{isPending ? <Loader2 className='animate-spin'/> : "Create Credential"}
						</Button>
					</form>
				</Form>
		
			</div>
        </DialogContent>
    </Dialog>
  )
}
