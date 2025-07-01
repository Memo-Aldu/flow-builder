import { CreateCredentialDialog } from '@/app/dashboard/credentials/_components/CreateCredentialDialog';
import UserCredentials from '@/app/dashboard/credentials/_components/UserCredentials';
import { ClientAuthFallback } from '@/components/ClientAuthFallback';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getServerCredentials } from '@/lib/api/unified-server-api';
import { getUnifiedAuth } from '@/lib/auth/unified-auth';
import { CredentialSortField } from '@/types/credential';
import { AlertCircle, ShieldIcon, ShieldOffIcon } from 'lucide-react';
import React, { Suspense } from 'react';

// Force dynamic rendering to enable server-side authentication
export const dynamic = 'force-dynamic';

const CredentialPage = async () => {
  const user = await getUnifiedAuth();

  const content = (
    <div className='flex flex-1 flex-col h-full'>
        <div className="flex justify-between">
            <div className="flex flex-col">
                <h1 className='text-3xl font-bold'>Credentials</h1>
                <p className="text-muted-foreground">Manage your credentials</p>
            </div>
            <CreateCredentialDialog triggerText='Create a credential'/>
        </div>
        <div className="h-full py-6 space-y-8">
            <Alert>
                <ShieldIcon className='h-4 w-4 stroke-primary'/>
                <AlertTitle className='text-primary'>Encrypted Credential</AlertTitle>
                <AlertDescription className='text-foreground'>All information is encrypted,
                     ensuring your data remains safe.
                </AlertDescription>
            </Alert>
            <Suspense fallback={<Skeleton className='h-[300px] w-full'/>}>
                <UserCredentialsWrapper />
            </Suspense>
        </div>
    </div>
  );

  return (
    <ClientAuthFallback serverUser={user}>
      {content}
    </ClientAuthFallback>
  );
}


const UserCredentialsWrapper = async () => {
    const user = await getUnifiedAuth();

    // If no user, return empty state - the main ClientAuthFallback will handle auth
    if (!user) {
        return (
            <Card className='w-full p-4'>
                <div className="flex flex-col gap-4 h-full items-center justify-center">
                    <div className="rounded-full bg-accent w-20 h-20 flex items-center justify-center">
                        <ShieldOffIcon size={40} className='stroke-primary'/>
                    </div>
                    <div className="flex flex-col gap-1 text-center">
                        <p className="font-bold">No credentials available.</p>
                        <p className="text-sm text-muted-foreground">
                            Please log in to view your credentials.
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    try {
        const credentials = await getServerCredentials(1, 50, CredentialSortField.CREATED_AT, 'desc');

        if (!credentials || credentials.length === 0) {
            return (
                <Card className='w-full p-4'>
                    <div className="flex flex-col gap-4 h-full items-center justify-center">
                        <div className="rounded-full bg-accent w-20 h-20 flex items-center justify-center">
                            <ShieldOffIcon size={40} className='stroke-primary'/>
                        </div>
                        <div className="flex flex-col gap-1 text-center">
                            <p className="font-bold">No credentials created.</p>
                            <p className="text-sm text-muted-foreground">
                                Click the button below to create your first credential.
                            </p>
                        </div>
                        <CreateCredentialDialog triggerText='Create your first credential'/>
                    </div>
                </Card>
            );
        }

        return <UserCredentials initialData={credentials}/>
    } catch (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Something went wrong. Please try again later.</AlertTitle>
            </Alert>
        );
    }
}

export default CredentialPage