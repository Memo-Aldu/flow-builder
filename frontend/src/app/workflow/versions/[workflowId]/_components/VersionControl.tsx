"use client";
import VersionTable from '@/app/workflow/versions/[workflowId]/_components/VersionTable';
import VersionTimeline from '@/app/workflow/versions/[workflowId]/_components/VersionTimeline';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { UnifiedVersionsAPI } from '@/lib/api/unified-functions-client';
import { WorkflowVersion } from '@/types/versions';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

type Props = {
    workflowId: string;
    initialData: WorkflowVersion[];
  };

const VersionControl = ({ workflowId, initialData }: Props) => {
    const { getToken, isAuthenticated } = useUnifiedAuth();
    const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

    const versionsQuery = useQuery({
        queryKey: ["versions", workflowId],
        queryFn: async () => {
            const token = await getToken();
            return UnifiedVersionsAPI.client.list(workflowId, 1, 50, undefined, undefined, token);
        },

        refetchInterval: isAuthenticated ? 10000 : false, // Only refetch if authenticated
        initialData,
        enabled: isAuthenticated,
    });

  return (
    <div className="w-full h-full flex flex-col gap-2 p-4">
      {/* Top UI controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Versions</h1>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(val) => val && setViewMode(val as "table" | "timeline")}
          className="mr-2"
        >
          <ToggleGroupItem value="table">Table</ToggleGroupItem>
          <ToggleGroupItem value="timeline">Timeline</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {viewMode === "table" ? (
        <VersionTable workflowId={workflowId} initialData={versionsQuery.data} />
      ) : (
        <VersionTimeline workflowId={workflowId} initialData={versionsQuery.data} />
      )}
    </div>
  );
}

export default VersionControl