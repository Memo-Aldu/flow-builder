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
    const { getToken, user, isLoading } = useUnifiedAuth();



    // Enable query when user exists (either Clerk user or guest user) and not loading
    // OR when we have a guest session but user loading failed (Vercel fallback)
    const hasGuestSession = typeof window !== 'undefined' && !!localStorage.getItem('guest_session_id');
    const shouldEnableQuery = !isLoading && (!!user || hasGuestSession);

    const query = useQuery({
        queryKey: ["workflows", user?.isGuest ? 'guest' : 'auth', user?.id || (hasGuestSession ? 'guest-session' : 'no-user')],
        queryFn: async () => {
            const token = await getToken();

            // For guest users, we don't need a token - the axios interceptor will handle authentication
            const workflows = await UnifiedWorkflowsAPI.client.list(1, 50, undefined, undefined, token);
            return workflows;
        },
        // Only refetch if authenticated to prevent spam
        refetchInterval: shouldEnableQuery ? 10000 : false,
        initialData,
        enabled: shouldEnableQuery, // Enable when user exists and not loading
        retry: (failureCount, error: any) => {
            // Don't retry for authentication errors
            if (error?.response?.status === 401 || error?.response?.status === 403) {
                return false;
            }

            // Don't retry if backend is not available
            if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
                return false;
            }

            // Retry up to 3 times for other errors
            return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    });

    if (query.isFetching && !query.data) {
        return <AppLoading />
    }

    if (query.error) {
        const error = query.error as any;
        const isNetworkError = error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error');
        const isBackendStarting = error?.isBackendStarting;

        return (
            <Alert variant={isBackendStarting ? 'default' : 'destructive'}>
                <AlertCircle className='w-4 h-4' />
                <AlertTitle>
                    {isBackendStarting
                        ? 'Backend is starting up...'
                        : isNetworkError
                            ? 'Cannot connect to backend'
                            : 'Something went wrong. Please try again later.'
                    }
                </AlertTitle>
            </Alert>
        );
    }

    if (!query.data) {
        return (
            <Alert variant={'destructive'}>
                <AlertCircle className='w-4 h-4' />
                <AlertTitle>
                    No data available. Please try again later.
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