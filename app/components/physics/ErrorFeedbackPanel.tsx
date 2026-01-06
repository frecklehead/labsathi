"use client";

import React from "react";
import { AlertTriangle, Lightbulb } from "lucide-react";

interface ErrorFeedbackProps {
    currentStep: number;
    error: string | null;
    hint: string | null;
}

export function ErrorFeedbackPanel({ currentStep, error, hint }: ErrorFeedbackProps) {
    if (!error && !hint) return null;

    return (
        <div className="fixed bottom-10 left-1/2 -track-x-1/2 z-[100] w-[640px] pointer-events-none">
            {/* Error Message */}
            {error && (
                <div 
                    className="bg-red-950/95 border-2 border-red-500 rounded-[32px] p-6 backdrop-blur-3xl shadow-[0_20px_50px_rgba(239,68,68,0.3)] animate-shake pointer-events-auto mb-4"
                >
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
                            <AlertTriangle className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">Mistake Detected</div>
                            <div className="text-base font-bold text-white leading-tight">{error}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hint/Suggestion */}
            {hint && !error && (
                <div className="bg-slate-950 border-2 border-amber-500/50 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4 duration-500 pointer-events-auto">
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20 animate-pulse">
                            <Lightbulb className="w-7 h-7 text-slate-950" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Expert Hint</div>
                            <div className="text-lg font-bold text-white leading-tight mb-1">{hint}</div>
                            <div className="text-xs text-slate-400 font-medium">Follow this guidance to proceed with the experiment safely.</div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0) scale(1.02); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
            `}</style>
        </div>
    );
}
