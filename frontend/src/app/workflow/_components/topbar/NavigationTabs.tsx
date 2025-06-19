"use client";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const NavigationTabs = ( { workflowId } : {workflowId: string}) => {
  const pathName = usePathname()
  const activeTab = pathName.split('/')[2]

  return (
    <Tabs value={activeTab} className='w-[400px]'>
      <TabsList className='grid w-full grid-cols-3'>
        <Link href={`/workflow/editor/${workflowId}`}>
          <TabsTrigger value='editor' className='w-full'>Editor</TabsTrigger>
        </Link>
        <Link href={`/workflow/runs/${workflowId}`}>
          <TabsTrigger value='runs' className='w-full'>Runs</TabsTrigger>
        </Link>
        <Link href={`/workflow/versions/${workflowId}`}>
          <TabsTrigger value='versions' className='w-full'>Versions</TabsTrigger>
        </Link>
      </TabsList>
    </Tabs>
  )
}

export default NavigationTabs