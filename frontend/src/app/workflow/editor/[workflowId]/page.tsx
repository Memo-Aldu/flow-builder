import Editor from '@/app/workflow/_components/Editor';
import { UnifiedVersionsAPI, UnifiedWorkflowsAPI } from '@/lib/api/unified-functions';
import { redirect } from 'next/navigation';
import React from 'react';

const page = async ({ params }: { params: Promise<{ workflowId: string }> }) => {
  const resolvedParams = await params;
  const { workflowId } = resolvedParams;

  try {
    const workflow = await UnifiedWorkflowsAPI.server.get(workflowId);

    if (workflow.active_version_id) {
      const workflowVersion = await UnifiedVersionsAPI.server.get(workflowId, workflow.active_version_id);
      workflow.active_version = workflowVersion;
    }

    return (
      <Editor workflow={workflow} />
    )
  } catch (error) {
    console.error('Failed to load workflow:', error);
    // If workflow doesn't exist or user doesn't have access, redirect to workflows page
    redirect('/dashboard/workflows');
  }
}

export default page
