import CountUpWrapper from '@/components/CountUpWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import React from 'react'

interface StatsCardProps {
    title: string;
    value: number;
    icon: LucideIcon
}

const StatsCard = ( { title, value, icon }: StatsCardProps) => {
  const Icon = icon
  return (
    <Card className='relative overflow-hidden h-full'>
        <CardHeader className='flex pb-2'>
            <CardTitle>{title}</CardTitle>
            <Icon size={120} className='text-muted-foreground absolute 
            -bottom-4 -right-8 opacity-10'></Icon>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-primary">
                <CountUpWrapper value={value}/>
            </div>
        </CardContent>
    </Card>
  )
}

export default StatsCard