"use client";
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ParamProps } from '@/types/nodes';
import React, { useId } from 'react';

const ConditionalParam = ({ param, value, disabled }: ParamProps) => {
  const id = useId();

  return (
    <div className="space-y-1 p-1 w-full">
      <Label htmlFor={id} className='text-xs flex items-center gap-2'>
        {param.name}
        {param.required && <span className='text-red-400 px-2'>*</span>}
        <Badge variant="outline" className="text-xs">
          Conditional
        </Badge>
      </Label>

      <div className="p-2 border border-dashed border-purple-300 rounded-md bg-purple-50/50 dark:bg-purple-950/20">
        {disabled ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span className="text-xs text-purple-700 dark:text-purple-300">
              Connected to condition
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span className="text-xs text-muted-foreground">
              Connect to a branch node output
            </span>
          </div>
        )}
      </div>

      {param.helperText && (
        <p className='text-xs text-muted-foreground px-2'>{param.helperText}</p>
      )}
    </div>
  )
}

export default ConditionalParam
