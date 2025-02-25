import { getWorkflow } from '@/lib/api/workflows';
import { auth } from '@clerk/nextjs/server'
import React from 'react'
import Editor from '@/app/workflow/_components/Editor';
import { getWorkflowVersion } from '@/lib/api/versions';

const page = async ({ params }: { params: { workflowId: string }}) => {
  const { userId, getToken } = await auth();
  const token = await getToken();
  const resolvedParams = await Promise.resolve(params); 
  const { workflowId } = resolvedParams;
  if (!userId || !token) {
    return (
      <div>
        Please log in again.
      </div>
    )
  }

  const workflow = await getWorkflow(workflowId, token);

  if (workflow.active_version_id) {
    const workflowVersion = await getWorkflowVersion(workflowId, workflow.active_version_id, token);
    workflow.active_version = workflowVersion;
  }

  return (
    <Editor workflow={workflow} />
  )
}

export default page
