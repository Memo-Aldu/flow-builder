import Editor from '@/app/workflow/_components/Editor';
import { UnifiedVersionsAPI, UnifiedWorkflowsAPI } from '@/lib/api/unified-functions';
import React from 'react';
import { ClientWorkflowEditor } from './ClientWorkflowEditor';

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
    console.error('Failed to load workflow on server-side, falling back to client-side loading:', error);
    // Fall back to client-side loading instead of redirecting
    // This handles cases where server-side auth fails in Vercel but client-side works
    return (
      <ClientWorkflowEditor workflowId={workflowId} />
    )
  }
}

export default page
