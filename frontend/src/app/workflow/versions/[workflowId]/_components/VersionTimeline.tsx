"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useReactFlow,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { WorkflowVersion } from "@/types/versions";
import TimelineNodeComponent from "@/app/workflow/versions/[workflowId]/_components/TimelineNodeComponent";
import buildTimeline from "@/lib/versions/buildTimeline";
import { Button } from "@/components/ui/button";
import { TimelineNode } from "@/types/nodes";
import { useRouter } from "next/navigation";
import { GitCompareIcon } from "lucide-react";

const nodeTypes = {
    TimelineNode: TimelineNodeComponent,
};

const edgeTypes = {};

type VersionTimelineProps  = {
  workflowId: string;
  initialData: WorkflowVersion[];
};

const VersionTimeline = ({ workflowId, initialData }: VersionTimelineProps) => {
  const { setViewport } = useReactFlow();
  const router = useRouter();

  const [selectedNodes, setSelectedNodes] = useState<TimelineNode[]>([]);

  const handleNodeClick = (event: React.MouseEvent, node: TimelineNode) => {
    setSelectedNodes((prev) => {
      // If already selected, remove
      if (prev.some((n) => n.id === node.id)) {
        return prev.filter((n) => n.id !== node.id);
      }
      if (prev.length >= 2) {
        return [prev[1], node];
      }
      return [...prev, node];
    });
  };

  const { nodes, edges } = useMemo(() => {
    const { nodes, edges } = buildTimeline(initialData);

    const augmentedNodes = nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        isSelected: selectedNodes.some((sn) => sn.id === n.id),
      },
    }));
    return { nodes: augmentedNodes, edges };
  }, [initialData, selectedNodes]);

  const handleCompare = () => {
    if (selectedNodes.length !== 2) return;
    const vA = initialData.find((v) => v.id === selectedNodes[0].id);
    const vB = initialData.find((v) => v.id === selectedNodes[1].id);
    router.push(
      `/workflow/versions/${workflowId}/compare?version_1=${vA?.version_number}&version_2=${vB?.version_number}`
    );
  };

  useEffect(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, [setViewport]);

  return (
    <div className="relative h-[700px] w-full border rounded">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "straight",
          style: { stroke: "#fff", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
        onNodeClick={handleNodeClick}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        fitView
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
      </ReactFlow>
      <div className="absolute top-2 right-2 z-10">
      <Button
          variant="outline"
          size="sm"
          disabled={
            selectedNodes.length !== 2
          }
          onClick={handleCompare}
        >
          <GitCompareIcon size={16} className="stroke-primary" />
          <span>Compare</span>        
        </Button>
        </div>
    </div>

  );
}


export default VersionTimeline

