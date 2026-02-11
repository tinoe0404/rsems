"use client";

import { Profile } from "@/types/database.types";
import {
    Activity,
    Calendar,
    User,
    FileText,
    Heart,
    ArrowRight,
    Bell,
    ChevronRight,
    Sun,
    Moon,
    Cloud,
    Droplets,
    LogOut,
    Settings,
    ChevronDown
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { PatientAppointments } from "@/components/dashboard/PatientAppointments";
import { WellnessCard } from "@/components/dashboard/WellnessCard";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardClientProps {
    profile: Profile;
    email: string;
    daysSinceTreatment: number;
}

export function DashboardClient({ profile, email, daysSinceTreatment }: DashboardClientProps) {
    const timeOfDay = new Date().getHours();
    const greeting = timeOfDay < 12 ? "Good Morning" : timeOfDay < 18 ? "Good Afternoon" : "Good Evening";
    const firstName = profile.full_name.split(" ")[0];
    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="animate-in fade-in duration-500">


            <main className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={container}
                    className="space-y-8"
                >
                    {/* Hero Section */}
                    <motion.div variants={item} className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-end">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-teal-600 mb-2 bg-teal-50 px-3 py-1 rounded-full w-fit">
                                {timeOfDay < 18 ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                <span>{format(new Date(), "EEEE, MMMM do")}</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                                {greeting}, {firstName}.
                            </h1>
                            <p className="text-slate-500 mt-2 max-w-md">
                                Your health journey is important. Here's your daily overview and quick actions.
                            </p>
                        </div>
                        <div className="hidden lg:flex gap-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Droplets className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Treatment Day</p>
                                    <p className="text-xl font-bold text-slate-900 leading-none">{daysSinceTreatment}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Bento Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

                        {/* Primary Action - Log Symptoms (Large Card) */}
                        <motion.div variants={item} className="md:col-span-2 lg:col-span-2 row-span-1">
                            <Link href="/dashboard/log" className="group block h-full">
                                <div className="relative h-full bg-gradient-to-br from-teal-600 to-emerald-700 rounded-3xl p-6 lg:p-8 text-white overflow-hidden shadow-lg shadow-teal-900/10 hover:shadow-xl hover:shadow-teal-900/20 transition-all duration-300 transform hover:-translate-y-1">
                                    {/* Abstract decorative circles */}
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-2xl"></div>

                                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[180px]">
                                        <div>
                                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium border border-white/10">
                                                <Activity className="h-4 w-4" />
                                                <span>Daily Helper</span>
                                            </div>
                                            <h2 className="text-2xl lg:text-3xl font-bold mt-4 leading-tight">
                                                How are you feeling<br />today?
                                            </h2>
                                            <p className="text-emerald-50 mt-2 max-w-sm text-sm lg:text-base">
                                                Logging your symptoms helps your care team provide the best support possible.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-6">
                                            <span className="bg-white text-teal-700 px-6 py-2.5 rounded-full font-semibold text-sm shadow-md group-hover:scale-105 transition-transform flex items-center gap-2">
                                                Log Symptoms <ArrowRight className="h-4 w-4" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        {/* Daily Wellness Insight (Replaces Profile) */}
                        <motion.div variants={item} className="md:col-span-1 lg:col-span-1 md:row-span-2">
                            <WellnessCard />
                        </motion.div>

                        {/* Recent History / Quick Stat (Small Card) */}
                        <motion.div variants={item} className="md:col-span-1 lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-teal-100 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <FileText className="h-6 w-6" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-1">History</h3>
                                <p className="text-sm text-slate-500 mb-4">You have 0 logs this week</p>
                                <Link href="/dashboard/history" className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all">
                                    View Logs <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </motion.div>

                        {/* Appointments Section (Wide Card) */}
                        <motion.div variants={item} className="md:col-span-2 lg:col-span-3 bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Appointments</h3>
                                        <p className="text-sm text-slate-500">Upcoming visits & consultations</p>
                                    </div>
                                </div>
                                <Link href="/dashboard/appointments">
                                    <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                        View All
                                    </button>
                                </Link>
                            </div>

                            <div className="relative">
                                {/* We wrap the existing component to give it a fresh context if needed, or pass props */}
                                <div className="-mx-2">
                                    <PatientAppointments limit={3} />
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </motion.div>
            </main>
        </div>
    );
}
