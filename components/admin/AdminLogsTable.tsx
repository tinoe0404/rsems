"use client";

import { useState } from "react";
import { format } from "date-fns";
import { type DailyLog } from "@/types/database.types";
import {
    Search,
    Calendar,
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    Clock,
    ChevronRight,
    User,
    CalendarPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScheduleModal } from "@/components/admin/ScheduleModal";

// Define the joined type locally or import if available
interface LogWithProfile extends DailyLog {
    profiles: {
        full_name: string;
        phone_number: string | null;
        cancer_type: string | null;
    } | null; // Use singular 'profiles' as Supabase returns it, or map it
}

interface AdminLogsTableProps {
    logs: any[]; // Using any initially to handle Supabase join shape, will cast inside
}

export function AdminLogsTable({ logs: initialLogs }: AdminLogsTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPatientForSchedule, setSelectedPatientForSchedule] = useState<{ id: string, name: string } | null>(null);

    // Filter logs
    const filteredLogs = initialLogs.filter(log => {
        const patientName = log.profiles?.full_name?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return patientName.includes(query);
    });

    const getSeverityBadge = (score: number) => {
        if (score >= 3) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> Critical</span>;
        if (score === 2) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" /> Moderate</span>;
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Stable</span>;
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by patient name..."
                        className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500 flex-shrink-0">
                    Showing {filteredLogs.length} logs
                </div>
            </div>

            {/* Desktop Logs Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Date Logged</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Patient</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Symptoms</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No logs found.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="h-4 w-4" />
                                                <span className="font-medium">
                                                    {format(new Date(log.created_at || log.log_date), "MMM d, yyyy")}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 pl-6 mt-1">
                                                {format(new Date(log.created_at || log.log_date), "h:mm a")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {log.profiles?.full_name?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{log.profiles?.full_name || "Unknown"}</p>
                                                    {log.profiles?.phone_number && (
                                                        <p className="text-xs text-gray-500">{log.profiles.phone_number}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getSeverityBadge(log.calculated_risk_score)}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="flex flex-wrap gap-1">
                                                {log.symptoms_entry?.slice(0, 3).map((sym: any, i: number) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200">
                                                        {sym.symptom_name}
                                                        {summarySeverityIndicator(sym.severity)}
                                                    </span>
                                                ))}
                                                {(log.symptoms_entry?.length || 0) > 3 && (
                                                    <span className="text-xs text-gray-500 self-center">
                                                        +{log.symptoms_entry.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                            {log.additional_notes && <p className="text-xs text-gray-400 mt-1 truncate">"{log.additional_notes}"</p>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedPatientForSchedule({
                                                    id: log.user_id,
                                                    name: log.profiles?.full_name || "Patient"
                                                })}
                                                className="text-primary border-primary/20 hover:bg-primary/5"
                                            >
                                                <CalendarPlus className="h-4 w-4 mr-2" />
                                                Schedule
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredLogs.length === 0 ? (
                    <Card padding="lg" className="text-center text-gray-500">
                        No logs found.
                    </Card>
                ) : (
                    filteredLogs.map((log) => (
                        <Card
                            key={log.id}
                            padding="md"
                            className={cn(
                                "flex flex-col gap-3",
                                log.calculated_risk_score >= 3 && "border-l-4 border-l-red-500 bg-red-50/30"
                            )}
                        >
                            {/* Row 1: Patient + Status */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                        {log.profiles?.full_name?.charAt(0) || "?"}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate text-base">
                                            {log.profiles?.full_name || "Unknown"}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {log.profiles?.phone_number || "No phone"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    {getSeverityBadge(log.calculated_risk_score)}
                                </div>
                            </div>

                            {/* Row 2: Details */}
                            <div className="space-y-2.5">
                                {/* Date */}
                                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                                    <div className="w-5 flex justify-center">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <span>
                                        {format(new Date(log.created_at || log.log_date), "MMM d, yyyy")}
                                        <span className="text-gray-400 ml-1">
                                            at {format(new Date(log.created_at || log.log_date), "h:mm a")}
                                        </span>
                                    </span>
                                </div>

                                {/* Symptoms */}
                                <div className="flex items-start gap-2.5 text-sm">
                                    <div className="w-5 flex justify-center mt-0.5">
                                        <AlertCircle className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                                        {log.symptoms_entry?.slice(0, 4).map((sym: any, i: number) => (
                                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200">
                                                {sym.symptom_name}
                                                {summarySeverityIndicator(sym.severity)}
                                            </span>
                                        ))}
                                        {(log.symptoms_entry?.length || 0) > 4 && (
                                            <span className="text-xs text-gray-500 self-center">
                                                +{log.symptoms_entry.length - 4} more
                                            </span>
                                        )}
                                        {(!log.symptoms_entry || log.symptoms_entry.length === 0) && (
                                            <span className="text-xs text-gray-400 italic">No symptoms reported</span>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                {log.additional_notes && (
                                    <div className="flex items-start gap-2.5 text-sm">
                                        <div className="w-5 flex justify-center mt-0.5">
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <p className="text-xs text-gray-500 italic truncate flex-1">
                                            &quot;{log.additional_notes}&quot;
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Row 3: Action */}
                            <div className="pt-3 border-t border-gray-100">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedPatientForSchedule({
                                        id: log.user_id,
                                        name: log.profiles?.full_name || "Patient"
                                    })}
                                    className="w-full justify-center text-primary border-primary/20 hover:bg-primary/5"
                                >
                                    <CalendarPlus className="h-4 w-4 mr-2" />
                                    Schedule Appointment
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Schedule Modal */}
            <ScheduleModal
                isOpen={!!selectedPatientForSchedule}
                onClose={() => setSelectedPatientForSchedule(null)}
                patientId={selectedPatientForSchedule?.id || null}
                patientName={selectedPatientForSchedule?.name || null}
            />
        </div>
    );
}

function summarySeverityIndicator(severity: number) {
    if (severity >= 3) return <span className="ml-1 w-2 h-2 rounded-full bg-red-500 inline-block" />;
    if (severity === 2) return <span className="ml-1 w-2 h-2 rounded-full bg-yellow-500 inline-block" />;
    return null;
}
