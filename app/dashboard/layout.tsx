import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { Heart } from "lucide-react";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get user profile for sidebar
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Desktop Sidebar */}
            <Sidebar profile={profile} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 mb-16 md:mb-0">
                {/* Desktop Header */}
                <header className="hidden md:flex items-center justify-end h-16 px-8 bg-white border-b border-slate-200 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-teal-600 rounded-lg p-1.5">
                            <Heart className="h-5 w-5 text-white" fill="currentColor" />
                        </div>
                        <span className="font-bold text-slate-800 text-lg">RSEMS</span>
                    </div>
                    <NotificationBell />
                </header>

                {/* Content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileNav />
        </div>
    );
}
