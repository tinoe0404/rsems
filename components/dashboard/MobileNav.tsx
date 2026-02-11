"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Activity,
    History,
    Calendar,
    User
} from "lucide-react";

export function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/dashboard", icon: LayoutDashboard },
        { name: "Log", href: "/dashboard/log", icon: Activity },
        { name: "History", href: "/dashboard/history", icon: History },
        { name: "Visits", href: "/dashboard/appointments", icon: Calendar },
        { name: "Profile", href: "/dashboard/profile", icon: User },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isActive
                                    ? "text-teal-600"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <item.icon className={cn(
                                "h-6 w-6",
                                isActive && "fill-current/20"
                            )} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium tracking-tight">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
