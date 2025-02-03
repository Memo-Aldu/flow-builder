
import { CreateWorkflowDialog } from '@/app/dashboard/workflows/_components/CreateWorkflowDialog'
import { WorkflowCard } from '@/app/dashboard/workflows/_components/WorkflowCard'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { getWorkflows } from '@/lib/api/workflows'
import { auth } from '@clerk/nextjs/server'
import { AlertCircle, InboxIcon } from 'lucide-react'
import React, { Suspense } from 'react'

const page = () => {
  return (
    <div className='flex-1 flex flex-col h-hull'>
        <div className='flex justify-between'>
            <div className='flex flex-col'>
                <h1 className='text-3xl font-bold'>Workflows</h1>
                <p className='text-muted-foreground'>
                    Manage your workflows here
                </p>
            </div>
            <CreateWorkflowDialog triggerText='Create a workflow'/>
        </div>
        <div className='h-full py-6'>
            <Suspense fallback={<UserWorkflowSkeleton />}>
                <UserWorkflows />
            </Suspense>
        </div>
    </div>
  )
}


const UserWorkflowSkeleton = () => {
    return <div className='space-y-2'>
        {
            [1, 2, 3, 4, 5].map((_, index) => 
            <Skeleton className='h-32 w-full' key={index} />)
        }  
    </div>
}


const UserWorkflows = async () => {
  // 2. Retrieve user/token from Clerk in a server component
  const { userId, getToken } = await auth()

  if (!userId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertTitle>Please log in again.</AlertTitle>
      </Alert>
    )
  }

  const token = await getToken()
  if (!token) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertTitle>No valid token found.</AlertTitle>
      </Alert>
    )
  }
    const workflows = await getWorkflows(token);
    if (!workflows) {
        return (
        <Alert
            variant={'destructive'}
        >
            <AlertCircle className='w-4 h-4' />
            <AlertTitle>
                Something went wrong. Please try again later.
            </AlertTitle>
        </Alert>
        );
    }
    
    if (workflows.length === 0) {
        return (
            <div className='flex flex-col gap-4 h-full items-center justify-center'>
                <div className='rounded-full bg-accent w-20 h-20 flex items-center justify-center'>
                    <InboxIcon size={40} className='stroke-primary' />
                </div>
                <div className="flex flex-col gap-1 text-center">
                    <p className="font-bold">No workflows created.</p>
                    <p className="text-sm text-muted-foreground">
                        Click the button below to create your first workflow.
                    </p>
                </div>
                <CreateWorkflowDialog triggerText='Create your first workflow'/>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 gap-4">
            {workflows.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
        </div>
    )
}


export default page
