"use client";

import { DeleteCredentialDialog } from '@/app/dashboard/credentials/_components/DeleteWorkflowDialog';
import { Card } from '@/components/ui/card';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { UnifiedCredentialsAPI } from '@/lib/api/unified-functions-client';
import { Credential as AppCredential, CredentialSortField } from '@/types/credential';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { LockKeyholeIcon } from 'lucide-react';
import React from 'react';

const UserCredentials = ({ initialData }: { initialData: AppCredential[]}) => {
    const { getToken, user, isLoading } = useUnifiedAuth();

    // Enable query when user exists (either Clerk user or guest user) and not loading
    // OR when we have a guest session but user loading failed (Vercel fallback)
    const hasGuestSession = typeof window !== 'undefined' && !!localStorage.getItem('guest_session_id');
    const shouldEnableQuery = !isLoading && (!!user || hasGuestSession);

    const credentialMutation = useQuery<AppCredential[], Error, AppCredential[]>({
        queryKey: ["credentials", user?.isGuest ? 'guest' : 'auth', user?.id || (hasGuestSession ? 'guest-session' : 'no-user')],
        queryFn: async () => {
            const token = await getToken();
            return UnifiedCredentialsAPI.client.list(1, 50, CredentialSortField.CREATED_AT, 'desc', token);
        },
        refetchInterval: shouldEnableQuery ? 10000 : false, // Only refetch if authenticated
        initialData: initialData,
        enabled: shouldEnableQuery,
        retry: (failureCount, error) => {
            // Retry up to 3 times for network errors
            return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    return (
        <div className='flex gap-2 flex-wrap'>
            { credentialMutation.data?.map((credential) => {
                const createdAt = formatDistanceToNow(new Date(credential.created_at), { addSuffix: true });
                return <Card key={credential.id} className='w-full p-4 flex justify-between'>
                    <div className='flex gap-2 items-center'>
                        <div className="rounded-full bg-primary/10 w-8 h-8 flex items-center justify-center">
                            <LockKeyholeIcon size={18} className='stroke-primary'/>
                        </div>
                        <div className="">
                            <p className="font-bold">{credential.name}</p>
                            <p className="text-xs text-muted-foreground">{createdAt}</p>
                        </div>
                    </div>
                    <DeleteCredentialDialog credentialName={credential.name} credentialId={credential.id}/>
                </Card>
            })}
        </div>
    )
}

export default UserCredentials