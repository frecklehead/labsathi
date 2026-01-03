"use client";

import React from "react";

interface StandProps {
    children?: React.ReactNode;
    height?: string;
    className?: string;
}

export function Stand({ children, height = "h-96", className = "" }: StandProps) {
    return (
        <div className={`relative flex flex-col items-center ${className}`}>
            {/* Rod */}
            <div className={`w-2 ${height} bg-gradient-to-r from-gray-400 via-gray-300 to-gray-500 rounded-t-sm shadow-md`}></div>

            {/* Base */}
            <div className="w-48 h-6 bg-gradient-to-br from-gray-700 to-gray-900 rounded-sm shadow-xl z-20 flex items-center justify-center border-t border-gray-600">
                <span className="text-[10px] text-gray-500 font-mono tracking-widest opacity-50">LABSATHI</span>
            </div>

            {/* Clamp Area (Absolute positioned relative to Stand) */}
            <div className="absolute top-1/4 left-1/2 -ml-1 w-24 h-4">
                {/* Main clamp Arm */}
                <div className="absolute left-0 top-0 h-2 w-16 bg-gray-400 rounded-r-full origin-left -rotate-12 shadow-sm"></div>
                {/* Holder */}
                {/* <div className="absolute left-14 -top-2 w-8 h-8 rounded-full border-4 border-gray-400/80 items-center justify-center flex">
                    {children}
                </div> */}
                {/* Screw */}
                <div className="absolute left-0 top-0 w-3 h-3 bg-gray-600 rounded-full -ml-1 border border-gray-900"></div>
            </div>
        </div>
    );
}
