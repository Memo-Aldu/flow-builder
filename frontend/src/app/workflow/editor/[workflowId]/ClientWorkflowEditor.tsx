"use client";

import Editor from '@/app/workflow/_components/Editor';
import { UnifiedVersionsAPI, UnifiedWorkflowsAPI } from '@/lib/api/unified-functions-client';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

interface ClientWorkflowEditorProps {
  workflowId: string;
}

export function ClientWorkflowEditor({ workflowId }: ClientWorkflowEditorProps) {
  const { getToken, isAuthenticated } = useUnifiedAuth();
  const router = useRouter();

  const { data: workflow, isLoading, error } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      const token = await getToken();
      const workflow = await UnifiedWorkflowsAPI.client.get(workflowId, token);
      
      if (workflow.active_version_id) {
        const workflowVersion = await UnifiedVersionsAPI.client.get(workflowId, workflow.active_version_id, token);
        workflow.active_version = workflowVersion;
      }
      
      return workflow;
    },
    enabled: isAuthenticated,
    retry: (failureCount, error: any) => {
      // Don't retry for 404 errors (workflow doesn't exist)
      if (error?.response?.status === 404) {
        return false;
      }
      // Don't retry for auth errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (error) {
    const errorStatus = (error as any)?.response?.status;
    
    // If workflow doesn't exist, redirect to workflows page
    if (errorStatus === 404) {
      router.push('/dashboard/workflows');
      return null;
    }

    // For other errors, show error message
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load workflow</h2>
          <p className="text-muted-foreground mb-4">
            {errorStatus === 403 
              ? "You don't have permission to access this workflow."
              : "There was an error loading the workflow. Please try again."}
          </p>
          <button 
            onClick={() => router.push('/dashboard/workflows')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }

  // If no workflow data, show loading (shouldn't happen with proper query states)
  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  // Render the editor with the loaded workflow
  return <Editor workflow={workflow} />;
}
