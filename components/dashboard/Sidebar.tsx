"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Profile } from "@/types/database.types";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Activity,
    History,
    Calendar,
    User,
    LogOut,
    Heart
} from "lucide-react";
import { PatientLogoutButton } from "./PatientLogoutButton";

interface SidebarProps {
    profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
    const pathname = usePathname();

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Log Symptoms", href: "/dashboard/log", icon: Activity },
        { name: "History", href: "/dashboard/history", icon: History },
        { name: "Appointments", href: "/dashboard/appointments", icon: Calendar },
        { name: "My Profile", href: "/dashboard/profile", icon: User },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 font-sans">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="bg-teal-600 rounded-lg p-1.5 shadow-sm">
                    <Heart className="h-5 w-5 text-white" fill="currentColor" />
                </div>
                <span className="font-bold text-slate-800 text-xl tracking-tight">RSEMS</span>
            </div>

            <div className="p-6 pb-2">
                <div className="flex items-center gap-3 px-3 py-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="h-10 w-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                        {profile.full_name[0]}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                            {profile.full_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                            {profile.cancer_type}
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Menu
                </p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                                isActive
                                    ? "bg-teal-50 text-teal-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 transition-colors",
                                isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"
                            )} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <PatientLogoutButton className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50" />
            </div>
        </aside>
    );
}
