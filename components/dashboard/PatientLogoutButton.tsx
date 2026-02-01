"use client";

import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PatientLogoutButtonProps {
    className?: string;
    variant?: "default" | "destructive";
}

export function PatientLogoutButton({ className, variant = "default" }: PatientLogoutButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        const supabase = createClient();

        try {
            await supabase.auth.signOut();
            toast.success("Logged out successfully");
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("Failed to log out");
        } finally {
            setIsLoading(false);
        }
    };

    if (variant === "destructive") {
        return (
            <button
                onClick={handleLogout}
                disabled={isLoading}
                aria-label={isLoading ? "Logging out" : "Log out of your account"}
                className={cn(
                    "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 font-medium hover:bg-red-100 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]",
                    isLoading && "opacity-50 cursor-wait",
                    className
                )}
            >
                <LogOut className={cn("h-5 w-5", isLoading && "animate-spin")} />
                {isLoading ? "Logging out..." : "Log Out"}
            </button>
        );
    }

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            aria-label={isLoading ? "Logging out" : "Log out of your account"}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]",
                isLoading && "opacity-50 cursor-wait",
                className
            )}
        >
            <LogOut className={cn("h-4 w-4", isLoading && "animate-spin")} />
            {isLoading ? "Logging out..." : "Log Out"}
        </button>
    );
}
