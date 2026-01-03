"use client";

import React from "react";

interface BottleProps {
    label: string;
    color: string; // Liquid color
    type?: "reagent" | "wash";
    className?: string;
}

export function Bottle({ label, color, type = "reagent", className = "" }: BottleProps) {
    if (type === "wash") {
        return (
            <div className={`relative flex flex-col items-center group ${className}`}>
                {/* Nozzle */}
                <div className="w-24 h-24 bg-transparent border-t-4 border-r-4 border-transparent rounded-tr-3xl absolute -top-8 -right-8" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>
                    {/* Tip */}
                    <div className="absolute top-[-4px] left-[-4px] w-2 h-2 bg-white/60"></div>
                </div>

                {/* Cap */}
                <div className="w-10 h-6 bg-red-400 rounded-t-sm shadow-sm relative z-20"></div>

                {/* Body */}
                <div className="relative w-20 h-32 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden shadow-sm">
                    <div className="absolute bottom-0 w-full h-3/4 bg-blue-400/20"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white/70">WASH</div>
                </div>
                {/* Straw */}
                <div className="absolute bottom-4 left-1/2 w-1 h-32 bg-white/30 origin-bottom -rotate-6 z-10"></div>
            </div>
        )
    }

    return (
        <div className={`relative flex flex-col items-center ${className}`}>
            {/* Stopper */}
            <div className="w-8 h-6 bg-white/30 backdrop-blur-md border border-white/40 rounded-t-sm mb-[-2px] relative z-20 shadow-sm"></div>

            {/* Neck */}
            <div className="w-8 h-6 bg-white/20 backdrop-blur-md border-x border-white/30 relative z-10"></div>

            {/* Body */}
            <div className="relative w-24 h-32 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg shadow-inner overflow-hidden">
                {/* Liquid */}
                <div className={`absolute bottom-0 w-full h-3/4 ${color} opacity-80`}></div>

                {/* Label */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-16 h-12 bg-white/90 shadow-md flex items-center justify-center text-center p-1">
                    <span className="text-xs font-serif font-bold text-black border-2 border-black/80 px-1">{label}</span>
                </div>

                {/* Gloss */}
                <div className="absolute top-2 left-2 w-2 h-full bg-gradient-to-b from-white/40 to-transparent"></div>
            </div>
        </div>
    );
}
