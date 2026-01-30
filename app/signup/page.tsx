"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthError } from "@/components/auth/AuthError";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";
import { Heart, User, Mail, Lock, Check } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const supabase = createClient();

    // Password strength indicator
    const getPasswordStrength = (pwd: string) => {
        if (pwd.length === 0) return { strength: 0, label: "", color: "" };
        if (pwd.length < 6) return { strength: 1, label: "Weak", color: "bg-alert" };
        if (pwd.length < 10)
            return { strength: 2, label: "Fair", color: "bg-warning" };
        if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd))
            return { strength: 3, label: "Strong", color: "bg-success" };
        return { strength: 2, label: "Fair", color: "bg-warning" };
    };

    const passwordStrength = getPasswordStrength(password);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!fullName.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!agreedToTerms) {
            setError("Please agree to the terms and conditions.");
            return;
        }

        setIsLoading(true);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: "patient",
                    },
                },
            });

            if (signUpError) {
                if (signUpError.message.includes("already registered")) {
                    setError("This email is already registered. Try logging in instead.");
                } else if (signUpError.message.includes("Password")) {
                    setError("Password is too weak. Please choose a stronger password.");
                } else {
                    setError(signUpError.message);
                }
                setIsLoading(false);
                return;
            }

            if (data.user) {
                // Redirect to onboarding
                router.push("/onboarding");
                router.refresh();
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
                        <Heart className="h-8 w-8 text-primary" strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Join <span className="text-primary">RSEMS</span>
                    </h1>
                    <p className="text-muted mt-2">
                        Start monitoring your treatment journey
                    </p>
                </div>

                {/* Signup Card */}
                <Card padding="lg">
                    <form onSubmit={handleSignup} className="space-y-5">
                        <AuthError message={error} />

                        <Input
                            label="Full Name"
                            type="text"
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                            required
                            disabled={isLoading}
                            autoComplete="name"
                        />

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

                        <div>
                            <Input
                                label="Password"
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                                autoComplete="new-password"
                                helperText="At least 8 characters"
                            />
                            {/* Password Strength Indicator */}
                            {password && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                                style={{
                                                    width: `${(passwordStrength.strength / 3) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-muted">
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Input
                            label="Confirm Password"
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
                            error={
                                confirmPassword && password !== confirmPassword
                                    ? "Passwords do not match"
                                    : undefined
                            }
                        />

                        {/* Terms checkbox */}
                        <div className="flex items-start gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-1 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                                disabled={isLoading}
                            />
                            <label htmlFor="terms" className="text-sm text-muted cursor-pointer">
                                I agree to the{" "}
                                <Link
                                    href="/terms"
                                    className="text-primary hover:text-primary-dark font-medium"
                                    target="_blank"
                                >
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link
                                    href="/privacy"
                                    className="text-primary hover:text-primary-dark font-medium"
                                    target="_blank"
                                >
                                    Privacy Policy
                                </Link>
                            </label>
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
                                    <span className="ml-2">Creating account...</span>
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>
                </Card>

                {/* Sign in link */}
                <p className="text-center mt-6 text-muted">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-primary hover:text-primary-dark font-medium transition-colors"
                    >
                        Sign in
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
