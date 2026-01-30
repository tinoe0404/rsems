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
import { Heart, Mail, Lock } from "lucide-react";

export default function LoginPage() {
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
                // Check if user has completed onboarding
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", data.user.id)
                    .single();

                const profile = profileData as Profile | null;

                if (!profile?.treatment_start_date) {
                    router.push("/onboarding");
                } else {
                    router.push("/dashboard");
                }
                router.refresh();
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
                            label="Email Address"
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
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

                {/* Sign up link */}
                <p className="text-center mt-6 text-muted">
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
