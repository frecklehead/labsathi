"use client";

import React from "react";

interface StandProps {
    children?: React.ReactNode;
    height?: string;
    className?: string;
}

export function Stand({ children, height = "h-[600px]", className = "" }: StandProps) {
    return (
        <div className={`relative flex flex-col items-center ${className}`}>
            {/* Rod */}
            <div className={`w-3 ${height} bg-gradient-to-r from-gray-400 via-gray-300 to-gray-500 rounded-t-sm shadow-md`}></div>

            {/* Base */}
            <div className="w-64 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-sm shadow-xl z-20 flex items-center justify-center border-t border-gray-600">
                <span className="text-[10px] text-gray-500 font-mono tracking-widest opacity-50">LABSATHI</span>
            </div>


        </div>
    );
}
