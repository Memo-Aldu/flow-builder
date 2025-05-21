"use client";

import { CustomDialogHeader } from '@/components/CustomDialogHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { unscheduleWorkflow, updateWorkflow } from '@/lib/api/workflows';
import { cn } from '@/lib/utils';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import parser from 'cron-parser';
import cronstrue from 'cronstrue';
import { Calendar1Icon, ClockIcon, TriangleAlertIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { toast } from 'sonner';

const ScheduleDialog = (props : { workflowId : string, cron : string }) => {
  const [cron, setCron] = React.useState<string>(props.cron);
  const [validCron, setValidCron] = React.useState<boolean>(true);
  const [validInterval, setValidInterval] = React.useState<boolean>(true);
  const [readableCron, setReadableCron] = React.useState<string>('');
  const [intervalError, setIntervalError] = React.useState<string>('');
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const interval = parser.parse(cron);
      const humanReadable = cronstrue.toString(cron);
      setValidCron(true);
      setReadableCron(humanReadable);

      // Check if the interval is at least 5 minutes
      const next = interval.next();
      const nextNext = interval.next();
      const diffMs = nextNext.getTime() - next.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      if (diffMinutes < 5) {
        setValidInterval(false);
        setIntervalError(`Interval is ${diffMinutes} minute(s). Minimum allowed is 5 minutes.`);
      } else {
        setValidInterval(true);
        setIntervalError('');
      }
    } catch (error) {
      setValidCron(false);
      setValidInterval(true);
      setIntervalError('');
    }
  }, [cron]);

  const mutation = useMutation({
    mutationFn: async (cron : string) => {
      const token  = await getToken();
      if (!token) {
        throw new Error("User not authenticated");
      }
      try {
        const interval = parser.parse(cron);

        // Validate minimum 5-minute interval
        const next = interval.next();
        const nextNext = interval.next();
        const diffMs = nextNext.getTime() - next.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        if (diffMinutes < 5) {
          throw new Error(`Schedule interval must be at least 5 minutes. Current interval: ${diffMinutes} minute(s).`);
        }

        // Reset the iterator to get the first occurrence
        const resetInterval = parser.parse(cron);
        const nextRun = resetInterval.next().toISOString();

        return await updateWorkflow(props.workflowId, {
          cron: cron,
          next_run_at: nextRun
        }, token);
      } catch (err) {
        console.error(err);
        throw new Error(err instanceof Error ? err.message : "Invalid cron expression");
      }
    },
    onSuccess: () => {
      toast.success("Workflow scheduled successfully", { id: "schedule-workflow" });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
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
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
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
          <p className='text-muted-foreground text-sm'>
            Specify a cron expression to schedule workflow execution.
            All times are in UTC. <span className="font-medium text-primary">Minimum interval: 5 minutes.</span>
          </p>
          <Input placeholder='E.g */5 * * * *' value={cron}
          onChange={(e) => setCron(e.target.value)}/>
          <div className={cn('bg-accent rounded-md p-4 border',
            !validCron && 'text-destructive border-destructive',
            validCron && !validInterval && 'text-amber-500 border-amber-500',
            validCron && validInterval && 'text-sm text-primary border-primary'
          )}>
            {!validCron && 'Invalid cron expression'}
            {validCron && !validInterval && intervalError}
            {validCron && validInterval && readableCron}
          </div>
          {validCron && !validInterval && (
            <div className="text-sm text-amber-500 flex items-start gap-2">
              <div className="shrink-0 mt-0.5">
                <TriangleAlertIcon size={16} />
              </div>
              <div>
                For performance reasons, workflows can only be scheduled to run at intervals of 5 minutes or longer.
                Try using expressions like "*/5 * * * *" (every 5 minutes) or "0 */1 * * *" (hourly).
              </div>
            </div>
          )}
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
            disabled={mutation.isPending || !validCron || !validInterval}
            >Save</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ScheduleDialog