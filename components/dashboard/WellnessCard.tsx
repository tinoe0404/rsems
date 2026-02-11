"use client";

import { useState, useEffect } from "react";
import { Sparkles, Quote, Coffee, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

const tips = [
    {
        icon: Coffee,
        title: "Stay Hydrated",
        content: "Drinking enough water is crucial during treatment. Aim for 8 glasses a day to help flush out toxins.",
        color: "bg-blue-50 text-blue-600"
    },
    {
        icon: Sun,
        title: "Morning Light",
        content: "Try to get 10 minutes of gentle morning sunlight. It helps regulate your sleep-wake cycle and boosts mood.",
        color: "bg-amber-50 text-amber-600"
    },
    {
        icon: Sparkles,
        title: "Gentle Movement",
        content: "Short, gentle walks can reduce fatigue. Listen to your body and rest when you need to.",
        color: "bg-emerald-50 text-emerald-600"
    },
    {
        icon: Moon,
        title: "Restful Sleep",
        content: "Establish a calming bedtime routine. Avoid screens an hour before bed to improve sleep quality.",
        color: "bg-indigo-50 text-indigo-600"
    }
];

export function WellnessCard() {
    const [tip, setTip] = useState(tips[0]);

    useEffect(() => {
        // Simple rotation based on day of year to keep it consistent for the day
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        setTip(tips[dayOfYear % tips.length]);
    }, []);

    return (
        <div className="h-full bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden group hover:border-teal-100 transition-colors">
            {/* Decorative background */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${tip.color.split(' ')[0]} rounded-bl-full opacity-50 -mr-8 -mt-8 transition-colors`}></div>

            <div className="relative z-10">
                <div className={`inline-flex p-3 rounded-2xl ${tip.color} mb-4 transition-colors`}>
                    <tip.icon className="h-6 w-6" />
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Insight</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {tip.title}
                </h3>

                <p className="text-slate-600 leading-relaxed text-sm">
                    "{tip.content}"
                </p>
            </div>

            <div className="mt-auto pt-6 flex items-center justify-between">
                <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-800"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                </div>
                <span className="text-xs text-slate-400 italic">Updated daily</span>
            </div>
        </div>
    );
}
