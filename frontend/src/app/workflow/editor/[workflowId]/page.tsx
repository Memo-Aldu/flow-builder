import Editor from '@/app/workflow/_components/Editor';
import { UnifiedVersionsAPI, UnifiedWorkflowsAPI } from '@/lib/api/unified-functions';
import { getUnifiedAuth } from '@/lib/auth/unified-auth';
import React from 'react';

const page = async ({ params }: { params: { workflowId: string }}) => {
  const user = await getUnifiedAuth();

  if (!user) {
    return (
      <div>
        Please log in again.
      </div>
    )
  }

  const resolvedParams = await Promise.resolve(params);
  const { workflowId } = resolvedParams;

  if (!user.id) {
    return (
      <div>
        Please log in again.
      </div>
    )
  }

  const workflow = await UnifiedWorkflowsAPI.server.get(workflowId);

  if (workflow.active_version_id) {
    const workflowVersion = await UnifiedVersionsAPI.server.get(workflowId, workflow.active_version_id);
    workflow.active_version = workflowVersion;
  }

  return (
    <Editor workflow={workflow} />
  )
}

export default page
