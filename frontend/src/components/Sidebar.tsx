"use client";

import { CoinsIcon, HomeIcon, Layers2Icon, MenuIcon, ShieldCheckIcon } from 'lucide-react';
import React from 'react'
import { Logo } from './Logo';
import Link from 'next/link';
import { Button, buttonVariants } from './ui/button';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

const routes = [
    {
        href: "",
        label: "Home",
        icon: HomeIcon,
    },
    {
        href: "workflows",
        label: "Workflows",
        icon: Layers2Icon,
    },
    {
        href: "credentials",
        label: "Credentials",
        icon: ShieldCheckIcon,
    },
    {
        href: "billing",
        label: "Billing",
        icon: CoinsIcon,
    }
]

function DesktopSidebar() {
    const pathName = usePathname();
    const activeRoute = routes.find(route => 
        pathName.includes(route.href) && route.href !== '') || routes[0];
  return (
    <div className='hidden relative md:block min-w-[280px] max-w-[280px] h-screen overflow-hidden
    w-full bg-primary/5 dark:bg-secondary/30 dark:text-foreground text-muted-foreground border-r-2
    border-separate'>
        <div className='flex items-center justify-center gap-2
        border-b-[1px] border-separate p-4'>
            <Logo />
        </div>
        <div className='p-2'> TODO CREDITS</div>
        <div className='flex flex-col p-2'>
            {routes.map(route => (
                <Link key={route.href} 
                href={`/dashboard/${route.href}`}
                className={buttonVariants({
                    variant: activeRoute.href === route.href ? 'sidebarItemActive' : 'sidebarItem',
                })}
                >
                    <route.icon className='w-6 h-6' size={20} />
                    {route.label}
                </Link>
            ))}
        </div>
    </div>
  )
}

export const MobileSidebar = () => {
    const pathName = usePathname();
    const activeRoute = routes.find(route => pathName.includes(route.href)) || routes[0];
    const [isOpen, setOpen] = React.useState(false);
  
    return (
    <div className='block border-separate bg-background md:hidden'>
        <div className='container flex items-center justify-between px-8'>
            <Sheet open={isOpen} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant='ghost' size='icon'>
                        <MenuIcon />
                    </Button>
                </SheetTrigger>
                <SheetContent className='w-[400px] sm:w-[540px] space-y-4' side={"left"}>
                    <Logo />
                    <div className='flex flex-col gap-1'>
                        {routes.map(route => (
                            <Link key={route.href} 
                            href={`/dashboard/${route.href}`}
                            className={buttonVariants({
                                variant: activeRoute.href === route.href ? 'sidebarItemActive' : 'sidebarItem',
                            })}
                            onClick={() => setOpen(false)}
                            >
                                <route.icon className='w-6 h-6' size={20} />
                                {route.label}
                            </Link>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    </div>
  )
}

export default DesktopSidebar
