"use client";

import { unscheduleWorkflow, updateWorkflow } from '@/lib/api/workflows';
import { useAuth } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'
import { toast } from 'sonner';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Calendar1Icon, ClockIcon, TriangleAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CustomDialogHeader } from '@/components/CustomDialogHeader';
import { Input } from '@/components/ui/input';
import cronstrue from 'cronstrue';
import parser from 'cron-parser';
import { Separator } from '@/components/ui/separator';

const ScheduleDialog = (props : { workflowId : string, cron : string }) => {
  const [cron, setCron] = React.useState<string>(props.cron);
  const [validCron, setValidCron] = React.useState<boolean>(true);
  const [readableCron, setReadableCron] = React.useState<string>('');
  const { getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    try {
      parser.parse(cron);
      const humanReadable = cronstrue.toString(cron);
      setValidCron(true);
      setReadableCron(humanReadable);
    } catch (error) {
      setValidCron(false);
    }
  }, [cron]);

  const mutation = useMutation({
    mutationFn: async (cron : string) => {
      const token  = await getToken();
      if (!token) {
        throw new Error("User not authenticated");
      }
      try {
        // TODO: ADD TIMEZONE { tz: 'UTC' }
        // for now no timezone is added
        const interval = parser.parse(cron);
        const next = interval.next().toISOString()?.replace('Z', '')
        return await updateWorkflow(props.workflowId, {
          cron: cron,
          next_run_at: next
        }, token);
      } catch (err) {
        console.error(err);
        throw new Error("Invalid cron expression");
      }


    },
    onSuccess: () => {
      toast.success("Workflow scheduled successfully", { id: "schedule-workflow" });
      router.push(`/dashboard/workflows`);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to schedule workflow", { id: "schedule-workflow" });			
    }
  })

  const unscheduleMutation = useMutation({
    mutationFn: async () => {
      const token  = await getToken();
      if (!token) {
        throw new Error("User not authenticated");
      }
      try {
        return await unscheduleWorkflow(props.workflowId, token);
      } catch (err) {
        console.error(err);
        throw new Error("Failed to unschedule workflow");
      }
    },
    onSuccess: () => {
      toast.success("Workflow unscheduled successfully", { id: "unschedule-workflow" });
      router.push(`/dashboard/workflows`);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to unschedule workflow", { id: "unschedule-workflow" });			
    }
  })

  const workflowHasValidCron = props.cron && props.cron !== '';
  const readableSavedCron = workflowHasValidCron && cronstrue.toString(props.cron); 

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='link' size='sm' className=
        {cn("text-sm p-0 h-auto text-orange-500", workflowHasValidCron && 'text-primary')}
        >
          { workflowHasValidCron && (
            <div className="flex items-center gap-2">
              <ClockIcon className='' />
              {readableSavedCron}
            </div>
          )}
          {!workflowHasValidCron && (
            <div className="flex items-center gap-1">
              <TriangleAlertIcon className='h-3 w-3 mr-1' /> Set schedule
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className='px-0'>
        <CustomDialogHeader title='Schedule workflow execution' icon={Calendar1Icon} />
        <div className='p-6 space-y-4'>
          <p className='text-muted-foreground text-sm'>Specify a cron expression to schedule workflow execution.
            All times are in UTC.
          </p>
          <Input placeholder='E.g * * * * *' value={cron}
          onChange={(e) => setCron(e.target.value)}/>
          <div className={cn('bg-accent rounded-md p-4 border text-destructive border-destructive ',
          validCron && 'text-sm text-primary border-primary'
          )}>
            {validCron ? readableCron: 'Invalid cron expression'}
          </div>
          {workflowHasValidCron && (
            <DialogClose asChild>
              <div className="">
                <Button variant='outline' size='sm' 
                className='w-full text-destructive border-destructive hover:text-destructive' 
                onClick={() => {
                  toast.loading("Unscheduling workflow...", { id: "unschedule-workflow" });
                  unscheduleMutation.mutate()
                }}
                disabled={unscheduleMutation.isPending || mutation.isPending}
                >Unschedule workflow</Button>
                <Separator className='my-4' />
              </div>

            </DialogClose>
          )}
        </div>
        <DialogFooter className='px-6 gap-2'>
          <DialogClose asChild>
            <Button variant='secondary' className='w-full'>Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button className='w-full' 
            onClick={() => {
              toast.loading("Scheduling workflow...", { id: "schedule-workflow" });
              mutation.mutate(cron)

            }}
            disabled={mutation.isPending || !validCron}
            >Save</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ScheduleDialog