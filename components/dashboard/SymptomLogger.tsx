"use client";

import { useState, useMemo } from "react";
import { type SymptomMaster } from "@/types/database.types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
    Search,
    AlertCircle,
    CheckCircle,
    AlertTriangle,
    Info,
    ArrowRight,
    ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitDailyLog, type LogSubmissionResult } from "@/actions/submitLog";

interface SymptomLoggerProps {
    symptoms: SymptomMaster[];
}

type Step = 'select' | 'grade' | 'success';

export function SymptomLogger({ symptoms }: SymptomLoggerProps) {
    const [step, setStep] = useState<Step>('select');
    const [searchQuery, setSearchQuery] = useState("");

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Grading State
    const [grades, setGrades] = useState<Record<number, 0 | 1 | 2 | 3>>({});

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<LogSubmissionResult | null>(null);

    // Filter symptoms (just search, no categories)
    const filteredSymptoms = useMemo(() => {
        if (!searchQuery) return symptoms;
        const query = searchQuery.toLowerCase();
        return symptoms.filter((s) =>
            s.name.toLowerCase().includes(query)
        );
    }, [symptoms, searchQuery]);

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

    const handleGradeChange = (id: number, severity: 0 | 1 | 2 | 3) => {
        setGrades(prev => ({ ...prev, [id]: severity }));
    };

    const proceedToGrading = () => {
        if (selectedIds.size === 0) return;

        // Initialize grades for selected items if not present
        const initialGrades = { ...grades };
        selectedIds.forEach(id => {
            if (initialGrades[id] === undefined) {
                // Find default severity or set to 1 (Mild) as reasonable default for reported symptom
                const s = symptoms.find(sym => sym.id === id);
                initialGrades[id] = s?.default_severity || 1;
            }
        });
        setGrades(initialGrades);
        setStep('grade');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = Array.from(selectedIds).map(id => ({
                symptom_id: id,
                symptom_name: symptoms.find(s => s.id === id)?.name || "Unknown",
                severity: grades[id] || 1
            }));

            const result = await submitDailyLog(payload);

            if (result.success) {
                setSubmissionResult(result);
                setStep('success');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert(result.error || "Failed to submit log");
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    const severityLevels = [
        { value: 1, label: "Mild", color: "bg-success/10 border-success/30 text-success-dark", ring: "ring-success" },
        { value: 2, label: "Moderate", color: "bg-warning/10 border-warning/30 text-warning-dark", ring: "ring-warning" },
        { value: 3, label: "Severe", color: "bg-alert/10 border-alert/30 text-alert-dark", ring: "ring-alert" },
    ] as const;

    const getSeverityColor = (score: number) => {
        if (score >= 3) return "bg-alert/10 text-alert border-alert";
        if (score === 2) return "bg-warning/10 text-warning-dark border-warning";
        return "bg-success/10 text-success-dark border-success";
    };

    // --- RENDER STEPS ---

    if (step === 'success' && submissionResult) {
        const score = submissionResult.score || 0;
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card padding="lg" className={cn("border-2 text-center py-10", getSeverityColor(score))}>
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
                            setStep('select');
                            setSelectedIds(new Set());
                            setGrades({});
                            setSubmissionResult(null);
                        }}
                        className="w-full sm:w-auto"
                    >
                        Back to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    if (step === 'grade') {
        const selectedSymptoms = symptoms.filter(s => selectedIds.has(s.id));
        return (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Grade Severity</h2>
                    <p className="text-muted">For each symptom, how severe is it right now?</p>
                </div>

                <div className="space-y-6">
                    {selectedSymptoms.map(symptom => (
                        <div key={symptom.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">{symptom.name}</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {severityLevels.map((level) => {
                                    const isSelected = grades[symptom.id] === level.value;
                                    return (
                                        <button
                                            key={level.value}
                                            onClick={() => handleGradeChange(symptom.id, level.value as any)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200",
                                                isSelected
                                                    ? `ring-2 ${level.ring} ${level.color} bg-opacity-100 font-bold shadow-sm`
                                                    : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                                            )}
                                        >
                                            <span className="text-lg mb-1">{level.value}</span>
                                            <span className="text-xs uppercase tracking-wide">{level.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4 pt-4 sticky bottom-6 z-20">
                    <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 bg-white shadow-lg"
                        onClick={() => setStep('select')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        className="flex-1 shadow-lg shadow-primary/20"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Log"}
                    </Button>
                </div>
                <div className="h-12" />
            </div>
        );
    }

    // Step: 'select'
    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative sticky top-20 z-20 bg-background/95 backdrop-blur-sm py-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                <input
                    type="text"
                    placeholder="Search symptoms..."
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-lg shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="text-sm text-muted font-medium uppercase tracking-wider">
                Select all that apply
            </div>

            {/* Flat List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredSymptoms.length > 0 ? (
                    filteredSymptoms.map((symptom) => {
                        const isSelected = selectedIds.has(symptom.id);
                        return (
                            <button
                                key={symptom.id}
                                onClick={() => toggleSymptom(symptom.id)}
                                className={cn(
                                    "text-left group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                                    isSelected
                                        ? "bg-primary/5 border-primary shadow-sm"
                                        : "bg-surface border-border hover:border-primary/30"
                                )}
                            >
                                <div className={cn(
                                    "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors",
                                    isSelected
                                        ? "bg-primary border-primary"
                                        : "border-slate-300 group-hover:border-primary/50"
                                )}>
                                    {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                                </div>
                                <span className={cn(
                                    "font-medium text-lg",
                                    isSelected ? "text-primary-dark" : "text-foreground"
                                )}>
                                    {symptom.name}
                                </span>
                            </button>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 text-center text-muted">
                        <p>No symptoms found matching &quot;{searchQuery}&quot;</p>
                    </div>
                )}
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-background via-background to-transparent pb-6 pt-12 pointer-events-none">
                <div className="container mx-auto max-w-4xl pointer-events-auto">
                    <Button
                        size="lg"
                        className={cn(
                            "w-full shadow-xl transition-all duration-300 transform",
                            selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
                        )}
                        onClick={proceedToGrading}
                    >
                        Continue to Grading ({selectedIds.size}) <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="h-24" />
        </div>
    );
}
