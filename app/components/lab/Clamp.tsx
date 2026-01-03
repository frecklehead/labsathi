"use client";

import React from "react";

export function Clamp({ className = "" }: { className?: string }) {
    return (
        <div className={`relative w-24 h-4 ${className} pointer-events-none`}>
            {/* Main clamp Arm */}
            <div className="absolute left-0 top-0 h-2 w-16 bg-gradient-to-r from-slate-400 to-slate-500 rounded-r-full origin-left -rotate-12 shadow-sm border border-slate-600/30"></div>
            
            {/* Screw Head */}
            <div className="absolute left-0 top-0 w-4 h-4 bg-slate-700 rounded-full -ml-2 -mt-1 border border-slate-800 flex items-center justify-center shadow-lg">
                <div className="w-2 h-0.5 bg-slate-400 rotate-45"></div>
            </div>

            {/* Holder Mechanism (Visual only, burette snaps here visually) */}
            <div className="absolute left-14 -top-2 w-6 h-6 rounded-full border-4 border-slate-400/80 shadow-inner flex items-center justify-center">
                 <div className="w-1 h-1 bg-slate-600 rounded-full opacity-50"></div>
            </div>
        </div>
    );
}
