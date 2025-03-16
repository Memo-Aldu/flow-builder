import { getCredit } from '@/lib/api/balances'
import { cn } from '@/lib/utils';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query'
import { CoinsIcon, Loader2Icon } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import CountUpWrapper from './CountUpWrapper';
import { buttonVariants } from './ui/button';

const UserCreditsBadge = () => {
    const { getToken } = useAuth();
    
  const query = useQuery({
    queryKey: ['userCredits'],
    queryFn: async () => {
        const token = await getToken()
        if (!token) {
            throw new Error('No valid token found.')
        }
        return getCredit(token)
    },
    refetchInterval: 30 * 1000,
  })
  return (
    <Link href='/billing' className={cn("w-full space-x-2 items-center", buttonVariants({
        variant: 'outline',
    }))}>
        <CoinsIcon className='text-primary' size={20} />
        <span className="font-semibold capitalize">
            { query.isLoading && (<Loader2Icon className='h-4 w-4 animate-spin stroke-primary'/>)}
            { !query.isLoading && query.data && <CountUpWrapper value={query.data} />}
            { !query.isLoading && query.data === undefined && 'N/A'}
        </span>
    </Link>
  )
}

export default UserCreditsBadge