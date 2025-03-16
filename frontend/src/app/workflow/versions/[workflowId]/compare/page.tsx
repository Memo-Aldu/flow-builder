import { getWorkflowVersionByNumber } from '@/lib/api/versions';
import { auth } from '@clerk/nextjs/server';
import React, { Suspense } from 'react'
import VersionCompare from '@/app/workflow/versions/[workflowId]/compare/_components/VersionCompare';
import TopBar from '@/app/workflow/_components/topbar/TopBar';
import { InboxIcon, Loader2Icon } from 'lucide-react';
import { getWorkflow } from '@/lib/api/workflows';


type CompareProps = {
  params: { workflowId: string };
  searchParams: { version_1?: string; version_2?: string };
};

const compare = async ({ params, searchParams }: CompareProps) => {
  const resolvedParams = await Promise.resolve(params); 
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const { workflowId } = resolvedParams;
  const { version_1, version_2 } = resolvedSearchParams;

  return (
      <div className='w-full h-full overflow-auto'>
          <TopBar workflowId={workflowId}
            hideButtons
            title='Compare versions'
            subtitle='View differences between two versions'>

          </TopBar>

          <Suspense fallback={
              <div className="flex w-full h-full items-center justify-center">
                  <Loader2Icon className='animate-spin stroke-primary' size={30}/>
              </div>
          }>
            <CompareVersionsWrapper workflowId={workflowId} version_1={Number(version_1)} version_2={Number(version_2)}/>
      </Suspense>
      </div>
  )
}

export default compare


const CompareVersionsWrapper = async ({ workflowId, version_1, version_2 } : { workflowId: string, version_1: number, version_2: number}) => {
  const { userId, getToken } = await auth();
  const token = await getToken();
  if (!userId || !token) {
    return (
      <div>
        Please log in again.
      </div>
    )
  }


  if (!version_1 || !version_2) {
    return (
      <div className="container w-full py-6">
          <div className="flex items-center flex-col gap-2 justify-center h-full w-full">
              <div className="rounded-full bg-accent w-20 h-20 flex items-center justify-center">
                  <InboxIcon size={40} className='stroke-primary'/>
              </div>
              <div className="flex flex-col gap-1 text-center">
                  <p className="font-bold">
                      No versions selected
                  </p>
                  <p className="text-muted-foreground text-sm">
                      Select two versions to compare
                  </p>
              </div>
          </div>
      </div>
    )
  }

  const [vA, vB, workflow] = await Promise.all([
    getWorkflowVersionByNumber(workflowId, version_1, token),
    getWorkflowVersionByNumber(workflowId, version_2, token),
    getWorkflow(workflowId, token)
  ]).catch(() => [null, null, null]);
  

  if (!vA || !vB || !workflow) {
    return (
      <div className="container w-full py-6">
          <div className="flex items-center flex-col gap-2 justify-center h-full w-full">
              <div className="rounded-full bg-accent w-20 h-20 flex items-center justify-center">
                  <InboxIcon size={40} className='stroke-primary'/>
              </div>
              <div className="flex flex-col gap-1 text-center">
                  <p className="font-bold">
                      Versions not found
                  </p>
                  <p className="text-muted-foreground text-sm">
                      Please select valid versions to compare
                  </p>
              </div>
          </div>
      </div>
    )
  }

  return (
    <div className="container w-full py-6">
      <VersionCompare versionA={vA} versionB={vB} workflow={workflow}  />
    </div>
  )
}