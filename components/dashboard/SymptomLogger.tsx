"use client";

import { useState, useMemo } from "react";
import { type SymptomMaster } from "@/types/database.types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
    Search,
    Battery,
    Droplet,
    Thermometer,
    AlertCircle,
    Activity,
    Zap,
    Moon,
    Plus,
    Trash2,
    CheckCircle,
    Menu,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SymptomEntry {
    id: number;
    name: string;
    category: string;
    severity: 0 | 1 | 2 | 3;
}

interface SymptomLoggerProps {
    symptoms: SymptomMaster[];
}

export function SymptomLogger({ symptoms }: SymptomLoggerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loggedSymptoms, setLoggedSymptoms] = useState<SymptomEntry[]>([]);
    const [activeSymptom, setActiveSymptom] = useState<SymptomMaster | null>(null);
    const [severity, setSeverity] = useState<0 | 1 | 2 | 3>(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Group categories
    const categories = useMemo(() => {
        return Array.from(new Set(symptoms.map((s) => s.category)));
    }, [symptoms]);

    // Filter symptoms
    const filteredSymptoms = useMemo(() => {
        let filtered = symptoms;

        if (selectedCategory) {
            filtered = filtered.filter((s) => s.category === selectedCategory);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((s) =>
                s.name.toLowerCase().includes(query) ||
                s.category.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [symptoms, selectedCategory, searchQuery]);

    // Handlers
    const openSymptomModal = (symptom: SymptomMaster) => {
        setActiveSymptom(symptom);
        setSeverity(symptom.default_severity || 0); // Default or 0
        setIsModalOpen(true);
    };

    const addSymptom = () => {
        if (!activeSymptom) return;

        // Check if already logged, update if so
        const existingIndex = loggedSymptoms.findIndex(s => s.id === activeSymptom.id);

        const newEntry: SymptomEntry = {
            id: activeSymptom.id,
            name: activeSymptom.name,
            category: activeSymptom.category,
            severity: severity,
        };

        if (existingIndex >= 0) {
            const updated = [...loggedSymptoms];
            updated[existingIndex] = newEntry;
            setLoggedSymptoms(updated);
        } else {
            setLoggedSymptoms([...loggedSymptoms, newEntry]);
        }

        setIsModalOpen(false);
        setActiveSymptom(null);
    };

    const removeSymptom = (id: number) => {
        setLoggedSymptoms(loggedSymptoms.filter(s => s.id !== id));
    };

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'general': return <Battery className="h-5 w-5" />;
            case 'pain': return <Zap className="h-5 w-5" />;
            case 'toilet/bowel':
            case 'toilet/urinary': return <Droplet className="h-5 w-5" />;
            case 'skin': return <Activity className="h-5 w-5" />;
            case 'sleep/mental': return <Moon className="h-5 w-5" />;
            case 'nausea/vomiting': return <Thermometer className="h-5 w-5" />;
            default: return <Activity className="h-5 w-5" />;
        }
    };

    const severityLevels = [
        { value: 0, label: "None", color: "bg-surface border-border hover:border-gray-400 text-foreground", active: "ring-2 ring-gray-400 border-gray-400" },
        { value: 1, label: "Mild", color: "bg-success/10 border-success/30 hover:border-success text-success-dark", active: "ring-2 ring-success bg-success text-white border-success" },
        { value: 2, label: "Moderate", color: "bg-warning/10 border-warning/30 hover:border-warning text-warning-dark", active: "ring-2 ring-warning bg-warning text-white border-warning" },
        { value: 3, label: "Severe", color: "bg-alert/10 border-alert/30 hover:border-alert text-alert-dark", active: "ring-2 ring-alert bg-alert text-white border-alert" },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                <input
                    type="text"
                    placeholder="Search symptoms (e.g., pain, nausea)..."
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Category Filter (Horizontal Scroll) */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-colors",
                        selectedCategory === null
                            ? "bg-primary text-white border-primary"
                            : "bg-surface text-foreground border-border hover:border-primary/50"
                    )}
                >
                    <Menu className="h-4 w-4" />
                    All
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-colors",
                            selectedCategory === cat
                                ? "bg-primary text-white border-primary"
                                : "bg-surface text-foreground border-border hover:border-primary/50"
                        )}
                    >
                        {getCategoryIcon(cat)}
                        {cat}
                    </button>
                ))}
            </div>

            {/* Symptoms List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSymptoms.length > 0 ? (
                    filteredSymptoms.map((symptom) => (
                        <button
                            key={symptom.id}
                            onClick={() => openSymptomModal(symptom)}
                            className="text-left group relative flex items-center justify-between p-4 bg-surface rounded-xl border border-border hover:border-primary/50 hover:shadow-sm transition-all duration-200"
                        >
                            <div>
                                <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-1 block">
                                    {symptom.category}
                                </span>
                                <span className="font-medium text-foreground text-lg">
                                    {symptom.name}
                                </span>
                            </div>
                            <Plus className="h-5 w-5 text-muted group-hover:text-primary transition-colors" />
                        </button>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-muted">
                        <p>No symptoms found matching &quot;{searchQuery}&quot;</p>
                    </div>
                )}
            </div>

            {/* Logged Symptoms Summary */}
            {loggedSymptoms.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 shadow-lg animate-in slide-in-from-bottom-full z-40">
                    <div className="container mx-auto max-w-4xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-foreground">
                                Your Log ({loggedSymptoms.length})
                            </h3>
                            <span className="text-xs text-muted">Tap to remove</span>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                            {loggedSymptoms.map((entry) => (
                                <button
                                    key={entry.id}
                                    onClick={() => removeSymptom(entry.id)}
                                    className="flex-shrink-0 flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-background border border-border text-sm"
                                >
                                    <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        entry.severity === 1 ? "bg-success" :
                                            entry.severity === 2 ? "bg-warning" :
                                                entry.severity === 3 ? "bg-alert" : "bg-gray-400"
                                    )} />
                                    {entry.name}
                                    <X className="h-3 w-3 text-muted" />
                                </button>
                            ))}
                        </div>

                        <Button
                            size="lg"
                            className="w-full"
                            onClick={() => console.log("Submitting log:", loggedSymptoms)}
                        >
                            Add to Daily Log
                        </Button>
                    </div>
                </div>
            )}

            {/* Severity Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={activeSymptom?.name}
            >
                <div className="space-y-6">
                    <div className="text-center">
                        <p className="text-lg font-medium text-foreground mb-4">
                            How severe is this symptom?
                        </p>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {severityLevels.map((level) => (
                                <button
                                    key={level.value}
                                    onClick={() => setSeverity(level.value as any)}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 h-24 sm:h-32",
                                        level.color,
                                        severity === level.value ? level.active : "border-transparent"
                                    )}
                                >
                                    <span className="text-2xl font-bold mb-1">{level.value}</span>
                                    <span className="font-medium">{level.label}</span>
                                    {severity === level.value && (
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle className="h-5 w-5 fill-current" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            variant="outline"
                            size="lg"
                            className="flex-1"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            className="flex-1"
                            onClick={addSymptom}
                        >
                            Add to Log
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Bottom spacer for fixed summary */}
            <div className="h-32" />
        </div>
    );
}
