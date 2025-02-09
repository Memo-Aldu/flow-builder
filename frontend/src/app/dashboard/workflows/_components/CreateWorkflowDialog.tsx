"use client";

import { toast } from 'sonner'
import { useAuth } from "@clerk/nextjs";
import { useForm } from 'react-hook-form'
import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Layers2Icon, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { CustomDialogHeader } from '@/components/CustomDialogHeader'
import { DialogTrigger, Dialog, DialogContent } from '@/components/ui/dialog'
import { createWorkflowSchema, CreateWorkflowSchemaType } from '@/schema/workflow'
import { 
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createWorkflow } from '@/lib/api/workflows'


type CreateWorkflowDialogProps = {
    triggerText?: string
}

export const CreateWorkflowDialog = ({ triggerText }: CreateWorkflowDialogProps) => {
  const [open, setOpen] = React.useState(false)
  const { getToken } = useAuth();
  const router = useRouter();

  const form = useForm<CreateWorkflowSchemaType>({
	resolver: zodResolver(createWorkflowSchema),
	defaultValues: {}
  })

  const { mutate, isPending } = useMutation({
	mutationFn: async (values: CreateWorkflowSchemaType) => {
		const token  = await getToken();
		if (!token) {
			throw new Error("User not authenticated");
		}
		return await createWorkflow(values, token);
	},
	onSuccess: (workflow) => {
	  toast.success("Workflow created successfully", { id: "create-workflow" });
	  setOpen(false);
	  router.push(`/workflow/editor/${workflow.id}`);
	},
	onError: (err) => {
		console.error(err);
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
