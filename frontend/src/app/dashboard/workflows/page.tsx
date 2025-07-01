
import { CreateWorkflowDialog } from '@/app/dashboard/workflows/_components/CreateWorkflowDialog'
import UserWorkflows from '@/app/dashboard/workflows/_components/UserWorkflows'
import { ClientAuthFallback } from '@/components/ClientAuthFallback'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { getServerWorkflows } from '@/lib/api/unified-server-api'
import { getUnifiedAuth } from '@/lib/auth/unified-auth'
import { AlertCircle } from 'lucide-react'
import React, { Suspense } from 'react'

// Force dynamic rendering to enable server-side authentication
export const dynamic = 'force-dynamic';

const page = async () => {
  const user = await getUnifiedAuth();

  const content = (
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
  );

  return (
    <ClientAuthFallback serverUser={user}>
      {content}
    </ClientAuthFallback>
  );
}


const UserWorkflowSkeleton = () => {
    return <div className='space-y-2'>
        {
            [1, 2, 3, 4, 5].map((item) => 
            <Skeleton className='h-32 w-full' key={item} />)
        }  
    </div>
}


const UserWorkflowsWrapper = async () => {
  const user = await getUnifiedAuth();

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertTitle>Please log in to access your workflows.</AlertTitle>
      </Alert>
    )
  }

  try {
    const workflows = await getServerWorkflows();
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
  } catch (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertTitle>Something went wrong. Please try again later.</AlertTitle>
      </Alert>
    );
  }
}


export default page
