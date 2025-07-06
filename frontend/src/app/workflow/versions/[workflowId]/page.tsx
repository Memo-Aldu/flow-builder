import TopBar from '@/app/workflow/_components/topbar/TopBar';
import { UnifiedVersionsAPI } from '@/lib/api/unified-functions';
import { ReactFlowProvider } from '@xyflow/react';
import { InboxIcon, Loader2Icon } from 'lucide-react';
import React, { Suspense } from 'react';
import VersionControl from './_components/VersionControl';

const WorkflowVersionsPage = async ({ params } : { params: Promise<{workflowId: string}>}) => {
    const resolvedParams = await params;
    const { workflowId } = resolvedParams;
    return (
      <ReactFlowProvider>
      <div className='w-full h-full overflow-auto'>
          <TopBar workflowId={workflowId}
            hideButtons
            title='Workflow versions'
            subtitle='View all versions of this workflow'>
  
          </TopBar>
  
          <Suspense fallback={
              <div className="flex w-full h-full items-center justify-center">
                  <Loader2Icon className='animate-spin stroke-primary' size={30}/>
              </div>
          }>
              <WorkflowVersionsWrapper workflowId={workflowId}/>
          </Suspense>
      </div>
      </ReactFlowProvider>
    )
}

export default WorkflowVersionsPage


const WorkflowVersionsWrapper = async ({ workflowId } : {workflowId: string}) => {
    try {
        const versions = await UnifiedVersionsAPI.server.list(workflowId, 1, 25);

    if (versions.length === 0) {
      return (
        <div className="container w-full py-6">
            <div className="flex items-center flex-col gap-2 justify-center h-full w-full">
                <div className="rounded-full bg-accent w-20 h-20 flex items-center justify-center">
                    <InboxIcon size={40} className='stroke-primary'/>
                </div>
                <div className="flex flex-col gap-1 text-center">
                    <p className="font-bold">
                        No versions found
                    </p>
                    <p className="text-muted-foreground text-sm">
                        Start editing your workflow to create a new version
                    </p>
                </div>
            </div>
        </div>
      )
    }

        return (
          <div className="container w-full py-6">
            <VersionControl workflowId={workflowId} initialData={versions} />
          </div>
        )
    } catch (error) {
        console.error('Failed to load versions on server-side, falling back to client-side loading:', error);
        // Fall back to client-side loading instead of failing
        return (
          <div className="container w-full py-6">
            <VersionControl workflowId={workflowId} initialData={[]} />
          </div>
        )
    }
}