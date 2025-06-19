"use client"

import { useUnifiedAuth } from '@/contexts/AuthContext'
import { UnifiedExecutionsAPI, UnifiedPhasesAPI } from '@/lib/api/unified-functions-client'
import { ExecutionStatus, WorkflowExecution } from '@/types/executions'
import { ExecutionPhase, ExecutionPhaseStatus } from '@/types/phases'
import { useQuery } from '@tanstack/react-query'

import { PhaseLogs } from '@/app/workflow/runs/[workflowId]/[executionId]/_components/PhaseLogs'
import PhaseStatus from '@/app/workflow/runs/[workflowId]/[executionId]/_components/PhaseStatus'
import CountUpWrapper from '@/components/CountUpWrapper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

import { DatesToDurationString } from '@/lib/helper/dates'
import { GetWorkflowCost } from '@/lib/helper/phases'
import { TaskRegistry } from '@/lib/workflow/task/registry'
import { formatDistanceToNow } from 'date-fns'
import { CalendarIcon, CircleDashedIcon, ClockIcon, CoinsIcon, Loader2Icon, LucideIcon, WorkflowIcon } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

const getSetupStageMessage = (progress: number): string => {
    if (progress < 25) {
        return 'Initializing environment...';
    } else if (progress < 70) {
        return 'Starting execution container...';
    } else {
        return 'Finalizing setup...';
    }
};

