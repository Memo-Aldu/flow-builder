
import { cn } from '@/lib/utils'
import { Waypoints } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type LogoProps = {
    fontSize?: string
    iconSize?: number
}

export const Logo = ({ fontSize = 'text-2xl', iconSize = 20}: LogoProps) => {
  return <Link href="/dashboard" className={cn("text-2xl font-extrabold flex items-center gap-2",
    fontSize
  )}>
    <div className='rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-2'>
        <Waypoints size={iconSize} className='stroke-white' />
    </div>
    <div>
        <span className='bg-gradient-to-r from-blue-500 to-blue-600
        bg-clip-text text-transparent'>
            Flow
        </span>
        <span className='text-stone-700 dark:text-stone-300'>
            Builder
        </span>
    </div>
  </Link>
}
