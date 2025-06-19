"use client";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { UnifiedCredentialsAPI } from '@/lib/api/unified-functions-client';
import { ParamProps } from '@/types/nodes';
import { useQuery } from '@tanstack/react-query';
import React, { useId } from 'react';

const CredentialParam = ({ param, value, updateNodeParamValue }: ParamProps) => {
  const id = useId();
  const { getToken, isAuthenticated } = useUnifiedAuth();
  const query = useQuery({
    queryKey: ['credentials-for-input', isAuthenticated ? 'auth' : 'guest'],
    queryFn: async () => {
      const token = await getToken();
      return UnifiedCredentialsAPI.client.list(1, 50, undefined, undefined, token);
    },
    refetchInterval: isAuthenticated ? 10000 : false, // Only refetch if authenticated
    enabled: isAuthenticated,
  })
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
              <SelectLabel>Credentials</SelectLabel>
              {query.data?.map((credential) => (
                <SelectItem key={credential.id} value={credential.id}>
                  {credential.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
      </Select>
      {param.helperText && (
            <p className='text-xs text-muted-foreground px-2'>{param.helperText}</p>
        )}
    </div>

  )
}

export default CredentialParam