"use client";

import React, { useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useReactFlow,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import NodeComponent from "@/app/workflow/_components/nodes/NodeComponent";
import DeletableEdge from "@/app/workflow/_components/edges/DeletableEdge";

const nodeTypes = {
  FlowBuilderNode: NodeComponent,
};
const edgeTypes = {
  default: DeletableEdge,
};


type ReadOnlyFlowViewerProps = {
  nodes: Node[];
  edges: Edge[];
  initialViewport?: {
    x: number;
    y: number;
    zoom: number;
  };
};

const ReadOnlyFlowViewer = ({
  nodes,
  edges,
  initialViewport,
}: ReadOnlyFlowViewerProps) => {
  const { setViewport } = useReactFlow();

  useEffect(() => {
    if (initialViewport) {
      setViewport(initialViewport, { duration: 800 });
    }
  }, [initialViewport, setViewport]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
