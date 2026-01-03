"use client";

import React from "react";

interface VolumetricFlaskProps {
    fill?: number; // 0-100
    color?: string; // liquid color
    className?: string;
    label?: string;
}

export function VolumetricFlask({ fill = 0, color = "bg-blue-200/50", className = "", label }: VolumetricFlaskProps) {
    // Volumetric glassware usually has a single graduation mark high up the neck

    return (
        <div className={`relative flex flex-col items-center ${className}`}>
            {/* Stopper (optional visual) */}
            <div className="w-3 h-2 bg-white/20 mb-[1px] rounded-sm"></div>

            {/* Long Neck */}
            <div className="relative w-4 h-24 bg-white/10 backdrop-blur-md border-x border-white/30 z-10 shadow-[inset_0_0_5px_rgba(255,255,255,0.1)] overflow-hidden">
                {/* Graduation Mark */}
                <div className="absolute top-8 w-full h-[1px] bg-white/40"></div>

                {/* Liquid in Neck (if full enough) */}
                <div
                    className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out ${color}`}
                    style={{
                        height: fill > 80 ? `${(fill - 80) * 5}%` : '0%'
                    }}
                ></div>
                <div className="absolute top-0 left-0.5 w-[1px] h-full bg-white/20"></div>
            </div>

            {/* Bulbous Body */}
            <div className="relative w-20 h-20 -mt-1">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/30 rounded-full shadow-[inset_0_-5px_15px_rgba(255,255,255,0.1)] overflow-hidden">
                    {/* Liquid in Body */}
                    <div
                        className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out ${color} rounded-b-full`}
                        style={{
                            height: fill > 80 ? '100%' : `${fill * 1.25}%`
                        }}
                    >
                        <div className="absolute top-0 w-full h-4 bg-white/20 -translate-y-1/2 rounded-[100%] scale-x-125 opacity-30"></div>
                    </div>

                    {/* Reflection */}
                    <div className="absolute top-4 right-4 w-5 h-10 bg-gradient-to-b from-white/40 to-transparent rounded-full -rotate-45 opacity-50 pointer-events-none"></div>
                </div>
            </div>

            {label && <span className="mt-2 text-xs text-center text-gray-500 font-mono">{label}</span>}
        </div>
    );
}
