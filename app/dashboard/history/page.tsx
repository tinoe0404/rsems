import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogHistory } from "@/components/dashboard/LogHistory";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";

export default async function HistoryPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-surface border-b border-border sticky top-0 z-30">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="-ml-2">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="rounded-full bg-primary/10 p-2">
                            <History className="h-6 w-6 text-primary" strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">
                                History
                            </h1>
                            <p className="text-sm text-muted">
                                Your past symptom logs
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                <LogHistory />
            </main>
        </div>
    );
}
