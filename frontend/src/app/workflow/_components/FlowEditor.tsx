"use client";

import React, { useCallback, useEffect } from 'react'
import { Workflow } from '@/types/workflows'
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
    useReactFlow} from '@xyflow/react';

import "@xyflow/react/dist/style.css";
import createFlowNode from '@/lib/workflow/createFlowNode';
import { TaskType } from '@/types/task';
import NodeComponent from '@/app/workflow/_components/nodes/NodeComponent';
import { AppNode } from '@/types/nodes';
import DeletableEdge from '@/app/workflow/_components/edges/DeletableEdge';
import { TaskRegistry } from '@/lib/workflow/task/registry';

const nodeTypes = {
    FlowBuilderNode: NodeComponent
}

const edgeTypes = {
  default: DeletableEdge
}

const snapGrid: [number, number] = [50, 50];
const fitViewOptions = { padding: 0.5 };

const FlowEditor = ({ workflow }: { workflow: Workflow }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
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

    const nodeInputs = targetNode.data.inputs

    updateNodeData(targetNode.id, {
      inputs: {
        ...nodeInputs,
        [connection.targetHandle]: ""
      }
    });
  }, [setEdges, updateNodeData, nodes]);

  useEffect(() => {
    try {
      if (!workflow.definition) return;
      setNodes(workflow.definition.nodes ?? []);
      setEdges(workflow.definition.edges ?? []);
      if (!workflow.definition.viewport) return;
      const { x=0, y=0, zoom=1 } = workflow.definition.viewport;
      setViewport({ x, y, zoom });

    } catch (error) {

    }
  }, [workflow.definition, setEdges, setNodes, setViewport])

  const isValidConnection = useCallback((connection: Edge | Connection) => {
    // Prevent connecting to self
    if (connection.source === connection.target) return false;

    // same taskParam type connection
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    const sourceTask = TaskRegistry[sourceNode.data.type];
    const targetTask = TaskRegistry[targetNode.data.type];

    const output = sourceTask.outputs.find((output) => output.name === connection.sourceHandle);
    const input = targetTask.inputs.find((input) => input.name === connection.targetHandle);

    if (!output || !input) return false;

    if (output.type !== input.type) return false;

    const hasCycle = (node: AppNode, visited = new Set<string>()) => {
      if (visited.has(node.id)) return true;
      visited.add(node.id);

      for (const outgoer of getOutgoers(node, nodes, edges)) {
        if (outgoer.id === connection.source) return true;
        if (hasCycle(outgoer, visited)) return true;
      }
    }
    const detectedCycle = hasCycle(targetNode)
    return !detectedCycle;
  }, [nodes, edges]);

  console.log("@Updated", nodes);
  return (
    <main className='h-full w-full'>
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
        </ReactFlow>
    </main>
  )
}

export default FlowEditor