"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Profile, type ProfileUpdate } from "@/types/database.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthError } from "@/components/auth/AuthError";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";
import { Heart, Calendar, Phone, CheckCircle } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [cancerType, setCancerType] = useState("Cervical Cancer");
    const [treatmentStartDate, setTreatmentStartDate] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Get profile data
            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            const profile = profileData as Profile | null;

            if (profile) {
                setFullName(profile.full_name || "");
                setCancerType(profile.cancer_type || "Cervical Cancer");
                setTreatmentStartDate(profile.treatment_start_date || "");
                setPhoneNumber(profile.phone_number || "");

                // If already completed onboarding, redirect to dashboard
                if (profile.treatment_start_date) {
                    router.push("/dashboard");
                }
            }
        } catch (err) {
            console.error("Error loading user data:", err);
            setError("Failed to load your profile. Please try again.");
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!treatmentStartDate) {
            setError("Please select your treatment start date.");
            return;
        }

        setIsLoading(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setError("You must be logged in to complete onboarding.");
                setIsLoading(false);
                return;
            }

            const updateData: ProfileUpdate = {
                full_name: fullName,
                cancer_type: cancerType,
                treatment_start_date: treatmentStartDate,
                phone_number: phoneNumber || null,
            };

            const { error: updateError } = await (supabase
                .from("profiles") as any)
                .update(updateData)
                .eq("id", user.id);

            if (updateError) {
                setError(updateError.message);
                setIsLoading(false);
                return;
            }

            // Success! Redirect to dashboard
            router.push("/dashboard");
            router.refresh();
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-muted">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
                        <Heart className="h-8 w-8 text-primary" strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Welcome to <span className="text-primary">RSEMS</span>
                    </h1>
                    <p className="text-lg text-muted">
                        Let&apos;s set up your profile to personalize your care
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                                1
                            </div>
                            <span className="text-sm font-medium text-primary">
                                Profile Setup
                            </span>
                        </div>
                        <div className="w-12 h-0.5 bg-border mx-2" />
                        <div className="flex items-center gap-2 opacity-40">
                            <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-sm font-semibold text-muted">
                                2
                            </div>
                            <span className="text-sm font-medium text-muted">Dashboard</span>
                        </div>
                    </div>
                </div>

                {/* Onboarding Card */}
                <Card padding="lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AuthError message={error} />

                        {/* Info box */}
                        <div className="rounded-lg bg-info/10 border border-info/20 p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Why we need this information
                                    </p>
                                    <p className="text-sm text-muted mt-1">
                                        This helps us personalize your experience and ensure your
                                        healthcare team has the information they need to support
                                        your treatment journey.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Input
                            label="Full Name"
                            type="text"
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            required
                            disabled={isLoading}
                            autoComplete="name"
                        />

                        <div>
                            <label
                                htmlFor="cancerType"
                                className="block text-sm font-medium text-foreground mb-2"
                            >
                                Cancer Type
                                <span className="text-muted ml-2 font-normal">(MVP default)</span>
                            </label>
                            <div className="w-full h-11 min-h-[44px] px-4 rounded-lg border border-border bg-muted/20 text-muted flex items-center text-base md:text-sm">
                                {cancerType}
                            </div>
                            <p className="mt-1.5 text-sm text-muted">
                                Additional cancer types will be available in future updates
                            </p>
                        </div>

                        <Input
                            label="Treatment Start Date"
                            type="date"
                            id="treatmentStartDate"
                            value={treatmentStartDate}
                            onChange={(e) => setTreatmentStartDate(e.target.value)}
                            required
                            disabled={isLoading}
                            max={new Date().toISOString().split("T")[0]}
                            helperText="When did you start radiotherapy treatment?"
                        />

                        <Input
                            label="Phone Number"
                            type="tel"
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+263 XX XXX XXXX"
                            disabled={isLoading}
                            autoComplete="tel"
                            helperText="Optional - for emergency contact purposes"
                        />

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="w-1/3"
                                onClick={() => router.push("/login")}
                                disabled={isLoading}
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="w-2/3"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner size="sm" />
                                        <span className="ml-2">Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        Complete Setup
                                        <CheckCircle className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Encouragement message */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-muted">
                        🌟 You&apos;re taking an important step in managing your health journey
                    </p>
                </div>
            </div>
        </div>
    );
}
