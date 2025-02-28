import { NodeProps } from '@xyflow/react'
import React, { memo } from 'react'
import { TimelineNodeData } from '@/types/nodes';


const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
const TimelineNodeComponent = memo((props: NodeProps) => {
    const nodeData = props.data as TimelineNodeData
    return (
        <div className="p-2 border border-border bg-background rounded shadow min-w-[120px]">
        <p className="font-semibold text-sm">{nodeData.label}</p>
        {nodeData.createdBy && (
          <p className="text-xs text-muted-foreground">By: {nodeData.createdBy}</p>
        )}
      </div>
    )
});

export default TimelineNodeComponent
TimelineNodeComponent.displayName = 'TimelineNodeComponent'