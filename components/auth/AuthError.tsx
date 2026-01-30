import React from "react";
import { AlertCircle } from "lucide-react";

interface AuthErrorProps {
    message: string | null;
    className?: string;
}

export function AuthError({ message, className = "" }: AuthErrorProps) {
    if (!message) return null;

    return (
        <div
            className={`rounded-lg bg-alert/10 border border-alert/20 p-4 ${className}`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-alert flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-alert">{message}</p>
                </div>
            </div>
        </div>
    );
}
