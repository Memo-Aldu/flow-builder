"use client";

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getExecutions } from '@/lib/api/executions'
import { DatesToDurationString } from '@/lib/helper/dates';
import { WorkflowExecution } from '@/types/executions'
import { useAuth } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import ExecutionStatusIndicator from '@/app/workflow/runs/[workflowId]/_components/ExecutionStatusIndicator';
import { CoinsIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

const ExecutionTable = ({ workflowId, initialData }: { workflowId: string, initialData: WorkflowExecution[]}) => {
    const { getToken } = useAuth();
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
          (async () => {
              const retrievedToken = await getToken();
              setToken(retrievedToken);
          })();
      }, [getToken]);
    const query = useQuery({
    queryKey: ['executions', workflowId],
    queryFn: async () => {
        if (!token) {
          return []
        }
        return await getExecutions(token, workflowId)
    },
    initialData,
    refetchInterval: 5000,
    enabled: !!token
  })

  return (
    <div className="border rounded-lg shadow-md overflow-auto">
        <Table className='h-full'>
            <TableHeader className='bg-muted'>
                <TableHead>Id</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead className='text-right text-xs text-muted-foreground'>Started at (desc)</TableHead>
            </TableHeader>
            <TableBody className='gap-2 h-full overflow-auto'>
                {query.data?.map((execution) => {
                    const duration = DatesToDurationString(new Date(execution.started_at!), new Date(execution.completed_at!))
                    const formattedStartedAt = execution.started_at ? formatDistanceToNow(new Date(execution.started_at), { addSuffix: true }) : ''
                    return (
                        <TableRow key={execution.id} className='hover:bg-accent cursor-pointer'
                            onClick={() => {
                                router.push(`/workflow/runs/${workflowId}/${execution.id}`)
                            }}
                        >
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-semibold">
                                        {execution.id}
                                    </span>
                                    <div className="text-muted-foreground text-xs">
                                        <span className="">Triggered by</span>
                                        <Badge variant={"outline"} className='uppercase'>{execution.trigger}</Badge>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <div className="flex gap-2 items-center uppercase">
                                        <ExecutionStatusIndicator status={execution.status} />
                                        <span className="font-semibold">{execution.status}</span>
                                    </div>
                                    <div className="text-muted-foreground text-xs mx-5">{duration}</div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <div className="flex gap-2 items-center uppercase">
                                        <CoinsIcon size={16} className='text-primary'/>
                                        <span className="font-semibold">{execution.credits_consumed}</span>
                                    </div>
                                    <div className="text-muted-foreground text-xs mx-5">Credits</div>
                                </div>
                            </TableCell>
                            <TableCell className='text-right text-muted-foreground'>
                                {formattedStartedAt}
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    </div>
  )
}

export default ExecutionTable