import { cn } from '@/lib/utils'
import { ExecutionStatus } from '@/types/executions'
import React from 'react'

const statusMap: Record<string, string> = {
    'pending': 'bg-stale-400',
    'running': 'bg-yellow-400',
    'failed': 'bg-red-400',
    'completed': 'bg-green-400',
}

const ExecutionStatusIndicator = ({ status }: {status: ExecutionStatus}) => {
  return (
    <div className={cn('w-2 h-2 rounded-full', statusMap[status])}/>
  )
}

const labelMap: Record<string, string> = {
  'pending': 'text-stale-400',
  'running': 'text-yellow-400',
  'failed': 'text-red-400',
  'completed': 'text-green-400',
}

export const ExecutionStatusLabel = ({ status }: {status: ExecutionStatus}) => {
  return (
    <span className={cn('lowercase text-xs', labelMap[status])}>{status}</span>
  )
}

export default ExecutionStatusIndicator
