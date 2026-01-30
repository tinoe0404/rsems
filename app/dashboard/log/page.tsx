import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type Profile } from "@/types/database.types";
import { SymptomLogger } from "@/components/dashboard/SymptomLogger";
import { Card } from "@/components/ui/Card";
import { Heart } from "lucide-react";

export default async function SymptomLogPage() {
    const supabase = await createClient();

    // Auth check
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Fetch active symptoms
    const { data: symptoms, error } = await supabase
        .from("symptoms_master")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });

    if (error) {
        console.error("Error fetching symptoms:", error);
        return (
            <div className="p-8 text-center">
                <p className="text-alert">Failed to load symptoms. Please try again.</p>
            </div>
        );
    }

    // Get user profile for personalized greeting
    const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

    const profile = profileData as { full_name: string } | null;

    const firstName = profile?.full_name.split(" ")[0] || "there";

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-surface border-b border-border sticky top-0 z-30">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                            <Heart className="h-6 w-6 text-primary" strokeWidth={2} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">
                                How are you feeling today?
                            </h1>
                            <p className="text-sm text-muted">
                                Hello {firstName}, let&apos;s track your progress
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                <SymptomLogger symptoms={symptoms || []} />
            </main>
        </div>
    );
}
