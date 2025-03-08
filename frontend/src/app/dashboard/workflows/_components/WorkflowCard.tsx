'use client';

import { DeleteWorkflowDialog } from '@/app/dashboard/workflows/_components/DeleteWorkflowDialog';
import { TooltipWrapper } from '@/components/TooltipWrapper';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Workflow } from '@/types/workflows';
import { FileTextIcon, MoreVerticalIcon, PlayIcon, ShieldOffIcon, ShuffleIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import RunBtn from '@/app/dashboard/workflows/_components/RunBtn';

export const WorkflowCard = ({ workflow }: { workflow: Workflow}) => {
  const statusColors = {
    'draft': 'bg-yellow-400 text-yellow-600',
    'published': 'bg-emerald-400',
    'disabled': 'bg--red-400 text-red-600',
  }

  const statusIcons = {
    'draft': <FileTextIcon className='h-5 w-5'/>,
    'published': <PlayIcon className='h-5 w-5 text-white'/>,
    'disabled': <ShieldOffIcon className='h-5 w-5 text-red-600'/>,
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
                        <Link href={`/workflow/editor/${workflow.id}`} 
                        className='flex items-center hover:underline'>
                            {workflow.name}
                        </Link>
                        {isDraft && (
                            <span className='ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100
                            text-yellow-800 rounded-full'>
                                Draft
                            </span>

                        )}
                    </h3>
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
                        Edit
                </Link>
                <WorkflowActions workflowName={workflow.name} workflowId={workflow.id}/>
            </div>
        </CardContent>
    </Card>
  )
}

export const WorkflowActions = ({ workflowName, workflowId }: {workflowName: string, workflowId: string}) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  return (
    <>
        <DeleteWorkflowDialog 
            open={showDeleteDialog} 
            setOpen={setShowDeleteDialog}
            workflowName={workflowName} 
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


