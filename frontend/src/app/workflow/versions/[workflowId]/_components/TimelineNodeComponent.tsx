import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TimelineNodeData } from '@/types/nodes';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { formatDistanceToNow } from 'date-fns';
import React, { memo } from 'react';


const TimelineNodeComponent = memo((props: NodeProps) => {
  const nodeData = props.data as TimelineNodeData;

  const displayCreatedBy = nodeData.createdBy ?? "Unknown";
  const dateVal = nodeData.createdAt ? new Date(nodeData.createdAt) : null;
  const createdAgo = dateVal
    ? formatDistanceToNow(dateVal, { addSuffix: true })
    : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col items-start p-3 border gap-1 rounded shadow min-w-[200px] max-w-[240px] text-left cursor-pointer transition-colors",
        nodeData.isSelected
          ? "bg-accent border-primary"
          : "bg-background border-border hover:bg-accent/30"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className='!bg-rose-400'
      />

      <div className="flex items-center justify-between w-full gap-2">
        <p className="font-semibold text-sm truncate">{nodeData.label}</p>
        {nodeData.isLatest && (
          <Badge variant="outline" className="text-xs">
            Latest
          </Badge>
        )}
      </div>

      <div className="flex flex-col text-xs text-muted-foreground w-full">
        <span className="truncate max-w-full">
        <p className='font-bold inline-block'>By:</p> {displayCreatedBy}
        </span>
        {createdAgo && (
          <span>
            <p className='font-bold inline-block'>Created:</p> {createdAgo}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className='!bg-rose-400'
      />
    </div>
  );
});

export default TimelineNodeComponent
TimelineNodeComponent.displayName = 'TimelineNodeComponent'