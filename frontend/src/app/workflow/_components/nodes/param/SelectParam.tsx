"use client";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ParamProps } from '@/types/nodes';
import React, { useId } from 'react'

const SelectParam = ({ param, value, updateNodeParamValue }: ParamProps) => {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 w-full">
      <Label htmlFor={id} className='text-xs flex'>
        {param.name}
        {param.required && <span className='text-red-400 px-2'>*</span>}
      </Label>
      <Select
        onValueChange={(value) => updateNodeParamValue(value)}
        defaultValue={value}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder="Select an option"/>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Options</SelectLabel>
              {param.options.map((option: {value: string, label: string}) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
      </Select>
    </div>

  )
}

export default SelectParam