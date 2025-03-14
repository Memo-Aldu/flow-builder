"use client"
import { Alert, AlertTitle } from '@/components/ui/alert';
import { getWorkflows } from '@/lib/api/workflows';
import { useAuth } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, InboxIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { CreateWorkflowDialog } from '@/app/dashboard/workflows/_components/CreateWorkflowDialog';
import { WorkflowCard } from '@/app/dashboard/workflows/_components/WorkflowCard';
import { AppLoading } from '@/components/AppLoading';
import { WorkflowListResponse } from '@/types/workflows';

type UserWorkflowsProps = {
    initialData: WorkflowListResponse
}

const UserWorkflows = ({ initialData }: UserWorkflowsProps) => {
    const { getToken } = useAuth();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAuth() {
            const t = await getToken();
            setToken(t);
        }
        fetchAuth()
    }, [getToken])

    const query = useQuery({
        queryKey: ["workflows", token],
        queryFn: async () => {
            if (!token) return [];
            const workflows = await getWorkflows(token, 1, 50);
            return workflows;
        },
        // Every minute
        refetchInterval: 60000,
        initialData,
        enabled: !!token,
    });

    if (query.isFetching && !query.data) {
        return <AppLoading />
    }

    if (!query.data) {
        return (
        <Alert
            variant={'destructive'}
        >
            <AlertCircle className='w-4 h-4' />
            <AlertTitle>
                Something went wrong. Please try again later.
            </AlertTitle>
        </Alert>
        );
    }
    
    if (query.data.length === 0) {
        return (
            <div className='flex flex-col gap-4 h-full items-center justify-center'>
                <div className='rounded-full bg-accent w-20 h-20 flex items-center justify-center'>
                    <InboxIcon size={40} className='stroke-primary' />
                </div>
                <div className="flex flex-col gap-1 text-center">
                    <p className="font-bold">No workflows created.</p>
                    <p className="text-sm text-muted-foreground">
                        Click the button below to create your first workflow.
                    </p>
                </div>
                <CreateWorkflowDialog triggerText='Create your first workflow'/>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 gap-4">
            {query.data.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
        </div>
    )
}

export default UserWorkflows