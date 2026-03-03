"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthError } from "@/components/auth/AuthError";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";
import { getRegistrationNumber } from "@/actions/lookupPatient";
import { Heart, User, Mail, Lock, Check, Copy, CheckCircle } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Success state
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [regNumber, setRegNumber] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

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

    const handleCopyRegNumber = async () => {
        if (regNumber) {
            await navigator.clipboard.writeText(regNumber);
            toast.success("Registration number copied to clipboard");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

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
                    emailRedirectTo: `${window.location.origin}/onboarding`,
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
                // Fetch the auto-generated registration number
                // Small delay to allow the DB trigger to execute
                await new Promise((resolve) => setTimeout(resolve, 1000));

                const { registrationNumber } = await getRegistrationNumber(
                    data.user.id
                );

                setRegNumber(registrationNumber);
                toast.success("Account created successfully!");
                setRegistrationComplete(true);
            }
        } catch (err: any) {
            console.error("Signup Catch Error:", err);
            setError(`Unexpected error: ${err?.message || String(err)}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Success Screen
    if (registrationComplete) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center rounded-full bg-success/10 p-3 mb-4">
                            <CheckCircle className="h-8 w-8 text-success" strokeWidth={2} />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Registration Complete!
                        </h1>
                        <p className="text-muted mt-2">
                            Your account has been created successfully
                        </p>
                    </div>

                    <Card padding="lg" className="space-y-6">
                        {/* Registration Number Display */}
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted mb-2">
                                Your Registration Number
                            </p>
                            <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4 flex items-center justify-center gap-3">
                                <span className="text-2xl sm:text-3xl font-bold text-primary tracking-wider">
                                    {regNumber || "Loading..."}
                                </span>
                                {regNumber && (
                                    <button
                                        onClick={handleCopyRegNumber}
                                        className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? (
                                            <Check className="h-5 w-5 text-success" />
                                        ) : (
                                            <Copy className="h-5 w-5 text-primary" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Important Notice */}
                        <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                            <p className="text-sm text-foreground font-medium mb-1">
                                ⚠️ Important — Save this number!
                            </p>
                            <p className="text-xs text-muted">
                                You can use this registration number to log in instead of your email.
                                Please save it somewhere safe.
                            </p>
                        </div>

                        {/* What's next */}
                        <div className="space-y-2 text-sm text-muted">
                            <p className="font-medium text-foreground">What&apos;s next?</p>
                            <ul className="space-y-1">
                                <li className="flex items-start gap-2">
                                    <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span>Check your email to verify your account</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span>Log in with your email or registration number</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span>Complete your treatment profile</span>
                                </li>
                            </ul>
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={() => {
                                router.push("/login");
                            }}
                        >
                            Continue to Login
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    // Registration Form
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

                        {/* Info about reg number */}
                        <div className="bg-info/5 border border-info/20 rounded-lg p-3">
                            <p className="text-xs text-muted">
                                📋 A unique <strong>Registration Number</strong> will be generated for you upon signup. You can use it to log in.
                            </p>
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
