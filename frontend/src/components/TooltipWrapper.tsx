'use client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React from 'react';

type TooltipWrapperProps = {
    children: React.ReactNode
    content: React.ReactNode
    side?: 'top' | 'bottom' | 'left' | 'right'
}

export const TooltipWrapper = (props: TooltipWrapperProps) => {
  return (
    <TooltipProvider delayDuration={0}>
        <Tooltip>
            <TooltipTrigger asChild>
                {props.children}
            </TooltipTrigger>
            <TooltipContent className='' side={props.side}>{props.content}</TooltipContent>
        </Tooltip>
    </TooltipProvider>
  )
}
