"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    Clock,
    ArrowRight,
    CalendarPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScheduleModal } from "@/components/admin/ScheduleModal";

interface PatientLogInfo {
    log_id: string;
    user_id: string;
    full_name: string;
    cancer_type: string;
    log_date: string;
    created_at: string;
    calculated_risk_score: number;
    requires_action: boolean;
    symptom_count: number;
}

interface RealtimePatientListProps {
    initialPatients: PatientLogInfo[];
}

export function RealtimePatientList({ initialPatients }: RealtimePatientListProps) {
    const [patients, setPatients] = useState<PatientLogInfo[]>(initialPatients);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<{ id: string, name: string } | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Sync initial state if props change (unlikely in this flow but good practice)
        setPatients(initialPatients);
    }, [initialPatients]);

    useEffect(() => {
        // Set up real-time subscription
        const channel = supabase
            .channel('realtime_logs_global')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'daily_logs'
            }, async (payload) => {
                const newLog = payload.new as any;

                // Fetch profile info for the new log
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, cancer_type')
                    .eq('id', newLog.user_id)
                    .single();

                const profile = profileData as any;

                if (profile) {
                    const newEntry: PatientLogInfo = {
                        log_id: newLog.id,
                        user_id: newLog.user_id,
                        full_name: profile.full_name,
                        cancer_type: profile.cancer_type,
                        log_date: newLog.log_date,
                        created_at: newLog.created_at,
                        calculated_risk_score: newLog.calculated_risk_score,
                        requires_action: newLog.requires_action,
                        symptom_count: Array.isArray(newLog.symptoms_entry) ? newLog.symptoms_entry.length : 0
                    };

                    // Prepend to list
                    setPatients(prev => {
                        // Filter out if duplicate exists (rare but possible w/ quick updates)
                        const filtered = prev.filter(p => p.log_id !== newEntry.log_id && p.user_id !== newEntry.user_id);
                        // Sort logic will be applied: Critical first.
                        // But for "Alert" feel, putting it top is good.
                        // However, let's respect the Risk Sort logic.
                        const updated = [newEntry, ...filtered].sort((a, b) => {
                            if (b.calculated_risk_score !== a.calculated_risk_score) {
                                return b.calculated_risk_score - a.calculated_risk_score;
                            }
                            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                        });
                        return updated;
                    });

                    // CRITICAL ALERT
                    if (newEntry.calculated_risk_score >= 3) {
                        // Play sound (placeholder)
                        playSound();

                        toast.error("CRITICAL ALERT", {
                            description: `Severe symptoms reported by ${profile.full_name}.`,
                            duration: 10000, // 10 seconds
                            action: {
                                label: "Review",
                                onClick: () => console.log("Review clicked")
                            },
                            className: "bg-red-50 border-alert text-alert-dark",
                        });
                    } else if (newEntry.calculated_risk_score === 2) {
                        toast.warning("New Monitor Log", {
                            description: `${profile.full_name} reported moderate symptoms.`,
                            duration: 5000,
                        });
                    } else {
                        toast.success("New Log Received", {
                            description: `${profile.full_name} is stable.`,
                        });
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const playSound = () => {
        // Placeholder for sound effect
        // const audio = new Audio('/sounds/alert.mp3');
        // audio.play().catch(e => console.log("Audio play failed", e));
        console.log("Playing alert sound...");
    };

    const handleReviewClick = (patient: PatientLogInfo) => {
        setSelectedPatient({ id: patient.user_id, name: patient.full_name });
        setScheduleModalOpen(true);
    };

    const getTimeAgo = (dateStr: string) => {
        const diff = new Date().getTime() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);

        if (mins < 1) return `Just now`;
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">Patient</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Diagnosis</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Last Update</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {patients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No logs found for today.
                                    </td>
                                </tr>
                            ) : (
                                patients.map((patient) => (
                                    <tr
                                        key={patient.log_id}
                                        className={cn(
                                            "group transition-all duration-500 hover:bg-gray-50 animate-in fade-in slide-in-from-top-2",
                                            patient.calculated_risk_score >= 3 ? "bg-red-50/50 hover:bg-red-50 border-l-4 border-l-alert" : ""
                                        )}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {patient.calculated_risk_score >= 3 && (
                                                    <div className="h-2 w-2 rounded-full bg-alert animate-pulse" />
                                                )}
                                                <span className="font-bold text-gray-900">{patient.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {patient.cancer_type}
                                        </td>
                                        <td className="px-6 py-4">
                                            {patient.calculated_risk_score >= 3 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-alert text-white shadow-sm">
                                                    CRITICAL
                                                </span>
                                            ) : patient.calculated_risk_score === 2 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning text-white border border-warning-dark/20">
                                                    MONITOR
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-success text-white">
                                                    STABLE
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            {getTimeAgo(patient.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleReviewClick(patient)}
                                                className="text-primary hover:text-primary-dark hover:bg-primary/10"
                                            >
                                                Review
                                                <ArrowRight className="ml-1 h-3 w-3" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ScheduleModal
                isOpen={scheduleModalOpen}
                onClose={() => setScheduleModalOpen(false)}
                patientId={selectedPatient?.id || null}
                patientName={selectedPatient?.name || null}
            />
        </>
    );
}
