import { useUnifiedAuth } from '@/contexts/AuthContext';
import { useUserBalance } from '@/hooks/useUserBalance';
import { cn } from '@/lib/utils';
import { CoinsIcon, Loader2Icon } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import CountUpWrapper from './CountUpWrapper';
import { buttonVariants } from './ui/button';

const UserCreditsBadge = () => {
    const { balance, isLoading } = useUserBalance();
    const { user } = useUnifiedAuth();

    // For guest users, link to guest-info instead of billing
    const href = user?.isGuest ? '/dashboard/guest-info' : '/dashboard/billing';

    return (
        <Link href={href} className={cn("w-full space-x-2 items-center", buttonVariants({
            variant: 'outline',
        }))}>
            <CoinsIcon className='text-primary' size={20} />
            <span className="font-semibold capitalize">
                { isLoading && (<Loader2Icon className='h-4 w-4 animate-spin stroke-primary'/>)}
                { !isLoading && balance !== undefined && <CountUpWrapper value={balance} />}
                { !isLoading && balance === undefined && 'N/A'}
            </span>
        </Link>
    )
}

export default UserCreditsBadge