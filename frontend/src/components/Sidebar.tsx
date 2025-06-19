"use client";

import UserCreditsBadge from '@/components/UserCreditsBadge';
import { useUnifiedAuth } from '@/contexts/AuthContext';
import { CoinsIcon, HomeIcon, InfoIcon, Layers2Icon, MenuIcon, ShieldCheckIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { Logo } from './Logo';
import { Button, buttonVariants } from './ui/button';
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
        href: "guest-info",
        label: "Guest Info",
        icon: InfoIcon,
        guestOnly: true,
    },
    {
        href: "billing",
        label: "Billing",
        icon: CoinsIcon,
        authOnly: true,
    }
]

function DesktopSidebar() {
    const pathName = usePathname();
    const { user } = useUnifiedAuth();
    const activeRoute = routes.find(route =>
        pathName.includes(route.href) && route.href !== '') || routes[0];

    // Filter routes based on guest access
    const availableRoutes = routes.filter(route => {
        if (route.guestOnly) {
            return user?.isGuest;
        }
        if (route.authOnly) {
            return !user?.isGuest;
        }
        // For guest users, check specific feature access
        if (user?.isGuest) {
            const guestRestrictions = {
                'billing': false,
                'purchases': false,
                'workflows': true,
                'executions': true,
                'credentials': true,
                'guest-info': true,
            };
            return guestRestrictions[route.href as keyof typeof guestRestrictions] ?? true;
        }
        return true; // Authenticated users have full access
    });

  return (
    <div className='hidden relative md:block min-w-[280px] max-w-[280px] h-screen overflow-hidden
    w-full bg-primary/5 dark:bg-secondary/30 dark:text-foreground text-muted-foreground border-r-2
    border-separate'>
        <div className='flex items-center justify-center gap-2
        border-b-[1px] border-separate p-4'>
            <Logo />
        </div>

        <div className='p-2'><UserCreditsBadge/></div>

        {/* Only show navigation routes if not in guest mode or if there are available routes */}
        {(!user?.isGuest || availableRoutes.length > 0) && (
            <div className='flex flex-col p-2 space-y-1'>
                {availableRoutes.map(route => (
                    <div key={route.href} className='flex flex-col'>
                    <Link key={`/${route.href}`}
                    href={`/dashboard/${route.href}`}
                    className={buttonVariants({
                        variant: activeRoute.href === route.href ? 'sidebarItemActive' : 'sidebarItem',
                        size: 'lg',
                    })}
                    >
                        <route.icon className='w-8 h-8' size={20} />
                        {route.label}
                    </Link>
                    </div>
                ))}
            </div>
        )}
    </div>
  )
}

export const MobileSidebar = () => {
    const pathName = usePathname();
    const { user } = useUnifiedAuth();
    const activeRoute = routes.find(route => pathName.includes(route.href)) || routes[0];
    const [isOpen, setIsOpen] = React.useState(false);

    // Filter routes based on guest access
    const availableRoutes = routes.filter(route => {
        if (route.guestOnly) {
            return user?.isGuest;
        }
        if (route.authOnly) {
            return !user?.isGuest;
        }
        // For guest users, check specific feature access
        if (user?.isGuest) {
            const guestRestrictions = {
                'billing': false,
                'purchases': false,
                'workflows': true,
                'executions': true,
                'credentials': true,
                'guest-info': true,
            };
            return guestRestrictions[route.href as keyof typeof guestRestrictions] ?? true;
        }
        return true; // Authenticated users have full access
    });

    return (
    <div className='block border-separate bg-background md:hidden'>
        <div className='container flex items-center justify-between px-8'>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant='ghost' size='icon'>
                        <MenuIcon />
                    </Button>
                </SheetTrigger>
                <SheetContent className='w-[400px] sm:w-[540px] space-y-4' side={"left"}>
                    <Logo />

                    <UserCreditsBadge />

                    <div className='flex flex-col gap-1'>
                        {availableRoutes.map(route => (
                            <Link key={`/${route.href}`}
                            href={`/dashboard/${route.href}`}
                            className={buttonVariants({
                                variant: activeRoute.href === route.href ? 'sidebarItemActive' : 'sidebarItem',
                            })}
                            onClick={() => setIsOpen(false)}
                            >
                                <route.icon className='w-8 h-8' size={20} />
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
