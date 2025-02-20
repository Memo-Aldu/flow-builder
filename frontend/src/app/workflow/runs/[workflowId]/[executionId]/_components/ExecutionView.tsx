"use client"

import { getExecution } from '@/lib/api/executions'
import { ExecutionStatus, WorkflowExecution } from '@/types/executions'
import { ExecutionPhase } from '@/types/phases'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/nextjs'

import React, { useEffect, useState } from 'react'
import { CalendarIcon, CircleDashedIcon, ClockIcon, CoinsIcon, Loader2Icon, LucideIcon, WorkflowIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Separator } from '@/components/ui/separator'
import { listPhases } from '@/lib/api/phases'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DatesToDurationString } from '@/lib/helper/dates'
import { GetWorkflowCost } from '@/lib/helper/phases'
import { TaskRegistry } from '@/lib/workflow/task/registry'
import { getLogs } from '@/lib/api/logs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ExecutionLog } from '@/types/logs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import PhaseStatus from './PhaseStatus'
import CountUpWrapper from '@/components/CountUpWrapper'

const ExecutionView = ({ initialExecution, initialPhases }: { initialExecution: WorkflowExecution, initialPhases: ExecutionPhase[] }) => {
    const { getToken } = useAuth();
    const [token, setToken] = useState<string | null>(null);
    const [selectedPhase, setSelectedPhase] = useState<ExecutionPhase | null>(null);

    useEffect(() => {
        (async () => {
            const retrievedToken = await getToken();
            setToken(retrievedToken);
        })();
    }, [getToken]);

    const executionQuery = useQuery({
        queryKey: ['execution', initialExecution.id],
        queryFn: async () => {
            if (!token) throw new Error("No token available");
            return getExecution(token, initialExecution.id);
        },
        refetchInterval: (q) => q.state.data?.status === ExecutionStatus.RUNNING ? 1000 : false,
        enabled: !!token, 
    });

    const phasesQuery = useQuery({
        queryKey: ['phases', initialExecution.id],
        queryFn: async () => {
            if (!token) throw new Error("No token available");
            return (await listPhases(token, initialExecution.id))
            .toSorted((a, b) => a.started_at > b.started_at ? 1 : -1);
        },
        refetchInterval: () => executionQuery.data?.status === ExecutionStatus.RUNNING ? 1000 : false,
        enabled: !!token,
        initialData: initialPhases, 
    });
    
    const phaseLogsQuery = useQuery({
        queryKey: ['phaseLogs', selectedPhase?.id, executionQuery.data?.status],
        queryFn: async () => {
            if (!token || !selectedPhase) throw new Error("No token available");
            return getLogs(token, selectedPhase.id);
        },
        refetchInterval: () => executionQuery.data?.status === ExecutionStatus.RUNNING ? 1000 : false,
        enabled: (!!token && !!selectedPhase),
    });

    const isRunning = executionQuery.data?.status === ExecutionStatus.RUNNING;

    useEffect(() => {
        const phases = phasesQuery.data;

        if (isRunning && phases) {
            const lastPhase = phases[phases.length - 1];
            setSelectedPhase(lastPhase);
        } else if (!isRunning && phases) {
            const lastCompletedPhase = phases.toSorted(
                (a, b) => a.completed_at! > b.completed_at! ? 1 : -1
            )[phases.length - 1];
            if (lastCompletedPhase) {
                setSelectedPhase(lastCompletedPhase);
            }
        }
    }, [phasesQuery.data, isRunning, setSelectedPhase]);

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
                    <ExecutionLabel icon={CircleDashedIcon} label='Status' value={executionQuery.data?.status ?? 'N/A'} />
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
                    {isRunning && (
                        <div className="flex items-center flex-col gap-2 justify-center h-full w-full">
                            <p className="font-bold">
                                Run is in progress please wait...
                            </p>
                        </div>
                    )}
                    {!isRunning && !selectedPhase && (
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
                            <LogSection logs={phaseLogsQuery.data ?? []} />
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

const LogSection = ({logs}: {logs: ExecutionLog[]}) => {
    return (
        <Card className='w-full'>
            <CardHeader className='rounded-lg rounded-b-none border-b py-4 bg-gray-50 dark:bg-background'>
                <CardTitle className='text-base'>Execution Logs</CardTitle>
                <CardDescription className='text-muted-foreground text-sm'>
                    Logs generated by this phase
                </CardDescription>
            </CardHeader>
            <CardContent className='py-0'>
                <Table>
                    <TableHeader className='text-muted-foreground text-sm'>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Message</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id} className='text-muted-foreground'>
                                <TableCell width={190} className='text-xs text-muted-foreground
                                p-[2px] pl-4'>{log.timestamp}</TableCell>
                                <TableCell width={80} className={cn(
                                    'uppercase text-xs font-bold p-[3px] pl-4',
                                log.log_level === 'error' && 'text-destructive',
                                log.log_level === 'warning' && 'text-warning',
                                log.log_level === "info" && 'text-green-500',
                                )}>{log.log_level}</TableCell>
                                <TableCell className='text-sm flex-1 p-[3px] pl-4'>{log.message}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}