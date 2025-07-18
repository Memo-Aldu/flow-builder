"use client";

import ExecutionStatusIndicator from '@/app/workflow/runs/[workflowId]/_components/ExecutionStatusIndicator';
import { PaginationControls } from '@/components/PaginationControls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { usePagination } from '@/hooks/use-pagination';
import { UnifiedExecutionsAPI } from '@/lib/api/unified-functions-client';
import { DatesToDurationString } from '@/lib/helper/dates';
import { SortDir } from '@/types/base';
import { WorkflowExecution, WorkflowExecutionSortField, WorkflowExecutionSortFieldLabels } from '@/types/executions';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { CoinsIcon, SortAscIcon, SortDescIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const ExecutionTable = ({ workflowId, initialData }: { workflowId: string, initialData: WorkflowExecution[]}) => {
    const { getToken, isAuthenticated } = useUnifiedAuth();
    const router = useRouter();

    const {
        page,
        limit,
        canGoNext,
        onNext,
        onPrev,
        onChangeLimit,
        updateCanGoNext,
      } = usePagination({
        initialPage: 1,
        initialLimit: 5,
        limits: [5, 10, 20, 50],
    });
    const [sortField, setSortField] = useState<WorkflowExecutionSortField>(WorkflowExecutionSortField.STARTED_AT);
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const query = useQuery({
        queryKey: ["executions", workflowId, page, limit, sortField, sortDir, isAuthenticated ? 'auth' : 'guest'],
        queryFn: async () => {
          const token = await getToken();
          const executions = await UnifiedExecutionsAPI.client.list(workflowId, page, limit, sortField, sortDir, token);
          updateCanGoNext(executions.length >= limit)
          return executions;
        },
        initialData,
        refetchInterval: isAuthenticated ? 5000 : false, // Only refetch if authenticated
        enabled: isAuthenticated,
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {/* 1) Sorting controls */}
        <div className="flex items-center gap-2">
            <Select
            value={sortField}
            onValueChange={(val) => setSortField(val as WorkflowExecutionSortField)}
            >
            <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Sort by field" />
            </SelectTrigger>
            <SelectContent>
                {Object.values(WorkflowExecutionSortField).map((fieldVal) => (
                <SelectItem key={fieldVal} value={fieldVal}>
                    {WorkflowExecutionSortFieldLabels[fieldVal]}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>

            <Button
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => {
                setSortDir(sortDir === "asc" ? "desc" : "asc");
            }}
            >
            {sortDir === "asc" ? <SortAscIcon size={16} /> : <SortDescIcon size={16} />}
            <span>Sort {sortDir === "asc" ? "asc" : "desc"}</span>
            </Button>
        </div>

        {/* 2) PaginationControls usage */}
        <div className="flex items-center justify-between">
            <PaginationControls
            page={page}
            limit={limit}
            canGoNext={canGoNext}
            onNext={onNext}
            onPrev={onPrev}
            onChangeLimit={onChangeLimit}
            />
        </div>
      </div>

      <div className="border rounded-lg shadow-md overflow-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead className='cursor-pointer'
              onClick={() => {
                setSortField(WorkflowExecutionSortField.STATUS);
                setSortDir(sortDir === "asc" ? "desc" : "asc");
              }}
              >
                Status
              </TableHead>
              <TableHead className="cursor-pointer"
                onClick={() => {
                  setSortField(WorkflowExecutionSortField.CREDITS_CONSUMED);
                  setSortDir(sortDir === "asc" ? "desc" : "asc");
                }}
              >
                Credits
              </TableHead>
              <TableHead className="cursor-pointer text-right text-muted-foreground w-48"
                onClick={() => {
                    setSortField(WorkflowExecutionSortField.STARTED_AT);
                    setSortDir(sortDir === "asc" ? "desc" : "asc");
                }}>
                Started at
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="gap-2 h-full overflow-auto">
            {query.data?.map((execution) => {
              const duration = DatesToDurationString(
                new Date(execution.started_at!),
                execution.completed_at ? new Date(execution.completed_at) : undefined
              );
              const formattedStartedAt = execution.started_at
                ? formatDistanceToNow(new Date(execution.started_at), { addSuffix: true })
                : "";

              return (
                <TableRow
                  key={execution.id}
                  className="hover:bg-accent cursor-pointer"
                  onClick={() => {
                    router.push(`/workflow/runs/${workflowId}/${execution.id}`);
                  }}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{execution.id}</span>
                      <div className="text-muted-foreground text-xs">
                        <span>Triggered by </span>
                        <Badge variant="outline" className="uppercase">
                          {execution.trigger}
                        </Badge>
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
                        <CoinsIcon size={16} className="text-primary" />
                        <span className="font-semibold">{execution.credits_consumed}</span>
                      </div>
                      <div className="text-muted-foreground text-xs mx-5">Credits</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground w-48">
                    {formattedStartedAt}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ExecutionTable