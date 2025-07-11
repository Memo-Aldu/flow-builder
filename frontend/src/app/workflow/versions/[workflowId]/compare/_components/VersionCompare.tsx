"use client";

import { useUnifiedAuth } from '@/contexts/AuthContext';
import useFlowDiff from '@/hooks/use-FlowDiff';
import { UnifiedWorkflowsAPI } from '@/lib/api/unified-functions-client';
import { AppNode } from '@/types/nodes';
import { WorkflowVersion } from '@/types/versions';
import { Workflow } from '@/types/workflows';
import { Edge } from '@xyflow/react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';
import VersionCard from './VersionCard';


type CompareProps = {
    versionA: WorkflowVersion;
    versionB: WorkflowVersion;
    workflow: Workflow;
}

const VersionCompare = ({ versionA, versionB, workflow }: CompareProps) => {
  const { isAuthenticated, getToken } = useUnifiedAuth();
  const router = useRouter();
  
  const nodesA = (versionA.definition?.nodes as AppNode[]) || [];
  const edgesA = (versionA.definition?.edges as Edge[]) || [];
  const viewportA = versionA.definition?.viewport ?? { x: 0, y: 0, zoom: 1 };

  const nodesB = (versionB.definition?.nodes as AppNode[]) || [];
  const edgesB = (versionB.definition?.edges as Edge[]) || [];
  const viewportB = versionB.definition?.viewport ?? { x: 0, y: 0, zoom: 1 };

  const {
    highlightNodesA,
    highlightNodesB,
    changedInputsMapA,
    changedInputsMapB,
    highlightEdgesA,
    highlightEdgesB,
  } = useFlowDiff(nodesA, edgesA, nodesB, edgesB);

  const styledNodesA = nodesA.map((node) => {
    if (highlightNodesA.includes(node.id)) {
      return { ...node, style: { ...node.style, border: "2px solid #facc15" } };
    }
    if (changedInputsMapA.has(node.id)) {
      return {
        ...node,
        data: {
          ...node.data,
          changedInputs: changedInputsMapA.get(node.id),
        },
        style: { ...node.style, border: "2px solid #facc15" },
      };
    }
    return node;
  });

  const styledEdgesA = edgesA.map((edge) => {
    if (edge.id && highlightEdgesA.includes(edge.id)) {
      return {
        ...edge,
        style: { ...edge.style, stroke: "#facc15", strokeWidth: 2 },
      };
    }
    return edge;
  });

  const styledNodesB = nodesB.map((node) => {
    if (highlightNodesB.includes(node.id)) {
      return { ...node, style: { ...node.style, border: "2px solid #facc15" } };
    }
    if (changedInputsMapB.has(node.id)) {
      return {
        ...node,
        data: {
          ...node.data,
          changedInputs: changedInputsMapB.get(node.id),
        },
        style: { ...node.style, border: "2px solid #facc15" },
      };
    }
    return node;
  });

  const styledEdgesB = edgesB.map((edge) => {
    if (edge.id && highlightEdgesB.includes(edge.id)) {
      return {
        ...edge,
        style: { ...edge.style, stroke: "#facc15", strokeWidth: 2 },
      };
    }
    return edge;
  });

  const onRollbackVersion = async (versionId: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to rollback a version");
      return;
    }
    const token = await getToken();

    if (workflow.active_version_id === versionId) {
      toast.warning("Cannot rollback to the active version");
      return;
    }

    if (workflow.status !== "draft") {
      toast.warning("Cannot rollback a published workflow, please unpublish it first");
      return;
    }

    try {
      await UnifiedWorkflowsAPI.client.rollback(workflow.id, versionId, token);
      toast.success(`Rolled back to version ${versionA.id === versionId ?
        versionA.version_number : versionB.version_number}`);
      router.push(`/workflow/versions/${workflow.id}`);
    }
    catch (error) {
      toast.error("Failed to rollback version");
    }

  };

  return (
    <div className="w-full h-full flex">
      {/* Left version */}
      <VersionCard
        version={versionA}
        nodes={styledNodesA}
        edges={styledEdgesA}
        viewport={viewportA}
        onRollback={onRollbackVersion}
      />

      {/* Right version */}
      <VersionCard
        version={versionB}
        nodes={styledNodesB}
        edges={styledEdgesB}
        viewport={viewportB}
        onRollback={onRollbackVersion}
      />
    </div>
  );
}

export default VersionCompare