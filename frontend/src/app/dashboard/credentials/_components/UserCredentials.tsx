"use client";

import { Card } from '@/components/ui/card';
import { getCredentials } from '@/lib/api/credential';
import { Credential as AppCredential, CredentialSortField } from '@/types/credential';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { LockKeyholeIcon } from 'lucide-react';
import React from 'react'
import { DeleteCredentialDialog } from '@/app/dashboard/credentials/_components/DeleteWorkflowDialog';

const UserCredentials = ({ initialData }: { initialData: AppCredential[]}) => {
    const { getToken } = useAuth();

    const credentialMutation = useQuery<AppCredential[], Error, AppCredential[]>({
        queryKey: ["credentials"],
        queryFn: async () => {
            const token = await getToken();
            if (!token) {
                throw new Error('No valid token found.');
            }
            const credentials = await getCredentials(token, 1, 50, CredentialSortField.CREATED_AT, 'desc');
            return credentials;
        },
        refetchInterval: 10000,
        initialData: initialData,
    });

    return (
        <div className='flex gap-2 flex-wrap'>
            { credentialMutation.data.map((credential) => {
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