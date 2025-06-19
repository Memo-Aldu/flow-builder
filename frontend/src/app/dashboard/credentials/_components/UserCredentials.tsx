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
    const { getToken, isAuthenticated } = useUnifiedAuth();

    const credentialMutation = useQuery<AppCredential[], Error, AppCredential[]>({
        queryKey: ["credentials", isAuthenticated ? 'auth' : 'guest'],
        queryFn: async () => {
            const token = await getToken();
            return UnifiedCredentialsAPI.client.list(1, 50, CredentialSortField.CREATED_AT, 'desc', token);
        },
        refetchInterval: isAuthenticated ? 10000 : false, // Only refetch if authenticated
        initialData: initialData,
        enabled: isAuthenticated,
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