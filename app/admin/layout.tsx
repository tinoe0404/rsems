"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    LogOut,
    ShieldAlert,
    ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/admin/MobileMenu";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Note: Authorization is now handled by middleware
    // This layout just renders for authenticated clinicians

    // Don't show layout on login page
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    const navItems = [
        { name: "Triage Board", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Symptom Logs", href: "/admin/logs", icon: ClipboardList },
        { name: "Patients", href: "/admin/patients", icon: Users },
        { name: "Appointments", href: "/admin/appointments", icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#00695C] text-white fixed h-full hidden md:flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <ShieldAlert className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">RSEMS</h1>
                            <span className="text-xs text-white/70 uppercase tracking-wider">Clinician Portal</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-white/10 text-white"
                                        : "text-white/70 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <LogoutButton label="Exit to App" />
                </div>
            </aside>

            {/* Mobile Header & Menu */}
            <MobileMenu navItems={navItems} />

            {/* Main Content */}
            <main className="flex-1 md:ml-64 bg-background min-h-screen flex flex-col">
                {/* Desktop Header */}
                <header className="hidden md:flex items-center justify-end h-16 px-8 bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Admin Portal</span>
                        <div className="h-4 w-px bg-gray-200" />
                        <AdminNotificationBell variant="header" />
                    </div>
                </header>

                <div className="p-4 md:p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
