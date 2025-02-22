import React, { Suspense } from 'react'
import TopBar from '@/app/workflow/_components/topbar/TopBar'
import { getExecutions } from '@/lib/api/executions'
import { auth } from '@clerk/nextjs/server'
import { InboxIcon, Loader2Icon } from 'lucide-react'
import ExecutionTable from '@/app/workflow/runs/[workflowId]/_components/ExecutionTable'

const ExecutionsPage = async ({ params } : { params: {workflowId: string}}) => {
  const resolvedParams = await Promise.resolve(params); 
  const { workflowId } = resolvedParams;
  return (
    <div className='w-full h-full overflow-auto'>
        <TopBar workflowId={workflowId}
          hideButtons
          title='Workflow runs'
          subtitle='View all runs of this workflow'>

        </TopBar>

        <Suspense fallback={
            <div className="flex w-full h-full items-center justify-center">
                <Loader2Icon className='animate-spin stroke-primary' size={30}/>
            </div>
        }>
            <ExecutionTableWrapper workflowId={workflowId}/>
        </Suspense>
    </div>
  )
}

export default ExecutionsPage


const ExecutionTableWrapper = async ({ workflowId } : {workflowId: string}) => {
    const { userId, getToken } = await auth();
    const token = await getToken();
    if (!userId || !token) {
      return (
        <div>
          Please log in again.
        </div>
      )
    }
    
    const executions = await getExecutions(token, workflowId)

    if (!executions) {
      return (
        <div>
          No executions found
        </div>
      )
    }

    if (executions.length === 0) {
      return (
        <div className="container w-full py-6">
            <div className="flex items-center flex-col gap-2 justify-center h-full w-full">
                <div className="rounded-full bg-accent w-20 h-20 flex items-center justify-center">
                    <InboxIcon size={40} className='stroke-primary'/>
                </div>
                <div className="flex flex-col gap-1 text-center">
                    <p className="font-bold">
                        No executions found for this workflow
                    </p>
                    <p className="text-muted-foreground text-sm">
                        You can run the workflow in the editor to see executions here
                    </p>
                </div>
            </div>
        </div>
      )
    }

    return <div className="container w-full py-6">
        <ExecutionTable workflowId={workflowId} initialData={executions}/>
      </div>
}