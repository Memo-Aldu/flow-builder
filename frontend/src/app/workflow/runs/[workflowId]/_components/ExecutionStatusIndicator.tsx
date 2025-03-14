import { cn } from '@/lib/utils'
import { ExecutionStatus } from '@/types/executions'
import { Loader2Icon } from 'lucide-react'
import React from 'react'

const statusMap: Record<string, string> = {
    'pending': 'bg-stale-400',
    'running': 'bg-yellow-400',
    'failed': 'bg-red-400',
    'completed': 'bg-green-400',
}

const ExecutionStatusIndicator = ({ status }: {status: ExecutionStatus}) => {
  if (status === "RUNNING") {
    return <Loader2Icon className='w-2 h-2 animate-spin text-yellow-400'/>
  } 
  return (
    <div className={cn('w-2 h-2 rounded-full', statusMap[status])}/>
  )
}

const labelMap: Record<string, string> = {
  'PENDING': 'text-stale-400',
  'FAILED': 'text-red-400',
  'COMPLETE': 'text-green-400',
}

export const ExecutionStatusLabel = ({ status }: {status: ExecutionStatus}) => {
  return (
    <span className={cn('lowercase text-xs', labelMap[status])}>{status}</span>
  )
}

export default ExecutionStatusIndicator
