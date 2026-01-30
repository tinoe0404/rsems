"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "lucide-react"; // Wait, Badge is not in lucide-react efficiently
import {
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    Clock,
    ArrowRight,
    Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Profile } from "@/types/database.types";
import { Button } from "@/components/ui/Button";

// Initial type definition since complex join types are hard to infer perfectly
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

export default function ClinicianDashboard() {
    const [patients, setPatients] = useState<PatientLogInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchPatientLogs();

        // Set up real-time subscription for immediate updates
        const channel = supabase
            .channel('realtime_logs')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'daily_logs'
            }, (payload) => {
                // Refresh list on new log
                fetchPatientLogs();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchPatientLogs = async () => {
        try {
            // 1. Fetch latest logs
            // Note: In a real production app with thousands of logs, we'd use a SQL View or RPC
            // For MVP, we fetch recent logs and deduplicate in JS to get the LATEST per user.
            const { data: logsData, error } = await supabase
                .from('daily_logs')
                .select(`
          id,
          user_id,
          log_date,
          created_at,
          calculated_risk_score,
          requires_action,
          symptoms_entry
        `)
                .order('created_at', { ascending: false })
                .limit(100);

            const logs = logsData as any[];

            if (error) throw error;

            if (!logs) {
                setPatients([]);
                return;
            }

            // 2. Get unique user IDs to fetch profiles
            const userIds = Array.from(new Set(logs.map(log => log.user_id)));

            const { data: profilesData, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, cancer_type')
                .in('id', userIds);

            if (profileError) throw profileError;

            const profiles = profilesData as any[];

            // Map profiles for quick access
            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            // 3. Aggregate Data (Latest log per user)
            const latestLogsMap = new Map();

            logs.forEach(log => {
                if (!latestLogsMap.has(log.user_id)) {
                    const profile = profileMap.get(log.user_id);
                    if (profile) {
                        latestLogsMap.set(log.user_id, {
                            log_id: log.id,
                            user_id: log.user_id,
                            full_name: profile.full_name,
                            cancer_type: profile.cancer_type,
                            log_date: log.log_date,
                            created_at: log.created_at,
                            calculated_risk_score: log.calculated_risk_score,
                            requires_action: log.requires_action,
                            symptom_count: Array.isArray(log.symptoms_entry) ? log.symptoms_entry.length : 0
                        });
                    }
                }
            });

            const processedPatients = Array.from(latestLogsMap.values());

            // 4. SORT by Risk (Desc) then Time (Desc)
            processedPatients.sort((a, b) => {
                if (b.calculated_risk_score !== a.calculated_risk_score) {
                    return b.calculated_risk_score - a.calculated_risk_score;
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            setPatients(processedPatients);

        } catch (err) {
            console.error("Error fetching triage data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const diff = new Date().getTime() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);

        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    const highRiskCount = patients.filter(p => p.calculated_risk_score >= 3).length;
    const moderateRiskCount = patients.filter(p => p.calculated_risk_score === 2).length;

    return (
        <div className="space-y-8">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Triage Board</h1>
                    <p className="text-gray-500 text-sm">Real-time patient monitoring</p>
                </div>

                <div className="flex gap-4">
                    <Card padding="md" className="flex items-center gap-3 min-w-[140px] bg-white border-l-4 border-l-alert">
                        <div>
                            <p className="text-xs text-muted font-bold uppercase">Critical</p>
                            <p className="text-2xl font-bold text-alert">{highRiskCount}</p>
                        </div>
                        <AlertTriangle className="h-6 w-6 text-alert/50" />
                    </Card>

                    <Card padding="md" className="flex items-center gap-3 min-w-[140px] bg-white border-l-4 border-l-warning">
                        <div>
                            <p className="text-xs text-muted font-bold uppercase">Monitor</p>
                            <p className="text-2xl font-bold text-warning-dark">{moderateRiskCount}</p>
                        </div>
                        <AlertCircle className="h-6 w-6 text-warning/50" />
                    </Card>

                    <Card padding="md" className="flex items-center gap-3 min-w-[140px] bg-white border-l-4 border-l-primary">
                        <div>
                            <p className="text-xs text-muted font-bold uppercase">Total</p>
                            <p className="text-2xl font-bold text-primary">{patients.length}</p>
                        </div>
                        <Filter className="h-6 w-6 text-primary/50" />
                    </Card>
                </div>
            </div>

            {/* Patient List */}
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
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Loading data...
                                    </td>
                                </tr>
                            ) : patients.length === 0 ? (
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
                                            "group transition-colors hover:bg-gray-50",
                                            patient.calculated_risk_score >= 3 ? "bg-red-50/50 hover:bg-red-50" : ""
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
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-alert text-white">
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
                                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark hover:bg-primary/10">
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
        </div>
    );
}
