
"use client";

import React, { useEffect, useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  BackgroundVariant,
  Controls,
  useReactFlow,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { WorkflowVersion } from "@/types/versions";
import TimelineNodeComponent from "@/app/workflow/versions/[workflowId]/_components/TimelineNodeComponent";

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

  const nodes: Node[] = useMemo(() => {
    return initialData.map((version, index) => ({
      id: String(version.version_number),
      type: "TimelineNode",
      data: {
        label: `Version ${version.version_number}`,
        createdBy: version.created_by,
      },
      position: { x: 100, y: index * 200 },
      draggable: false,
    }));
  }, [initialData]);

  const edges: Edge[] = useMemo(() => {
    const sorted = [...initialData].sort((a, b) => a.version_number - b.version_number);
    const results: Edge[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      results.push({
        id: `edge-${sorted[i].version_number}-to-${sorted[i + 1].version_number}`,
        source: String(sorted[i].version_number),
        target: String(sorted[i + 1].version_number),
        animated: true,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#fff", strokeWidth: 2 },
      });
    }
    return results;
  }, [initialData]);

  useEffect(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, [setViewport]);

  return (
    <div className="h-[600px] w-full border rounded">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "#ffffff", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
        fitView
        panOnDrag
        zoomOnScroll
        zoomOnPinch
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
      </ReactFlow>
    </div>
  );
}


export default VersionTimeline

