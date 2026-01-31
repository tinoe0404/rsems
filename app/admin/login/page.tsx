"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { type Profile } from "@/types/database.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthError } from "@/components/auth/AuthError";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";
import { ShieldAlert, Users } from "lucide-react";

export default function ClinicianLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                if (signInError.message.includes("Invalid login credentials")) {
                    setError("Email or password is incorrect. Please try again.");
                } else if (signInError.message.includes("Email not confirmed")) {
                    setError("Please verify your email address before logging in.");
                } else {
                    setError(signInError.message);
                }
                setIsLoading(false);
                return;
            }

            if (data.user) {
                // Check user role
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", data.user.id)
                    .single();

                const profile = profileData as Profile | null;

                if (profile?.role === "clinician") {
                    router.push("/admin/dashboard");
                    router.refresh();
                } else {
                    // Patient trying to login to clinician portal
                    setError("This portal is for clinicians only. Please use the patient login page.");
                    // Sign them out since they're in the wrong portal
                    await supabase.auth.signOut();
                    setIsLoading(false);
                    return;
                }
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center rounded-full bg-[#00695C]/10 p-3 mb-4">
                        <ShieldAlert className="h-8 w-8 text-[#00695C]" strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Clinician Portal
                    </h1>
                    <p className="text-muted mt-2">
                        Sign in to access patient records and triage
                    </p>
                </div>

                {/* Login Card */}
                <Card padding="lg">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <AuthError message={error} />

                        <Input
                            label="Email Address"
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="clinician@rsems.health"
                            required
                            disabled={isLoading}
                            autoComplete="email"
                        />

                        <Input
                            label="Password"
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                        />

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                                />
                                <span className="text-muted">Remember me</span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-[#00695C] hover:text-[#004d40] font-medium transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full bg-[#00695C] hover:bg-[#004d40]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <LoadingSpinner size="sm" />
                                    <span className="ml-2">Signing in...</span>
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>
                </Card>

                {/* Back to home */}
                <div className="text-center mt-6">
                    <Link
                        href="/"
                        className="text-sm text-muted hover:text-foreground transition-colors"
                    >
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
