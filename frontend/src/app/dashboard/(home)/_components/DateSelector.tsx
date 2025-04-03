"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react'


const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
];


const DateSelector = (periods: { periods: { year: number, month: number}[]}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  return (
    <Select onValueChange={(value) => {
        const [year, month] = value.split('-').map(Number);
        const params = new URLSearchParams(searchParams);
        params.set('year', year.toString());
        params.set('month', month.toString());
        router.push(`?${params.toString()}`);

    }}>
        <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Select a date' />
        </SelectTrigger>
        <SelectContent>
            {periods.periods.map((period) => (
                <SelectItem key={`${period.year}-${period.month}`} value={`${period.year}-${period.month}`}>
                    {`${period.year} ${MONTH_NAMES[period.month - 1]}`}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
  )
}

export default DateSelector