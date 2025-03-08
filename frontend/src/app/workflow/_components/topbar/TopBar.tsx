"use client";
import { TooltipWrapper } from '@/components/TooltipWrapper';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react'
import SaveBtn from '@/app/workflow/_components/topbar/SaveBtn';
import ExecuteBtn from '@/app/workflow/_components/topbar/ExecuteBtn';
import NavigationTabs from '@/app/workflow/_components/topbar/NavigationTabs';
import PublishBtn from './PublishBtn';
import UnPublishBtn from './UnpublishBtn';

type TopBarProps = {
    title: string
    subtitle?: string
    workflowId: string
    hideButtons?: boolean,
    isPublished?: boolean
}

const TopBar = ({ title, subtitle, workflowId, hideButtons = false, isPublished = false }: TopBarProps) => {
  const router = useRouter()

  return (
    <header className='flex p-2 border-b-2 border-separate
    justify-between w-full h-[60px] sticky top-0 bg-background z-10'>
        <div className="flex gap-1 flex-1">
            <TooltipWrapper content='Go Back'>
                <Button variant={'ghost'} size={'icon'} 
                onClick={() => router.back()}
                >
                    <ChevronLeftIcon size={24} />
                </Button>
            </TooltipWrapper>
            <div className="">
                <p className="font-bold text-ellipsis truncate">{title}</p>
                {subtitle && <p className="text-xs text-muted-foreground text-ellipsis truncate">{subtitle}</p>}
            </div>
        </div>
        <NavigationTabs workflowId={workflowId} />
        <div className="flex gap-1 flex-1 justify-end">
            { hideButtons === false && (
                <>
                    <ExecuteBtn workflowId={workflowId} isPublished/>
                    { isPublished && <UnPublishBtn workflowId={workflowId}/>}
                    {! isPublished && (
                        <>
                            <SaveBtn workflowId={workflowId}/>
                            <PublishBtn workflowId={workflowId}/>
                        </>)
                    }
                </>
            )}
        </div>
    </header>
  )
}

export default TopBar