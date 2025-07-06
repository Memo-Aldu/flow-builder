import TopBar from '@/app/workflow/_components/topbar/TopBar'
import ExecutionView from '@/app/workflow/runs/[workflowId]/[executionId]/_components/ExecutionView'
import { UnifiedExecutionsAPI, UnifiedPhasesAPI } from '@/lib/api/unified-functions'
import { Loader2Icon } from 'lucide-react'
import React, { Suspense } from 'react'

const ExecutionPage = async ({ params} : { params: Promise<{executionId: string, workflowId: string}>}) => {
    const resolvedParams = await params;
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

  const [execution, phases] = await Promise.all([
    UnifiedExecutionsAPI.server.get(executionId),
    UnifiedPhasesAPI.server.list(executionId)
  ]);

  if (!execution || !phases) {
    return <div>
      Execution not found
    </div>
  }
  return <ExecutionView initialExecution={execution} initialPhases={phases}/>
}