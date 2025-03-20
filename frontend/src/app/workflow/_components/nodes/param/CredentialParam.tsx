"use client";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCredentials } from '@/lib/api/credential';
import { ParamProps } from '@/types/nodes';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import React, { useId } from 'react'

const CredentialParam = ({ param, value, updateNodeParamValue }: ParamProps) => {
  const id = useId();
  const { getToken } = useAuth();
  const query = useQuery({
    queryKey: ['credentials-for-input'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        return;
      }
      return getCredentials(token)
    },
    refetchInterval: 10000,
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
    </div>

  )
}

export default CredentialParam