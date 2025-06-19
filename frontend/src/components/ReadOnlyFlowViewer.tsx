"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useEffect, useMemo } from "react";

import DeletableEdge from "@/app/workflow/_components/edges/DeletableEdge";
import NodeComponent from "@/app/workflow/_components/nodes/NodeComponent";
import { sanitizeHandleId } from "@/lib/workflow/handleUtils";

const nodeTypes = {
  FlowBuilderNode: NodeComponent,
};
const edgeTypes = {
  default: DeletableEdge,
};


interface ReadOnlyFlowViewerProps {
  nodes: Node[];
  edges: Edge[];
  initialViewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

const ReadOnlyFlowViewer = ({
  nodes,
  edges,
  initialViewport,
}: ReadOnlyFlowViewerProps) => {
  const { setViewport } = useReactFlow();

  // Sanitize edge handle IDs for React Flow compatibility
  const sanitizedEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      sourceHandle: edge.sourceHandle ? sanitizeHandleId(edge.sourceHandle) : edge.sourceHandle,
      targetHandle: edge.targetHandle ? sanitizeHandleId(edge.targetHandle) : edge.targetHandle
    }));
  }, [edges]);

  useEffect(() => {
    if (initialViewport) {
      setViewport(initialViewport, { duration: 800 });
    }
  }, [initialViewport, setViewport]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={sanitizedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        fitView
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
      </ReactFlow>
    </div>
  );
}

export default ReadOnlyFlowViewer
