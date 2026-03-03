"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { type Profile } from "@/types/database.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthError } from "@/components/auth/AuthError";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";
import { lookupEmailByRegNumber } from "@/actions/lookupPatient";
import { Heart, Mail, Lock, Hash } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const supabase = createClient();

    const isEmail = (value: string) => value.includes("@");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            let loginEmail = identifier.trim();

            // If not an email, look up by registration number
            if (!isEmail(loginEmail)) {
                const { email, error: lookupError } =
                    await lookupEmailByRegNumber(loginEmail);
                if (lookupError || !email) {
                    setError(
                        lookupError ||
                        "Registration number not found. Please check and try again."
                    );
                    setIsLoading(false);
                    return;
                }
                loginEmail = email;
            }

            const { data, error: signInError } =
                await supabase.auth.signInWithPassword({
                    email: loginEmail,
                    password,
                });

            if (signInError) {
                if (signInError.message.includes("Invalid login credentials")) {
                    setError(
                        "Email/Registration Number or password is incorrect. Please try again."
                    );
                } else if (
                    signInError.message.includes("Email not confirmed")
                ) {
                    setError(
                        "Please verify your email address before logging in."
                    );
                } else {
                    setError(signInError.message);
                }
                setIsLoading(false);
                return;
            }

            if (data.user) {
                // Check if user has completed onboarding
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", data.user.id)
                    .single();

                const profile = profileData as Profile | null;

                if (profile?.role === "clinician") {
                    setError(
                        "Please use the Clinician Portal to login. You'll be redirected..."
                    );
                    setIsLoading(false);
                    await supabase.auth.signOut();
                    setTimeout(() => {
                        router.push("/admin/login");
                    }, 2000);
                    return;
                } else if (!profile?.treatment_start_date) {
                    router.push("/onboarding");
                    router.refresh();
                } else {
                    toast.success("Logged in successfully");
                    router.push("/dashboard");
                    router.refresh();
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
                    <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
                        <Heart className="h-8 w-8 text-primary" strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Welcome Back
                    </h1>
                    <p className="text-muted mt-2">
                        Sign in to continue your treatment journey
                    </p>
                </div>

                {/* Login Card */}
                <Card padding="lg">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <AuthError message={error} />

                        <Input
                            label="Email or Registration Number"
                            type="text"
                            id="identifier"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="you@example.com or RSEMS-1001"
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

                        <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                                />
                                <span className="text-muted">Remember me</span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-primary hover:text-primary-dark font-medium transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
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

                {/* Helper text about reg number */}
                <div className="mt-4 p-3 bg-surface rounded-lg border border-border">
                    <p className="text-xs text-muted text-center">
                        <Hash className="inline h-3 w-3 mr-1" />
                        Your Registration Number (e.g. <strong>RSEMS-1001</strong>) was provided when you signed up.
                    </p>
                </div>

                {/* Sign up link */}
                <p className="text-center mt-6 text-sm sm:text-base text-muted">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="text-primary hover:text-primary-dark font-medium transition-colors"
                    >
                        Sign up
                    </Link>
                </p>

                {/* Back to home */}
                <div className="text-center mt-4">
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
