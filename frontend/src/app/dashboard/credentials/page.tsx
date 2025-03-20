import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCredentials } from '@/lib/api/credential'
import { CredentialSortField } from '@/types/credential'
import { auth } from '@clerk/nextjs/server'
import { AlertCircle, ShieldIcon, ShieldOffIcon } from 'lucide-react'
import React, { Suspense } from 'react'
import { CreateCredentialDialog } from '@/app/dashboard/credentials/_components/CreateCredentialDialog'
import UserCredentials from '@/app/dashboard/credentials/_components/UserCredentials'

const CredentialPage = () => {
  return (
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
                <AlertTitle className='text-primary'>No credentials found</AlertTitle>
                <AlertDescription className='text-primary'>All information is encrypted,
                     ensuring your data remains safe.
                </AlertDescription>
            </Alert>
            <Suspense fallback={<Skeleton className='h-[300px] w-full'/>}>
                <UserCredentialsWrapper />
            </Suspense>
        </div>
    </div>
  )
}


const UserCredentialsWrapper = async () => {
    const { userId, getToken } = await auth()

    if (!userId) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Please log in again.</AlertTitle>
        </Alert>
      )
    }
  
    const token = await getToken()
    if (!token) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>No valid token found.</AlertTitle>
        </Alert>
      )
    }

    const credentials = await getCredentials(token, 1, 50, CredentialSortField.CREATED_AT, 'desc');

    if (!credentials) {
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

    if (credentials.length === 0) {
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
}

export default CredentialPage