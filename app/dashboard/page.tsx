import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type Profile } from "@/types/database.types";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get user profile
    const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    const profile = profileData as Profile | null;

    if (!profile?.treatment_start_date) {
        redirect("/onboarding");
    }

    // Calculate days since treatment start
    const daysSinceTreatment = profile.treatment_start_date
        ? Math.floor(
            (new Date().getTime() -
                new Date(profile.treatment_start_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        : 0;

    return (
        <DashboardClient
            profile={profile}
            email={user.email || ""}
            daysSinceTreatment={Math.max(0, daysSinceTreatment)}
        />
    );
}
