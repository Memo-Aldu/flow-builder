import { getWorkflow } from '@/lib/api/workflows';
import { auth } from '@clerk/nextjs/server'
import React from 'react'
import Editor from '@/app/workflow/_components/Editor';

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

  return (
    <Editor workflow={workflow} />
  )
}

export default page
