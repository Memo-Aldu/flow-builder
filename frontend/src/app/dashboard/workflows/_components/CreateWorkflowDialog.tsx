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
import { UnifiedWorkflowsAPI } from '@/lib/api/unified-functions-client';
import { createWorkflowSchema, CreateWorkflowSchemaType } from '@/schema/workflow';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers2Icon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';


type CreateWorkflowDialogProps = {
    triggerText?: string
}

export const CreateWorkflowDialog = ({ triggerText }: CreateWorkflowDialogProps) => {
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient();
  const { getToken, isAuthenticated } = useUnifiedAuth();
  const router = useRouter();

  const form = useForm<CreateWorkflowSchemaType>({
	resolver: zodResolver(createWorkflowSchema),
	defaultValues: {}
  })

  const { mutate, isPending } = useMutation({
	mutationFn: async (values: CreateWorkflowSchemaType) => {
		if (isAuthenticated) {
			const token = await getToken();
			return await UnifiedWorkflowsAPI.client.create(values, token);
		} else {
			return await UnifiedWorkflowsAPI.client.create(values);
		}
	},
	onSuccess: (workflow) => {
	  toast.success("Workflow created successfully", { id: "create-workflow" });
	  setOpen(false);
	  queryClient.invalidateQueries({ queryKey: ["workflows"] });
	  router.push(`/workflow/editor/${workflow.id}`);
	},
	onError: () => {
		toast.error("Failed to create workflow", { id: "create-workflow" });
	}
  })

  const onSubmit = useCallback((values: CreateWorkflowSchemaType) => {
	toast.loading("Creating workflow...", { id: "create-workflow" });
	mutate(values);
  }, [mutate])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button>{triggerText ?? "Create Workflow"}</Button>
        </DialogTrigger>
        <DialogContent className='px-0'>
            <CustomDialogHeader 
                icon={Layers2Icon}
                title="Create Workflow"
                subTitle="Start building your workflow"
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
									Choose a name for your workflow
								</FormDescription>
								<FormMessage />
							</FormItem>
							
						)}
						/>

						<FormField 
						control={form.control} 
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel className='flex gap-1 items-center'>Description
									<p className="text-xs text-muted-foreground">(optional)</p>
								</FormLabel>
								<FormControl>
									<Textarea className='resize-none' {...field} />
								</FormControl>
								<FormDescription>
									Choose a description for your workflow
								</FormDescription>
								<FormMessage />
							</FormItem>
							
						)}
						/>
						<Button className='w-full' type="submit" disabled={isPending}>
							{isPending ? <Loader2 className='animate-spin'/> : "Create Workflow"}
						</Button>
					</form>
				</Form>
			
			</div>
        </DialogContent>
    </Dialog>
  )
}
