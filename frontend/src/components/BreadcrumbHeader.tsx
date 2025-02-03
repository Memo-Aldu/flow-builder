"use client";

import { usePathname } from 'next/navigation';
import React from 'react'
import { 
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator
 } from '@/components/ui/breadcrumb';
import { MobileSidebar } from './Sidebar';

export const BreadcrumbHeader = () => {
    const pathName = usePathname().replace('/dashboard', '');
    const paths = pathName === '/' ? [''] : pathName.split('/');
  return (
    <div className='flex items-center flex-start '>
        <MobileSidebar />
        <Breadcrumb>
            <BreadcrumbList>
                {paths.map((path, index) => (
                    <React.Fragment key={index}>
                        <BreadcrumbItem>
                            <BreadcrumbLink href={`/dashboard/${path}`} className='capitalize'>
                                {path === '' ? 'home' : path}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {index < paths.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    </div>
  )
}
