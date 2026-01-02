"use client";

import React from "react";

interface PipetteProps {
    fill?: number; // 0-100%
    color?: string;
    className?: string;
}

export function Pipette({ fill = 0, color = "bg-yellow-500", className = "" }: PipetteProps) {
    return (
        <div className={`relative flex flex-col items-center ${className}`}>
    
            {/* Top Stem */}
            <div className="w-1.5 h-20 bg-white/20 backdrop-blur-sm border-x border-white/30"></div>

            {/* Bulb */}
            <div className="relative w-6 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full my-[-2px] z-10 overflow-hidden">
                {/* Liquid in Bulb */}
                <div className={`absolute bottom-0 w-full transition-all duration-500 ${color}`} style={{ height: `${Math.min(100, Math.max(0, (fill - 20) * 1.5))}%` }}></div>
                {/* Reflection */}
                <div className="absolute top-2 right-1 w-2 h-4 bg-white/30 rounded-full -rotate-12"></div>
            </div>

            {/* Bottom Stem */}
            <div className="relative w-1.5 h-24 bg-white/20 backdrop-blur-sm border-x border-white/30 flex flex-col justify-end items-center">
                {/* Liquid in Stem */}
                <div className={`w-full transition-all duration-500 ${color}`} style={{ height: `${Math.min(100, fill * 5)}%` }}></div>
            </div>

            {/* Calibration Mark */}
            <div className="absolute top-10 w-4 h-[1px] bg-white/60"></div>
        </div>
    );
}
