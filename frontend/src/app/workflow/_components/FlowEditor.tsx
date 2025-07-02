"use client";

import { Workflow } from '@/types/workflows';
import {
    addEdge,
    Background,
    BackgroundVariant,
    Connection,
    Controls,
    Edge,
    getOutgoers,
    ReactFlow,
    useEdgesState,
    useNodesState,
    useReactFlow
} from '@xyflow/react';
import React, { useCallback, useEffect, useState } from 'react';

import DeletableEdge from '@/app/workflow/_components/edges/DeletableEdge';
import NodeComponent from '@/app/workflow/_components/nodes/NodeComponent';
import ReadOnlyFlowViewer from '@/components/ReadOnlyFlowViewer';
import createFlowNode from '@/lib/workflow/createFlowNode';
import { sanitizeHandleId } from '@/lib/workflow/handleUtils';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { AppNode } from '@/types/nodes';
import { TaskParamType, TaskType } from '@/types/task';
import "@xyflow/react/dist/style.css";

const nodeTypes = {
    FlowBuilderNode: NodeComponent
}

const edgeTypes = {
  default: DeletableEdge
}

const snapGrid: [number, number] = [50, 50];
const fitViewOptions = { padding: 0.5 };

const FlowEditor = ({ workflow }: { workflow: Workflow}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isWorkflowLoaded, setIsWorkflowLoaded] = useState(false);
  const { setViewport, screenToFlowPosition, updateNodeData } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const taskType = event.dataTransfer.getData('application/reactflow');
    if (typeof taskType === 'undefined' || !taskType ) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY
    });
    const newNode = createFlowNode(taskType as TaskType, position);
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, [screenToFlowPosition, setNodes]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((prevEdges) => addEdge({ ...connection, animated: true }, prevEdges));

    if (!connection.targetHandle) return

    const targetNode = nodes.find((node) => node.id === connection.target);
    if (!targetNode) return;

    // Find the target input to check its type
    const targetTask = TaskRegistry[targetNode.data.type];
    const targetInput = targetTask.inputs.find((input) => sanitizeHandleId(input.name) === connection.targetHandle);

    // Don't set value for CONDITIONAL inputs - they get their values from the connected outputs
    if (targetInput?.type === TaskParamType.CONDITIONAL) {
      return;
    }

    const nodeInputs = targetNode.data.inputs

    updateNodeData(targetNode.id, {
      inputs: {
        ...nodeInputs,
        [targetInput?.name ?? connection.targetHandle]: ""
      }
    });
  }, [setEdges, updateNodeData, nodes]);

  // Migration function to convert handle names to sanitized IDs
  const migrateHandleNames = useCallback((edges: Edge[]) => {
    return edges.map(edge => ({
      ...edge,
      sourceHandle: edge.sourceHandle ? sanitizeHandleId(edge.sourceHandle) : edge.sourceHandle,
      targetHandle: edge.targetHandle ? sanitizeHandleId(edge.targetHandle) : edge.targetHandle
    }));
  }, []);

  useEffect(() => {
    try {
      if (!workflow.active_version) {
        // Workflow has no active version - this is a new/empty workflow
        setNodes([]);
        setEdges([]);
        setIsWorkflowLoaded(true);
        return;
      }

      setNodes(workflow.active_version.definition?.nodes ?? []);

      // Migrate old handle names in edges
      const originalEdges = workflow.active_version.definition?.edges ?? [];
      const migratedEdges = migrateHandleNames(originalEdges);
      setEdges(migratedEdges);

      if (workflow.active_version.definition?.viewport) {
        const { x=0, y=0, zoom=1 } = workflow.active_version.definition.viewport;
        setViewport({ x, y, zoom });
      }

      setIsWorkflowLoaded(true);

    } catch (error) {
      console.error('Error loading workflow data:', error);
      // Set empty state on error
      setNodes([]);
      setEdges([]);
      setIsWorkflowLoaded(true);
    }
  }, [workflow.active_version?.definition, setEdges, setNodes, setViewport, migrateHandleNames, setIsWorkflowLoaded])

  const isValidConnection = useCallback((connection: Edge | Connection) => {
    // Prevent connecting to self
    if (connection.source === connection.target) return false;

    // same taskParam type connection
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    const sourceTask = TaskRegistry[sourceNode.data.type];
    const targetTask = TaskRegistry[targetNode.data.type];

    const output = sourceTask.outputs.find((output) => sanitizeHandleId(output.name) === connection.sourceHandle);
    const input = targetTask.inputs.find((input) => sanitizeHandleId(input.name) === connection.targetHandle);

    if (!output || !input) return false;

    if (output.type !== input.type) return false;

    // Prevent multiple connections to the same input handle
    const existingConnectionToTarget = edges.some(edge =>
      edge.target === connection.target && edge.targetHandle === connection.targetHandle
    );
    if (existingConnectionToTarget) return false;

    // Check for cycles by simulating the new connection
    // A cycle exists if we can reach the source node by following outgoing edges from the target node
    const wouldCreateCycle = (currentNode: AppNode, visited = new Set<string>()): boolean => {
      if (currentNode.id === connection.source) return true;
      if (visited.has(currentNode.id)) return false;

      visited.add(currentNode.id);

      for (const outgoer of getOutgoers(currentNode, nodes, edges)) {
        if (wouldCreateCycle(outgoer, visited)) return true;
      }

      return false;
    }

    const detectedCycle = wouldCreateCycle(targetNode)
    return !detectedCycle;
  }, [nodes, edges]);

  const isViewOnly = workflow.status === 'published' || workflow.status === 'disabled';

  // Show loading state while workflow is being loaded
  if (!isWorkflowLoaded) {
    return (
      <main className='h-full w-full flex items-center justify-center'>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </main>
    );
  }

  return (
    <main className='h-full w-full'>
      { isViewOnly ? (
        <ReadOnlyFlowViewer
          nodes={nodes}
          edges={edges}>

        </ReadOnlyFlowViewer>
      ) : (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            snapToGrid
            snapGrid={snapGrid}
            fitViewOptions={fitViewOptions}
            fitView
            onDragOver={onDragOver}
            onDrop={onDrop}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
        >
            <Controls position='top-left' fitViewOptions={fitViewOptions}/>
            <Background variant={BackgroundVariant.Dots} gap={24} size={1}/>
            {/* Show helpful message for empty workflows */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center p-8 bg-background/80 rounded-lg border border-border">
                  <p className="text-lg font-medium mb-2">Start building your workflow</p>
                  <p className="text-muted-foreground">
                    Drag and drop nodes from the task menu to get started
                  </p>
                </div>
              </div>
            )}
        </ReactFlow>
      )}
    </main>
  )
}

export default FlowEditor