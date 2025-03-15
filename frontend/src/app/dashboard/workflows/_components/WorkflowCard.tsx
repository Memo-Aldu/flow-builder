'use client';

import { DeleteWorkflowDialog } from '@/app/dashboard/workflows/_components/DeleteWorkflowDialog';
import { TooltipWrapper } from '@/components/TooltipWrapper';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Workflow, WorkflowStatus } from '@/types/workflows';
import { ChevronRightIcon, ClockIcon, CoinsIcon, CornerDownRightIcon, FileTextIcon, MoreVerticalIcon, MoveRightIcon, PlayIcon, PowerOffIcon, ShuffleIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import RunBtn from '@/app/dashboard/workflows/_components/RunBtn';
import ScheduleDialog from './ScheduleDialog';
import { Badge } from '@/components/ui/badge';
import ExecutionStatusIndicator, { ExecutionStatusLabel } from '@/app/workflow/runs/[workflowId]/_components/ExecutionStatusIndicator';
import { ExecutionStatus } from '@/types/executions';
import { format, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { DisableWorkflowDialog } from '@/app/dashboard/workflows/_components/DisableWorkflowDialog';

export const WorkflowCard = ({ workflow }: { workflow: Workflow}) => {
  const statusColors = {
    'draft': 'bg-yellow-400 text-yellow-600',
    'published': 'bg-emerald-400',
    'disabled': 'bg-red-400 text-red-600',
  }

  const statusIcons = {
    'draft': <FileTextIcon className='h-5 w-5' />,
    'published': <PlayIcon className='h-5 w-5 text-white'/>,
    'disabled': <PowerOffIcon className='h-5 w-5'/>,
  }

  const isDraft = workflow.status === 'draft'
  return (
    <Card className='border border-separate shadow-sm rounded-lg
    overflow-hidden hover:shadow-md dark:shadow-primary/30'>
        <CardContent className='p-4 flex items-center justify-between h-[100px]'>
            <div className='flex items-center justify-end space-x-3'>
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", 
                    statusColors[workflow.status])}>
                    {statusIcons[workflow.status]}
                </div>
                <div className="">
                    <h3 className="text-base font-bold text-muted-foreground flex items-center" >
                        <TooltipWrapper content={workflow.description}>
                            <Link href={`/workflow/editor/${workflow.id}`} 
                            className='flex items-center hover:underline'>
                                {workflow.name}
                            </Link>
                        </TooltipWrapper>

                        {isDraft && (
                            <span className='ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100
                             text-yellow-800 rounded-full'>
                                Draft
                            </span>

                        )}
                    </h3>
                    <ScheduleSection 
                        isDraft={isDraft} 
                        creditsCost={workflow.credits_cost!} 
                        workflowId={workflow.id} 
                        cron={workflow.cron ? workflow.cron : ''}
                    />
                </div>
            </div>
            <div className="flex items-center space-x-2">
                {!isDraft && <RunBtn workflowId={workflow.id} />}
                <Link href={`/workflow/editor/${workflow.id}`} 
                      className={cn(
                        buttonVariants({
                            variant: 'outline',
                            size: 'sm'
                        }), 
                        'flex items-center gap-2')}>
                        <ShuffleIcon size={16} />
                        { isDraft ? 'Edit' : 'View' }
                </Link>
                <WorkflowActions 
                 workflowName={workflow.name}
                 workflowStatus={workflow.status}
                 workflowId={workflow.id}/>
            </div>
        </CardContent>
        <LastRunDetails workflow={workflow} />
    </Card>
  )
}

export const WorkflowActions = ({ workflowName, workflowStatus, workflowId }: {workflowName: string, workflowStatus: WorkflowStatus, workflowId: string}) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showDisableDialog, setShowDisableDialog] = React.useState(false);
  return (
    <>
        <DeleteWorkflowDialog 
            open={showDeleteDialog} 
            setOpen={setShowDeleteDialog}
            workflowName={workflowName} 
            workflowId={workflowId}
        />
        <DisableWorkflowDialog
            open={showDisableDialog}
            setOpen={setShowDisableDialog}
            disableWorkflow={workflowStatus === 'disabled'}
            workflowId={workflowId}
        />
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='outline' size={"sm"}>
                    <TooltipWrapper content={'More actions'}>
                        <div className="flex items-center justify-center w-full h-full">
                            <MoreVerticalIcon size={18}/>
                        </div>
                    </TooltipWrapper>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                {workflowStatus !== 'draft' && (
                    <>
                        <DropdownMenuItem className='flex items-center gap-2'
                        onSelect={() => setShowDisableDialog((prev) => !prev)}>
                            <TrashIcon size={16} />
                            {workflowStatus === 'disabled' ? 'Enable' : 'Disable'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                    </>

                )}
                <DropdownMenuItem className='text-destructive flex items-center gap-2'
                onSelect={() => setShowDeleteDialog((prev) => !prev)}>
                    <TrashIcon size={16} />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </>
  )
}


const ScheduleSection = ({ isDraft, creditsCost, workflowId, cron }: 
    { isDraft: boolean, creditsCost: number, workflowId: string, cron: string }) => {
    if (isDraft) return null;
    return <div className="flex items-center gap-2">
        <CornerDownRightIcon className='text-muted-foreground h-4 w-4'/>
        <ScheduleDialog workflowId={workflowId} cron={cron} key={`${cron}-${workflowId}`} />
        <MoveRightIcon className='text-muted-foreground h-4 w-4 mt-1'/>
        <TooltipWrapper content="Credits consumption for running this workflow">
            <div className="flex items-center gap-3 mt-1">
                <Badge variant={"outline"} className='space-x-2 text-muted-foreground rounded-sm'>
                    <CoinsIcon className='h-4 w-4 text-primary '/>
                    <span className='text-sm'>{creditsCost}</span>
                </Badge>
            </div>
        </TooltipWrapper>
    </div>
}


const LastRunDetails = ({ workflow }: { workflow: Workflow }) => {
    if (workflow.status === 'draft') return null;
    const formattedStartedAt = workflow.last_run_at ? formatDistanceToNow(new Date(workflow.last_run_at), { addSuffix: true }) : '';
    const nextSchedule = workflow.next_run_at && format(new Date(workflow.next_run_at), 'yyyy-MM-dd HH:mm')
    const nextScheduleUTC = workflow.next_run_at && formatInTimeZone(new Date(workflow.next_run_at), 'UTC', 'HH:mm')

    console.log("next run at", workflow.next_run_at, nextScheduleUTC)
    return (
        <div className="bg-primary/5 px-4 py-1 flex justify-between items-center text-muted-foreground">
            <div className="flex items-center text-sm gap-2">
                { workflow.last_run_at && (<Link href={`/workflow/runs/${workflow.id}/${workflow.last_run_id}`} className='flex items-center text-sm gap-2 group'>
                    <span>Last run:</span>
                    <ExecutionStatusIndicator status={workflow.last_run_status as ExecutionStatus} />
                    <ExecutionStatusLabel status={workflow.last_run_status as ExecutionStatus} />
                    <span>{formattedStartedAt}</span>
                    <ChevronRightIcon className='-translate-x-[2px] group-hover:translate-x-0 transition' size={14}/>
                </Link>
                )}
                {!workflow.last_run_at && <p>No runs yet</p>}
            </div>
            {workflow.next_run_at && (
                <div className="flex items-center text-sm gap-2">
                    <ClockIcon className='' size={14}/>
                    <span>Next run at:</span>
                    <span>{nextSchedule}</span>
                    <span className='text-xs'>({nextScheduleUTC} UTC)</span>
                </div>
            )}
        </div>
    )
}


