"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { type SymptomMaster } from "@/types/database.types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
    Search,
    AlertCircle,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    Send,
    Droplets,
    Thermometer,
    Heart,
    Zap,
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitDailyLog, type LogSubmissionResult } from "@/actions/submitLog";

interface SymptomLoggerProps {
    symptoms: SymptomMaster[];
}

type Step = 'select' | 'success';

// Icon mapping by category
const getCategoryIcon = (category: string) => {
    switch (category) {
        case "General":
            return Thermometer;
        case "Nausea/Vomiting":
            return Droplets;
        case "Toilet/Bowel":
            return Droplets;
        case "Toilet/Urinary":
            return Droplets;
        case "Vaginal/Pelvic":
            return Heart;
        case "Skin":
            return Shield;
        case "Pain":
            return Zap;
        default:
            return AlertCircle;
    }
};

// Severity styling and labels
const getSeverityConfig = (severity: number) => {
    switch (severity) {
        case 1:
            return {
                label: "Mild",
                sublabel: "Normal / Tolerable",
                badgeColor: "bg-success/10 text-success-dark border-success/30",
                cardBorder: "border-success/20 hover:border-success/40",
                headerBg: "bg-success/5",
                headerText: "text-success-dark",
                headerIcon: CheckCircle,
                dotColor: "bg-success",
            };
        case 2:
            return {
                label: "Moderate",
                sublabel: "Needs Monitoring",
                badgeColor: "bg-warning/10 text-warning-dark border-warning/30",
                cardBorder: "border-warning/20 hover:border-warning/40",
                headerBg: "bg-warning/5",
                headerText: "text-warning-dark",
                headerIcon: AlertCircle,
                dotColor: "bg-warning",
            };
        case 3:
            return {
                label: "Severe",
                sublabel: "Requires Immediate Attention",
                badgeColor: "bg-alert/10 text-alert border-alert/30",
                cardBorder: "border-alert/20 hover:border-alert/40",
                headerBg: "bg-alert/5",
                headerText: "text-alert",
                headerIcon: AlertTriangle,
                dotColor: "bg-alert",
            };
        default:
            return {
                label: "None",
                sublabel: "",
                badgeColor: "bg-gray-100 text-gray-600 border-gray-200",
                cardBorder: "border-gray-200",
                headerBg: "bg-gray-50",
                headerText: "text-gray-600",
                headerIcon: CheckCircle,
                dotColor: "bg-gray-400",
            };
    }
};

