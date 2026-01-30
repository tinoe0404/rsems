import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, type, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-foreground mb-2"
                    >
                        {label}
                        {props.required && <span className="text-alert ml-1">*</span>}
                    </label>
                )}
                <input
                    type={type}
                    id={inputId}
                    ref={ref}
                    className={cn(
                        "w-full h-11 min-h-[44px] px-4 rounded-lg border bg-surface text-foreground",
                        "text-base md:text-sm", // 16px on mobile to prevent iOS zoom
                        "transition-all duration-200",
                        "placeholder:text-muted",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        error
                            ? "border-alert focus:ring-alert focus:border-alert"
                            : "border-border hover:border-primary/50",
                        className
                    )}
                    aria-invalid={error ? "true" : "false"}
                    aria-describedby={
                        error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
                    }
                    {...props}
                />
                {error && (
                    <p
                        id={`${inputId}-error`}
                        className="mt-1.5 text-sm text-alert flex items-center gap-1"
                        role="alert"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p
                        id={`${inputId}-helper`}
                        className="mt-1.5 text-sm text-muted"
                    >
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };
