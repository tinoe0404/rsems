"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
            <div className="p-4 bg-red-50 rounded-full mb-6">
                <AlertCircle className="h-10 w-10 text-alert" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 max-w-md mb-8">
                Don't worry, your data is safe. We encountered an unexpected error while loading this page.
            </p>

            <Button
                onClick={() => reset()}
                variant="primary"
                className="min-w-[140px]"
            >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
            </Button>
        </div>
    );
}
