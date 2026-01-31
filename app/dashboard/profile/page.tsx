"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Profile } from "@/types/database.types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader2, User, Phone, Calendar, Activity, Mail, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const router = useRouter();

    // Form states
    const [phoneNumber, setPhoneNumber] = useState("");
    const [cancerType, setCancerType] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setIsLoading(true);
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push("/login");
            return;
        }

        setUserEmail(user.email || "");

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error("Error fetching profile:", error);
            toast.error("Failed to load profile");
        } else if (data) {
            setProfile(data);
            setPhoneNumber(data.phone_number || "");
            setCancerType(data.cancer_type || "");
        }

        setIsLoading(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        setIsSaving(true);
        const supabase = createClient();

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    phone_number: phoneNumber,
                    cancer_type: cancerType
                })
                .eq('id', profile.id);

            if (error) throw error;

            toast.success("Profile updated successfully");
            router.refresh(); // Refresh server components
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) return null;

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
                        <div>
                            <h1 className="text-xl font-bold text-foreground">
                                My Profile
                            </h1>
                            <p className="text-sm text-muted">
                                Personal Information
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <form onSubmit={handleUpdate} className="space-y-6">
                    {/* Basic Info Card (Read Only) */}
                    <Card padding="lg">
                        <h3 className="font-semibold text-lg mb-6 flex items-center gap-2 text-foreground">
                            <User className="h-5 w-5 text-primary" />
                            Account Details
                        </h3>

                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-muted">Full Name</label>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-900 font-medium">
                                    {profile.full_name}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-muted">Email Address</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-900">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    {userEmail}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-muted">Treatment Start Date</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-900">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    {profile.treatment_start_date
                                        ? format(new Date(profile.treatment_start_date), "MMMM d, yyyy")
                                        : "Not set"}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Editable Info Card */}
                    <Card padding="lg">
                        <h3 className="font-semibold text-lg mb-6 flex items-center gap-2 text-foreground">
                            <Activity className="h-5 w-5 text-primary" />
                            Update Information
                        </h3>

                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-foreground">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="+263..."
                                        className="w-full pl-9 h-11 rounded-lg border border-input bg-surface text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-foreground">Cancer Provision / Type</label>
                                <div className="relative">
                                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="text"
                                        value={cancerType}
                                        onChange={(e) => setCancerType(e.target.value)}
                                        className="w-full pl-9 h-11 rounded-lg border border-input bg-surface text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <p className="text-xs text-muted">Updating this helps clinicians track your specific condition.</p>
                            </div>

                            <div className="pt-4">
                                <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </form>
            </main>
        </div>
    );
}
