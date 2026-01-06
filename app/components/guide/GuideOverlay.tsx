import React from 'react';
import { GuideStep } from '../../types/circuit.types';

interface GuideOverlayProps {
    currentStep: GuideStep;
    currentIndex: number;
    totalSteps: number;
}

export default function GuideOverlay({ currentStep, currentIndex, totalSteps }: GuideOverlayProps) {
    return (
        <div className="absolute top-20 right-8 z-25 w-70 pointer-events-auto">
            <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-3xl overflow-hidden transition-all duration-500">
                <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-black-600 animate-pulse"></span>
                        Current Step
                    </h2>
                    <div className="px-3 py-1 bg-black-600/10 rounded-full border border-black-600/20">
                        <span className="text-[10px] font-black text-black-600">{currentIndex + 1} / {totalSteps}</span>
                    </div>
                </div>
                <div className="p-5">
                    <h3 className="text-black-900 font-black text-sm mb-2 tracking-tight">
                        {currentStep?.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-bold">
                        {currentStep?.description || "Experiment Complete."}
                    </p>
                </div>
            </div>
        </div>
    );
}
