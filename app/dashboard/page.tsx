import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type Profile } from "@/types/database.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Heart, LogOut, Calendar, FileText, User } from "lucide-react";

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

    const handleSignOut = async () => {
        "use server";
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect("/login");
    };

    // Calculate days since treatment start
    const daysSinceTreatment = profile.treatment_start_date
        ? Math.floor(
            (new Date().getTime() -
                new Date(profile.treatment_start_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        : 0;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-surface border-b border-border">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-primary/10 p-2">
                                <Heart className="h-6 w-6 text-primary" strokeWidth={2} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">
                                    <span className="text-primary">RSEMS</span> Dashboard
                                </h1>
                                <p className="text-sm text-muted">
                                    Welcome back, {profile.full_name}
                                </p>
                            </div>
                        </div>
                        <form action={handleSignOut}>
                            <Button variant="outline" size="md" type="submit">
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Card */}
                <Card padding="lg" className="mb-8">
                    <div className="flex items-start gap-4">
                        <div className="rounded-full bg-success/10 p-3">
                            <User className="h-8 w-8 text-success" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Welcome to your treatment dashboard, {profile.full_name.split(" ")[0]}! 👋
                            </h2>
                            <p className="text-muted mb-4">
                                You&apos;ve successfully set up your RSEMS account. This is where
                                you&apos;ll track your symptoms, view appointments, and
                                communicate with your healthcare team.
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="text-muted">
                                        Treatment started:{" "}
                                        <span className="font-medium text-foreground">
                                            {new Date(
                                                profile.treatment_start_date
                                            ).toLocaleDateString()}
                                        </span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span className="text-muted">
                                        Days in treatment:{" "}
                                        <span className="font-medium text-foreground">
                                            {daysSinceTreatment}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card hover padding="lg" className="text-center">
                        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4">
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Log Symptoms
                        </h3>
                        <p className="text-sm text-muted mb-4">
                            Track how you&apos;re feeling today
                        </p>
                        <Button variant="primary" size="md" className="w-full" disabled>
                            Coming Soon
                        </Button>
                    </Card>

                    <Card hover padding="lg" className="text-center">
                        <div className="inline-flex items-center justify-center rounded-full bg-info/10 p-4 mb-4">
                            <Calendar className="h-8 w-8 text-info" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Appointments
                        </h3>
                        <p className="text-sm text-muted mb-4">
                            View and manage your appointments
                        </p>
                        <Button variant="outline" size="md" className="w-full" disabled>
                            Coming Soon
                        </Button>
                    </Card>

                    <Card hover padding="lg" className="text-center">
                        <div className="inline-flex items-center justify-center rounded-full bg-success/10 p-4 mb-4">
                            <User className="h-8 w-8 text-success" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            My Profile
                        </h3>
                        <p className="text-sm text-muted mb-4">
                            Update your personal information
                        </p>
                        <Button variant="outline" size="md" className="w-full" disabled>
                            Coming Soon
                        </Button>
                    </Card>
                </div>

                {/* Info Section */}
                <Card padding="lg">
                    <div className="rounded-lg bg-primary/10 border border-primary/20 p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            🎉 Authentication System Complete!
                        </h3>
                        <p className="text-muted mb-4">
                            Your RSEMS account is now fully set up and secured. The
                            authentication and onboarding flow is working perfectly!
                        </p>
                        <div className="space-y-2 text-sm text-muted">
                            <p>✅ Secure login and registration</p>
                            <p>✅ Profile creation and management</p>
                            <p>✅ Protected routes with middleware</p>
                            <p>✅ Supabase authentication integrated</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-primary/20">
                            <p className="text-sm font-medium text-foreground">
                                Next Phase: Symptom Logging
                            </p>
                            <p className="text-sm text-muted mt-1">
                                We&apos;ll build the symptom tracking feature where you can log
                                your daily side effects and risk scores will be automatically
                                calculated.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Profile Details */}
                <Card padding="lg" className="mt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                        Your Profile
                    </h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-muted font-medium">Full Name</dt>
                            <dd className="text-foreground mt-1">{profile.full_name}</dd>
                        </div>
                        <div>
                            <dt className="text-muted font-medium">Email</dt>
                            <dd className="text-foreground mt-1">{user.email}</dd>
                        </div>
                        <div>
                            <dt className="text-muted font-medium">Cancer Type</dt>
                            <dd className="text-foreground mt-1">{profile.cancer_type}</dd>
                        </div>
                        <div>
                            <dt className="text-muted font-medium">Phone Number</dt>
                            <dd className="text-foreground mt-1">
                                {profile.phone_number || "Not provided"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted font-medium">Role</dt>
                            <dd className="text-foreground mt-1 capitalize">
                                {profile.role}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted font-medium">Account Created</dt>
                            <dd className="text-foreground mt-1">
                                {new Date(profile.created_at).toLocaleDateString()}
                            </dd>
                        </div>
                    </dl>
                </Card>
            </main>

            {/* Footer */}
            <footer className="border-t border-border mt-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-sm text-muted">
                        Made with care for cancer patients in Zimbabwe 🇿🇼
                    </p>
                </div>
            </footer>
        </div>
    );
}
