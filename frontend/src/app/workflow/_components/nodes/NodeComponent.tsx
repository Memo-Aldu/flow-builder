import NodeCard from '@/app/workflow/_components/nodes/NodeCard';
import NodeHeader from '@/app/workflow/_components/nodes/NodeHeader';
import { NodeInput, NodeInputs } from '@/app/workflow/_components/nodes/NodeInputs';
import NodeOutputs, { NodeOutput } from '@/app/workflow/_components/nodes/NodeOutputs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { sanitizeHandleId } from '@/lib/workflow/handleUtils';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { AppNodeData } from '@/types/nodes';
import { NodeProps, useEdges } from '@xyflow/react';
import React, { memo } from 'react';


const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
const NodeComponent = memo((props: NodeProps) => {
    const nodeData = props.data as AppNodeData;
    const task = TaskRegistry[nodeData.type];
    const edges = useEdges();

    const requiredInputs = task.inputs.filter((input) => input.required)
    const optionalInputs = task.inputs.filter((input) => !input.required)

    // Check if any optional inputs are connected
    const hasConnectedOptionalInputs = optionalInputs.some(input =>
        edges.some(edge => edge.target === props.id && edge.targetHandle === sanitizeHandleId(input.name))
    )

    return (
    <NodeCard nodeId={props.id} isSelected={props.selected}>
        {DEV_MODE && <Badge>DEV: {props.id}</Badge>}
        <NodeHeader taskType={nodeData.type} nodeId={props.id}/>
        {/* Required Inputs */}
        {requiredInputs.length > 0 && (
            <NodeInputs>
            {requiredInputs.map((input) => (
                <NodeInput key={input.name} input={input} nodeId={props.id} />
            ))}
            </NodeInputs>
        )}

        {optionalInputs.length > 0 && (
            <Accordion
            type="single"
            collapsible
            defaultValue={hasConnectedOptionalInputs ? "optionalInputs" : undefined}
            >
            <AccordionItem
                value="optionalInputs"
                className="!border-0 !p-0"
            >
                <AccordionTrigger
                className="flex items-center px-4 space-y-1 text-sm bg-secondary/40 hover:bg-secondary/60"
                >
                Optional Inputs
                </AccordionTrigger>
                <AccordionContent
                className="!p-0"
                >
                <NodeInputs>
                    {optionalInputs.map((input) => (
                    <NodeInput key={input.name} input={input} nodeId={props.id} />
                    ))}
                </NodeInputs>
                </AccordionContent>
            </AccordionItem>
            </Accordion>
        )}
        <NodeOutputs>
            {task.outputs.map((output) => (
                <NodeOutput key={output.name} output={output} />
            ))}
        </NodeOutputs>
    </NodeCard>)
});

export default NodeComponent
NodeComponent.displayName = 'NodeComponent'