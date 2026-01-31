"use client";

import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
    className?: string;
    variant?: "sidebar" | "mobile";
    label?: string;
}

export function LogoutButton({ className, variant = "sidebar", label = "Log Out" }: LogoutButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        const supabase = createClient();

        try {
            await supabase.auth.signOut();
            toast.success("Logged out successfully");
            router.push("/admin/login");
            router.refresh(); // Ensure strict refresh
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("Failed to log out");
        } finally {
            setIsLoading(false);
        }
    };

    if (variant === "sidebar") {
        return (
            <button
                onClick={handleLogout}
                disabled={isLoading}
                className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors text-left",
                    isLoading && "opacity-50 cursor-wait",
                    className
                )}
            >
                <LogOut className="h-5 w-5" />
                {label}
            </button>
        );
    }

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className={cn("flex items-center gap-2 text-red-600 font-medium", className)}
        >
            <LogOut className="h-4 w-4" />
            {label}
        </button>
    );
}
