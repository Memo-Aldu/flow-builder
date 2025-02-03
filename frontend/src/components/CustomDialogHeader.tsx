"use client";

import { cn } from '@/lib/utils';
import { DialogTitle } from '@radix-ui/react-dialog';
import { LucideIcon } from 'lucide-react';
import React from 'react';
import { DialogHeader } from './ui/dialog';
import { Separator } from './ui/separator';

type CustomDialogHeaderProps = {
    icon?: LucideIcon
    title?: string
    subTitle?: string

    iconClassName?: string
    titleClassName?: string
    subTitleClassName?: string
}

export const CustomDialogHeader = (props: CustomDialogHeaderProps) => {
  return (
    <DialogHeader className='py-6'>
        <DialogTitle asChild>
            <div className="flex flex-col items-center gap-2 mb-2">
                { props.icon && <props.icon size={30} className={cn("stroke-primary", props.iconClassName)} /> }
                { props.title && <h2 className={cn("text-xl text-primary", props.titleClassName)}>{props.title}</h2> }
                { props.subTitle && <p className={cn("text-muted-foreground text-sm", props.subTitleClassName)}>{props.subTitle}</p> }
            </div>
        </DialogTitle>
        <Separator />
    </DialogHeader>
  )
}
