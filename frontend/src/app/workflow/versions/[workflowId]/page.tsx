import { InboxIcon, Loader2Icon } from 'lucide-react';
import React, { Suspense } from 'react'
import TopBar from '@/app/workflow/_components/topbar/TopBar';
import { getWorkflowVersions } from '@/lib/api/versions';
import { auth } from '@clerk/nextjs/server';
import VersionControl from './_components/VersionControl';
import { ReactFlowProvider } from '@xyflow/react';

const WorkflowVersionsPage = async ({ params } : { params: {workflowId: string}}) => {
    const resolvedParams = await Promise.resolve(params); 
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
    const { userId, getToken } = await auth();
    const token = await getToken();
    if (!userId || !token) {
      return (
        <div>
          Please log in again.
        </div>
      )
    }
    
    const versions = await getWorkflowVersions(workflowId, token, 1, 25)

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
}