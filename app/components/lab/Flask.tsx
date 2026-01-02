"use client";

import React from "react";

interface FlaskProps {
    fill?: number; // 0-100
    color?: string; // liquid color
    className?: string;
    label?: string;
}


export function Flask({ fill = 20, color = "bg-transparent", className = "", label }: FlaskProps) {
  
    return (
        <div className={`relative flex flex-col items-center ${className}`}>
            {/* Neck */}
            <div className="w-8 h-12 bg-white/10 backdrop-blur-md border-x border-t border-white/30 relative z-10 top-1 rounded-t-md shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]">
                <div className="absolute top-[-2px] -left-[2px] w-[calc(100%+4px)] h-2 bg-white/20 rounded-full border border-white/40"></div>
            </div>

            {/* Body (Trapezoid-ish) */}
            {/* Note: Glass effect on non-rectangles is hard. Let's try a transform approach. */}
            <div className="relative w-24 h-24">

                {/* The Glass Container */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/30 rounded-full rounded-t-[40%] shadow-[inset_0_-5px_15px_rgba(255,255,255,0.1)] overflow-hidden">
                    {/* Liquid */}
                    <div
                        className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out ${color}`}
                        style={{ height: `${fill}%` }}
                    >
                        {/* Surface */}
                        <div className="absolute top-0 w-full h-2 bg-white/20 -translate-y-1/2 rounded-[100%] scale-x-125"></div>
                    </div>

                    {/* Reflection */}
                    <div className="absolute top-4 right-4 w-4 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-full -rotate-12 opacity-60"></div>
                </div>
            </div>

            {label && <span className="mt-2 text-xs text-center text-gray-500">{label}</span>}
        </div>
    );
}
