"use client";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getWorkflowVersions } from '@/lib/api/versions';
import { WorkflowVersion } from '@/types/versions';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react'
import VersionTable from '@/app/workflow/versions/[workflowId]/_components/VersionTable';
import VersionTimeline from '@/app/workflow/versions/[workflowId]/_components/VersionTimeline';

type Props = {
    workflowId: string;
    initialData: WorkflowVersion[];
  };

const VersionControl = ({ workflowId, initialData }: Props) => {
    const { getToken } = useAuth();
    const [token, setToken] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

    useEffect(() => {
        (async () => {
            const retrievedToken = await getToken();
            setToken(retrievedToken);
        })();
    }, [getToken]);

    const versionsQuery = useQuery({
        queryKey: ["versions", workflowId],
        queryFn: async () => {
            if (!token) return [];
            return await getWorkflowVersions(workflowId, token, 1, 50);
        },

        refetchInterval: 10000,
        initialData,
        enabled: !!token, 
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