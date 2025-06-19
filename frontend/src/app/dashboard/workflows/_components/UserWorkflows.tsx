"use client"
import { CreateWorkflowDialog } from '@/app/dashboard/workflows/_components/CreateWorkflowDialog';
import { WorkflowCard } from '@/app/dashboard/workflows/_components/WorkflowCard';
import { AppLoading } from '@/components/AppLoading';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { UnifiedWorkflowsAPI } from '@/lib/api/unified-functions-client';
import { WorkflowListResponse } from '@/types/workflows';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, InboxIcon } from 'lucide-react';
import React from 'react';

type UserWorkflowsProps = {
    initialData: WorkflowListResponse
}

const UserWorkflows = ({ initialData }: UserWorkflowsProps) => {
    const { getToken, isAuthenticated } = useUnifiedAuth();

    const query = useQuery({
        queryKey: ["workflows", isAuthenticated ? 'auth' : 'guest'],
        queryFn: async () => {
            const token = await getToken();
            const workflows = await UnifiedWorkflowsAPI.client.list(1, 50, undefined, undefined, token);
            return workflows;
        },
        // Only refetch if authenticated to prevent spam
        refetchInterval: isAuthenticated ? 10000 : false,
        initialData,
        enabled: isAuthenticated, // Only enable when authenticated
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