import { Handle, NodeProps, Position } from '@xyflow/react'
import React, { memo } from 'react'
import { TimelineNodeData } from '@/types/nodes';


const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
const TimelineNodeComponent = memo((props: NodeProps) => {
    const nodeData = props.data as TimelineNodeData
    return (
      <div className="p-2 border border-border bg-background rounded shadow min-w-[140px]">
        <Handle type="target" position={Position.Left} style={{ background: "#555" }} />
  
        <p className="font-semibold text-sm">{nodeData.label}</p>
        {nodeData.createdBy && <p className="text-xs text-muted-foreground">By: {nodeData.createdBy}</p>}
  
        <Handle type="source" position={Position.Right} style={{ background: "#555" }} />
      </div>
    );
  });

export default TimelineNodeComponent
TimelineNodeComponent.displayName = 'TimelineNodeComponent'