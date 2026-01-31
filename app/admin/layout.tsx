"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    LogOut,
    ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/admin/MobileMenu";

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
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Exit to App
                    </Link>
                </div>
            </aside>

            {/* Mobile Header & Menu */}
            <MobileMenu navItems={navItems} />

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 bg-gray-50 min-h-screen">
                {children}
            </main>
        </div>
    );
}
