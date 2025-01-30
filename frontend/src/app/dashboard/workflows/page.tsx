import { Skeleton } from '@/components/ui/skeleton'
import { waitFor } from '@/lib/helper/waitFor'
import { User } from 'lucide-react'
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
            [1, 2, 3, 4, 5].map((_, index) => <Skeleton className='h-32 w-full' key={index} />)
        }  
    </div>
}


const UserWorkflows = async () => {
    await waitFor(2000)
    return <div></div>
}


export default page
