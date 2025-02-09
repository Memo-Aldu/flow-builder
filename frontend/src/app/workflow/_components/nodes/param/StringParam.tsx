"use client";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ParamProps } from '@/types/nodes';
import React, { useEffect, useId } from 'react'

const StringParam = ({ param, value, updateNodeParamValue, disabled }: ParamProps) => {
  const [internalValue, setInternalValue] = React.useState(value);
  const id = useId();

  useEffect(() => {
    setInternalValue(value);
  }, [value])

  let Component: any = Input;
  if (param.variant === 'textarea') {
    Component = Textarea;
  }
  return (
    <div className="space-y-1 p-1 w-full">
        <Label htmlFor={id} className='text-xs flex'>
            {param.name}
            {param.required && <span className='text-red-400 px-2'>*</span>}
        </Label>
        <Component 
            id={id} 
            value={internalValue} 
            disabled={disabled}
            placeholder='Enter value here' 
            onChange={(e: any) => setInternalValue(e.target.value)}
            onBlur={(e: any) => updateNodeParamValue(e.target.value)}
            className='text-xs'
        />
        {param.helperText && (
            <p className='text-xs text-muted-foreground px-2'>{param.helperText}</p>
        )}
    </div>

  )
}

export default StringParam