"use client";
import React, { useEffect, useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParamProps } from '@/types/nodes';

const NumberParam = ({ param, value, updateNodeParamValue, disabled }: ParamProps) => {
  const initial = Number(value) || 0;
  const [internalValue, setInternalValue] = React.useState<number>(initial);
  const id = useId();

  useEffect(() => {
    setInternalValue(Number(value) || 0);
  }, [value]);

  return (
    <div className="space-y-1 p-1 w-full">
      <Label htmlFor={id} className="text-xs flex">
        {param.name}
        {param.required && <span className="text-red-400 px-2">*</span>}
      </Label>

      <Input
        id={id}
        type="number"
        min={param.min ?? 1}
        max={param.max ?? 100}
        step={1}
        value={internalValue}
        disabled={disabled}
        placeholder="Enter a number (1–10)"
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const parsed = Number(e.target.value);
          setInternalValue(parsed);
        }}
        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          updateNodeParamValue(e.target.value);
        }}
        className="text-xs"
      />

      {param.helperText && (
        <p className="text-xs text-muted-foreground px-2">
          {param.helperText}
        </p>
      )}
    </div>
  );
};

export default NumberParam;
