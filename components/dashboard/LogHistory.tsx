"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type DailyLog, type SymptomEntry } from "@/types/database.types";
import { format } from "date-fns";
import {
    Calendar,
    ChevronRight,
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    Activity,
    Loader2
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function LogHistory() {
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const supabase = createClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch logs
            const { data, error } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('log_date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            setLogs(data || []);
        } catch (err: any) {
            console.error("Error fetching logs:", err);
            setError("Failed to load history");
        } finally {
            setIsLoading(false);
        }
    };

    const getSeverityBadge = (score: number) => {
        if (score >= 3) return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertTriangle className="w-3 h-3 mr-1" /> Severe
            </span>
        );
        if (score === 2) return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-3 h-3 mr-1" /> Moderate
            </span>
        );
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" /> Stable
            </span>
        );
    };

    const summarySeverityIndicator = (severity: number) => {
        if (severity >= 3) return <span className="ml-1 w-2 h-2 rounded-full bg-red-500 inline-block" />;
        if (severity === 2) return <span className="ml-1 w-2 h-2 rounded-full bg-yellow-500 inline-block" />;
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-6 text-red-500 bg-red-50 rounded-lg">
                <p>{error}</p>
                <Button variant="ghost" size="sm" onClick={fetchLogs} className="mt-2 text-red-600 hover:bg-red-100">
                    Try Again
                </Button>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900">No Logs Found</h3>
                <p className="text-sm text-gray-500 mt-1">You haven&apos;t submitted any symptom logs yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => (
                <div
                    key={log.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-border bg-surface hover:shadow-sm transition-shadow"
                >
                    {/* Date Box */}
                    <div className="flex-shrink-0 flex sm:flex-col items-center justify-center p-3 bg-primary/5 rounded-lg text-center min-w-[80px]">
                        <span className="text-xs font-bold text-primary uppercase">
                            {format(new Date(log.log_date), "MMM")}
                        </span>
                        <span className="text-2xl font-bold text-gray-900 mx-2 sm:mx-0">
                            {format(new Date(log.log_date), "d")}
                        </span>
                        <span className="text-xs text-gray-500">
                            {format(new Date(log.log_date), "EEE")}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    Daily Check-in
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {format(new Date(log.created_at), "h:mm a")}
                                </p>
                            </div>
                            {getSeverityBadge(log.calculated_risk_score)}
                        </div>

                        {/* Symptoms List */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {log.symptoms_entry?.length > 0 ? (
                                log.symptoms_entry.map((sym: SymptomEntry, i: number) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200"
                                    >
                                        {sym.symptom_name}
                                        {summarySeverityIndicator(sym.severity)}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500 italic">No symptoms reported</span>
                            )}
                        </div>

                        {/* Notes */}
                        {log.additional_notes && (
                            <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 border border-gray-100 italic">
                                "{log.additional_notes}"
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
