"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    LogOut,
    ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single() as any; // Cast to avoid inference issues

            // Explicitly check for clinician role
            // In a real app, we'd use 'clinician' but for now we might be testing with 'patient'
            // To strictly follow requirements:
            if (profile?.role !== "clinician") {
                // Optionally redirect or show unauthorized
                // For development/MVP if you created a patient user, you might want to allow it temporarily
                // But the requirement says "Ensure this page is only accessible to users with role: 'clinician'"
                // We will enforce it strictly.
                router.push("/dashboard"); // Redirect patients away
                return;
            }

            setIsAuthorized(true);
            setIsLoading(false);
        }

        checkAuth();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthorized) return null;

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

            {/* Mobile Header (placeholder) */}
            <div className="md:hidden fixed top-0 w-full bg-[#00695C] text-white p-4 z-50">
                <span className="font-bold">RSEMS Clinician</span>
            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8 pt-20 md:pt-8 bg-gray-50 min-h-screen">
                {children}
            </main>
        </div>
    );
}