const ExecutionView = ({ initialExecution, initialPhases }: { initialExecution: WorkflowExecution, initialPhases: ExecutionPhase[] }) => {
    const { getToken, isAuthenticated } = useUnifiedAuth();
    const [selectedPhase, setSelectedPhase] = useState<ExecutionPhase | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const progressStartTimeRef = useRef<number | null>(null);

    const TOTAL_DURATION = 90000;

    const executionQuery = useQuery({
        queryKey: ['execution', initialExecution.id, isAuthenticated ? 'auth' : 'guest'],
        queryFn: async () => {
            const token = await getToken();
            return UnifiedExecutionsAPI.client.get(initialExecution.id, token);
        },
        refetchInterval: (q) => q.state.data?.status === ExecutionStatus.RUNNING
        || q.state.data?.status === ExecutionStatus.PENDING ? 1000 : false,
        enabled: isAuthenticated,
        initialData: initialExecution,
        refetchIntervalInBackground: true,
    });
    const phasesQuery = useQuery({
        queryKey: ['phases', initialExecution.id, isAuthenticated ? 'auth' : 'guest'],
        queryFn: async () => {
            const token = await getToken();
            return UnifiedPhasesAPI.client.list(initialExecution.id, 1, 25, undefined, undefined, token);
        },
        refetchInterval: () => executionQuery.data?.status === ExecutionStatus.RUNNING ? 1000 : false,
        enabled: isAuthenticated,
        initialData: initialPhases,
        refetchIntervalInBackground: true,
    });

    const isRunning = executionQuery.data?.status === ExecutionStatus.RUNNING;

    useEffect(() => {
        setSelectedPhase(phasesQuery.data[phasesQuery.data.length - 1]);
    }, [phasesQuery.data, isRunning, setSelectedPhase]);

    useEffect(() => {
        // Clear any existing interval first
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }

        if (executionQuery.data?.status === ExecutionStatus.RUNNING) {
            setProgress(100);
            return;
        } else if (executionQuery.data?.status !== ExecutionStatus.PENDING &&
                  executionQuery.data?.status !== undefined) {
            return;
        }

        // Start animation for PENDING status
        if (executionQuery.data?.status === ExecutionStatus.PENDING) {
            setProgress(0);

            progressStartTimeRef.current = Date.now();

            progressIntervalRef.current = setInterval(() => {
                const elapsedTime = Date.now() - (progressStartTimeRef.current || Date.now());

                if (elapsedTime >= TOTAL_DURATION) {
                    setProgress(95);
                    return;
                }

                // Calculate progress with a custom easing function
                const normalizedTime = elapsedTime / TOTAL_DURATION;

                if (normalizedTime < 0.3) {
                    const factor = normalizedTime / 0.3;
                    const easedProgress = Math.pow(factor, 2) * 25;
                    setProgress(easedProgress);
                }
                else if (normalizedTime < 0.7) {
                    const factor = (normalizedTime - 0.3) / 0.4;
                    const easedProgress = 25 + (factor * 45);
                    setProgress(easedProgress);
                }
                else {
                    const factor = (normalizedTime - 0.7) / 0.3;
                    const easedProgress = 70 + (Math.pow(factor, 0.7) * 25);
                    setProgress(Math.min(easedProgress, 95));
                }
            }, 50);
        }

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        };
    }, [executionQuery.data?.status]);

    const duration = DatesToDurationString(
        executionQuery.data?.started_at ? new Date(executionQuery.data.started_at) : undefined,
        executionQuery.data?.completed_at ? new Date(executionQuery.data.completed_at) : undefined
    );

    const creditsConsumed = GetWorkflowCost(phasesQuery.data);
    return (
        <div className='flex w-full h-full'>
            <aside className='w-[440px] min-w-[440px] max-w-[440px] border-r-2 border-separate
            flex flex-grow flex-col overflow-hidden'>
                <div className="py-4 px-2">
                    <ExecutionLabel icon={CircleDashedIcon} label='Status'
                        value={
                            <div className="flex items-center gap-2">
                                <PhaseStatus status={executionQuery.data?.status ? executionQuery.data?.status as unknown as ExecutionPhaseStatus : ExecutionPhaseStatus.PENDING} />
                                <span className="font-semibold uppercase">{executionQuery.data?.status}</span>
                            </div>
                        }/>
                    <ExecutionLabel icon={CalendarIcon} label='Started At' value={
                        <span className='lowercase'>
                            {executionQuery.data?.started_at ? formatDistanceToNow(new Date(executionQuery.data?.started_at), { addSuffix: true }) : 'N/A'}
                        </span>}/>
                    <ExecutionLabel icon={ClockIcon} label='Duration' value={duration ?? <Loader2Icon className='animate-spin' size={20}/>} />
                    <ExecutionLabel icon={CoinsIcon} label='Credits used' value={
                        <CountUpWrapper value={creditsConsumed} />
                    } />

                </div>
                <Separator />
                <div className="flex justify-center items-center py-2 px-4">
                    <div className="text-muted-foreground flex items-center gap-2" >
                        <WorkflowIcon size={20} className='stroke-muted-foreground/80'/>
                        <span className="font-semibold">Phases</span>
                    </div>
                </div>
                <Separator />
                <div className="overflow-auto h-full px-2 py-4">
                    {phasesQuery.data?.map((phase, index) => (
                        <Button key={phase.id} variant={selectedPhase === phase ? 'secondary' : 'ghost'} className='w-full justify-between'
                                onClick={() =>  {
                                    if(isRunning) return
                                    setSelectedPhase(phase)
                                }}>
                            <div className="flex items-center gap-2">
                                <Badge variant={"outline"} className=''>{index + 1}</Badge>
                                <p className="font-semibold">
                                    {TaskRegistry[phase.name].label ? TaskRegistry[phase.name].label : phase.name}
                                </p>
                            </div>
                            <PhaseStatus status={phase.status} />
                        </Button>
                    ))}
                </div>
            </aside>
            <div className="flex w-full h-full">
                    {executionQuery.data?.status === ExecutionStatus.PENDING && (
                        <div className="flex items-center flex-col gap-4 justify-center h-full w-full px-8 max-w-xl mx-auto">
                            <Loader2Icon size={40} className="animate-spin stroke-primary" />
                            <div className="flex flex-col gap-1 text-center">
                                <p className="font-bold">
                                    Setting up environment for execution
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Please wait while we prepare everything...
                                </p>
                            </div>
                            <div className="w-full mt-6 space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-muted-foreground">
                                        {getSetupStageMessage(progress)}
                                    </p>
                                    <p className="text-xs font-medium">
                                        {progress.toFixed(0)}%
                                    </p>
                                </div>
                                <Progress
                                    value={progress}
                                    className="h-3 w-full transition-all duration-300 ease-in-out relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-primary/20 animate-pulse" />
                                </Progress>
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>0s</span>
                                    <span>45s</span>
                                    <span>90s</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {isRunning && (
                        <div className="flex items-center flex-col gap-4 justify-center h-full w-full px-8 max-w-xl mx-auto">
                            <Loader2Icon size={40} className="animate-spin stroke-yellow-500" />
                            <div className="flex flex-col gap-1 text-center">
                                <p className="font-bold">
                                    Workflow execution in progress
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Processing your workflow tasks...
                                </p>
                            </div>
                            <div className="w-full mt-6 space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-muted-foreground">
                                        Environment ready, execution in progress
                                    </p>
                                    <p className="text-xs font-medium">
                                        100%
                                    </p>
                                </div>
                                <Progress
                                    value={100}
                                    className="h-3 w-full bg-secondary/50 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-yellow-300/20 animate-pulse" />
                                </Progress>
                                <div className="flex justify-end text-[10px] text-muted-foreground">
                                    <span>Environment setup complete</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {!isRunning && !selectedPhase && executionQuery.data?.status !== ExecutionStatus.PENDING && (
                        <div className="flex items-center flex-col gap-2 justify-center h-full w-full">
                            <div className="flex flex-col gap-1 text-center">
                                <p className="font-bold">
                                    No phase selected
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Select a phase to view details
                                </p>
                            </div>
                        </div>
                    )}
                    {!isRunning && selectedPhase && phasesQuery.data && (
                        <div className="flex flex-col py-4 container gap-4 overflow-auto">
                            <div className="flex gap-2 items-center">
                                <Badge variant={"outline"} className='space-x-4'>
                                    <div className="flex gap-1 items-center">
                                        <CoinsIcon size={18} className='stroke-muted-foreground'/>
                                        <span>Credits</span>
                                    </div>
                                    <span>{selectedPhase.credits_consumed}</span>
                                </Badge>
                                <Badge variant={"outline"} className='space-x-4'>
                                    <div className="flex gap-1 items-center">
                                        <ClockIcon size={18} className='stroke-muted-foreground'/>
                                        <span>Duration</span>
                                    </div>
                                    <span>{DatesToDurationString(
                                        new Date(selectedPhase.started_at),
                                        new Date(selectedPhase.completed_at!)
                                    ) ?? "N/A"}</span>
                                </Badge>
                            </div>
                            <ParameterSection
                                title="Input"
                                subtitle="Inputs used for this phase"
                                params={selectedPhase.inputs}
                            />
                            <ParameterSection
                                title="Output"
                                subtitle="Outputs generated by this phase"
                                params={selectedPhase.outputs}
                            />
                            <PhaseLogs
                                    phase={selectedPhase}
                                    isRunning={isRunning}
                            />
                        </div>
                    )}
            </div>
        </div>
    );
}

export default ExecutionView


const ExecutionLabel = ({icon, label, value }: {icon: LucideIcon, label: React.ReactNode, value: React.ReactNode }) => {
    const Icon = icon;
    return (
        <div className="flex justify-between items-center py-2 px-4">
            <div className="text-muted-foreground flex items-center gap-2">
                <Icon size={20} className='stroke-muted-foreground/80'/>
                <span>{label}</span>
            </div>
            <div className="font-semibold capitalize flex gap-2 items-center">
                {value}
            </div>
        </div>
    )
}


const ParameterSection = ({title, subtitle, params}: {title: string, subtitle: string, params: Record<string, any> | undefined}) => {

    return (
        <Card >
            <CardHeader className='rounded-lg rounded-b-none border-b py-4 bg-gray-50 dark:bg-background'>
                <CardTitle className='text-base'>{title}</CardTitle>
                <CardDescription className='text-muted-foreground text-sm'>{subtitle}</CardDescription>
            </CardHeader>
            <CardContent className='py-4'>
                <div className="flex flex-col gap-2">
                    {(!params || Object.keys(params).filter(
                        (key) => params[key] !== null && params[key] !== undefined && params[key] !== ""
                    ).length === 0) && (
                        <p className="text-muted-foreground text-sm">
                            No parameters provided
                        </p>
                    )}
                    {params && Object.entries(params).filter(
                        ([key, value]) => value !== null && value !== undefined && value !== ""
                    ).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center space-y-1">
                            <p className="text-sm text-muted-foreground flex-1 basis-1/3">
                                {key}
                            </p>
                            <Input readOnly value={value} className="flex-1 basis-2/3"/>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
