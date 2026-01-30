import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <div className="p-4 bg-white rounded-2xl shadow-sm mb-8 animate-bounce-slow">
                <ShieldCheck className="h-12 w-12 text-primary" />
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-2">Page Not Found</h1>
            <p className="text-gray-600 mb-8 max-w-md">
                The page you are looking for doesn't exist or has been moved. Let's get you back to safety.
            </p>

            <Link href="/dashboard">
                <Button variant="primary" size="lg">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </Link>
        </div>
    );
}
