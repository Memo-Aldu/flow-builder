import TopBar from '@/app/workflow/_components/topbar/TopBar'
import { getExecution } from '@/lib/api/executions'
import { listPhases } from '@/lib/api/phases'
import { auth } from '@clerk/nextjs/server'
import { Loader2Icon } from 'lucide-react'
import React, { Suspense } from 'react'
import ExecutionView from '@/app/workflow/runs/[workflowId]/[executionId]/_components/ExecutionView'

const ExecutionPage = async ({ params} : { params: {executionId: string, workflowId: string}}) => {
    const resolvedParams = await Promise.resolve(params); 
    const { workflowId, executionId } = resolvedParams;

  return (
    <div className='flex flex-col h-screen w-full overflow-hidden'>
      <TopBar workflowId={workflowId} 
      title='Workflow run details'
      subtitle={`Run ID: ${executionId}`}
      hideButtons />
      <section className='flex h-full overflow-auto'>
        <Suspense fallback={
          <div className="flex w-full items-center justify-center">
            <Loader2Icon className='h-10 w-10 animate-spin stroke-primary'/>
          </div>
        }>
          <ExecutionViewWrapper executionId={executionId} workflowId={workflowId} />
        </Suspense>
      </section>
    </div>
  )
}

export default ExecutionPage


const ExecutionViewWrapper = async ({ executionId, workflowId }: { executionId: string, workflowId: string }) => {
  const { getToken } = await auth()
  const token = await getToken()

  if (!token) {
    return <div>
      Please log in again.
    </div>
  }

  const [execution, phases] = await Promise.all([
    getExecution(token, executionId),
    listPhases(token, executionId)
  ]);

  if (!execution || !phases) {
    return <div>
      Execution not found
    </div>
  }
  return <ExecutionView initialExecution={execution} initialPhases={phases}/>
}