export function SymptomLogger({ symptoms }: SymptomLoggerProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>('select');
    const [searchQuery, setSearchQuery] = useState("");

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<LogSubmissionResult | null>(null);

    // Filter and group symptoms by severity
    const filteredSymptoms = useMemo(() => {
        let filtered = symptoms;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = symptoms.filter((s) =>
                s.name.toLowerCase().includes(query) ||
                s.category.toLowerCase().includes(query)
            );
        }
        return filtered;
    }, [symptoms, searchQuery]);

    // Group by severity level
    const groupedSymptoms = useMemo(() => {
        const groups: Record<number, SymptomMaster[]> = { 1: [], 2: [], 3: [] };
        filteredSymptoms.forEach((s) => {
            const sev = s.default_severity;
            if (groups[sev]) {
                groups[sev].push(s);
            } else {
                groups[1].push(s); // fallback to mild
            }
        });
        return groups;
    }, [filteredSymptoms]);

    // Handlers
    const toggleSymptom = (id: number) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const handleSubmit = async () => {
        if (selectedIds.size === 0) return;

        setIsSubmitting(true);
        try {
            const payload = Array.from(selectedIds).map(id => ({
                symptomId: id,
            }));

            const result = await submitDailyLog(payload);

            if (result.success) {
                setSubmissionResult(result);
                toast.success("Symptoms logged successfully");
                setStep('success');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                toast.error(result.error || "Failed to submit log");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getResultColor = (score: number) => {
        if (score >= 3) return "bg-alert/10 text-alert border-alert";
        if (score === 2) return "bg-warning/10 text-warning-dark border-warning";
        return "bg-success/10 text-success-dark border-success";
    };

    // --- RENDER: SUCCESS ---
    if (step === 'success' && submissionResult) {
        const score = submissionResult.score || 0;
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card padding="lg" className={cn("border-2 text-center py-10", getResultColor(score))}>
                    <div className={cn("inline-flex items-center justify-center p-4 rounded-full mb-6 bg-white shadow-sm")}>
                        {score >= 3 ? (
                            <AlertTriangle className="h-12 w-12 text-alert" />
                        ) : score === 2 ? (
                            <AlertCircle className="h-12 w-12 text-warning" />
                        ) : (
                            <CheckCircle className="h-12 w-12 text-success" />
                        )}
                    </div>

                    <h2 className="text-2xl font-bold mb-2 text-foreground">
                        {score >= 3 ? "Urgent Attention Required" :
                            score === 2 ? "Monitor Closely" :
                                "Log Submitted"}
                    </h2>

                    <p className="text-lg mb-8 max-w-md mx-auto">
                        {score >= 3 ? "Your reported symptoms indicate you may need medical attention. The clinical team has been notified." :
                            score === 2 ? "Your symptoms are moderate. Please rest and monitor them closely." :
                                "Your symptoms have been logged. Keep drinking water and getting rest."}
                    </p>

                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => {
                            router.push('/dashboard');
                        }}
                        className="w-full sm:w-auto"
                    >
                        Back to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    // --- RENDER: SYMPTOM SELECTION ---

    const severityOrder = [1, 2, 3];
    const hasResults = filteredSymptoms.length > 0;

    return (
        <div className="space-y-6">
            {/* Severity Scale Legend */}
            <div className="flex flex-wrap gap-3 items-center text-xs font-medium">
                <span className="text-muted uppercase tracking-wider">Severity:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success-dark border border-success/20">
                    <span className="h-2 w-2 rounded-full bg-success" /> 0-1 Mild
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 text-warning-dark border border-warning/20">
                    <span className="h-2 w-2 rounded-full bg-warning" /> 2 Moderate
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-alert/10 text-alert border border-alert/20">
                    <span className="h-2 w-2 rounded-full bg-alert" /> 3 Severe
                </span>
            </div>

            {/* Search Bar */}
            <div className="relative sticky top-20 z-20 bg-background/95 backdrop-blur-sm py-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                <input
                    type="text"
                    placeholder="Search symptoms (e.g. diarrhoea, skin, bladder)..."
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-lg shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted font-medium uppercase tracking-wider">
                    Tap all symptoms you are experiencing
                </div>
                {selectedIds.size > 0 && (
                    <div className="text-sm font-bold text-primary">
                        {selectedIds.size} selected
                    </div>
                )}
            </div>

            {/* Grouped Symptom Lists */}
            {hasResults ? (
                <div className="space-y-8">
                    {severityOrder.map((severity) => {
                        const symptomsInGroup = groupedSymptoms[severity] || [];
                        if (symptomsInGroup.length === 0) return null;

                        const config = getSeverityConfig(severity);
                        const HeaderIcon = config.headerIcon;

                        return (
                            <div key={severity} className="space-y-3">
                                {/* Section Header */}
                                <div className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl",
                                    config.headerBg
                                )}>
                                    <HeaderIcon className={cn("h-5 w-5", config.headerText)} />
                                    <div>
                                        <h3 className={cn("font-bold text-sm", config.headerText)}>
                                            {config.label}
                                        </h3>
                                        <p className="text-xs text-muted">{config.sublabel}</p>
                                    </div>
                                </div>

                                {/* Symptom Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {symptomsInGroup.map((symptom) => {
                                        const isSelected = selectedIds.has(symptom.id);
                                        const CategoryIcon = getCategoryIcon(symptom.category);

                                        return (
                                            <button
                                                key={symptom.id}
                                                onClick={() => toggleSymptom(symptom.id)}
                                                className={cn(
                                                    "text-left group flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                                                    isSelected
                                                        ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary"
                                                        : cn("bg-surface", config.cardBorder)
                                                )}
                                            >
                                                {/* Checkbox */}
                                                <div className={cn(
                                                    "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0",
                                                    isSelected
                                                        ? "bg-primary border-primary"
                                                        : "border-slate-300 group-hover:border-primary/50"
                                                )}>
                                                    {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                                                </div>

                                                {/* Icon */}
                                                <div className={cn(
                                                    "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                                    isSelected ? "bg-primary/10" : config.headerBg
                                                )}>
                                                    <CategoryIcon className={cn(
                                                        "h-5 w-5",
                                                        isSelected ? "text-primary" : config.headerText
                                                    )} />
                                                </div>

                                                {/* Text */}
                                                <div className="flex-1 min-w-0">
                                                    <span className={cn(
                                                        "font-medium text-base leading-snug block",
                                                        isSelected ? "text-primary-dark" : "text-foreground"
                                                    )}>
                                                        {symptom.name}
                                                    </span>
                                                    {symptom.description && (
                                                        <span className="text-xs text-muted block mt-0.5 truncate">
                                                            {symptom.description}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Severity dot */}
                                                <div className={cn(
                                                    "h-2.5 w-2.5 rounded-full flex-shrink-0",
                                                    config.dotColor
                                                )} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="col-span-full py-12 text-center text-muted">
                    <p>No symptoms found matching &quot;{searchQuery}&quot;</p>
                </div>
            )}

            {/* Bottom Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-background via-background to-transparent pb-6 pt-12 pointer-events-none">
                <div className="container mx-auto max-w-4xl pointer-events-auto">
                    <Button
                        size="lg"
                        className={cn(
                            "w-full shadow-xl transition-all duration-300 transform font-bold text-lg h-14",
                            selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
                        )}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            "Submitting..."
                        ) : (
                            <>
                                Submit Log <Send className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="h-24" />
        </div>
    );
}
