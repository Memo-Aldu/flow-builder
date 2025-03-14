
import { CreateWorkflowDialog } from '@/app/dashboard/workflows/_components/CreateWorkflowDialog'
import { Skeleton } from '@/components/ui/skeleton'
import React, { Suspense } from 'react'
import UserWorkflows from '@/app/dashboard/workflows/_components/UserWorkflows'
import { getWorkflows } from '@/lib/api/workflows'
import { auth } from '@clerk/nextjs/server'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, User } from 'lucide-react'

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
                <UserWorkflowsWrapper />
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


const UserWorkflowsWrapper = async () => {
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
    return <UserWorkflows initialData={workflows} />
}


export default page
