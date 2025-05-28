"use client";

import { ColorForHandle } from '@/app/workflow/_components/nodes/common';
import { cn } from '@/lib/utils';
import { sanitizeHandleId } from '@/lib/workflow/handleUtils';
import { TaskParam } from '@/types/task';
import { Handle, Position } from '@xyflow/react';
import React from 'react';

const NodeOutputs = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='flex flex-col space-y-1'>
        {children}
    </div>
  )
}


export const NodeOutput = ({ output }: { output: TaskParam }) => {
  const handleId = sanitizeHandleId(output.name)

  return (
    <div className="relative flex items-center justify-between p-2 border border-border bg-secondary/40 w-full text-sm">
      <p className="text-xs text-muted-foreground">{output.name}</p>
      <Handle
        id={handleId}
        type="source"
        position={Position.Right}
        className={cn(
          '!bg-muted-foreground !border-2 !border-background !-right-2 !w-4 !h-4',
          ColorForHandle[output.type]
        )}
      />
    </div>
  )
}

export default NodeOutputs

