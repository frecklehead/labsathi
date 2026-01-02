"use client";

import React from "react";
interface BuretteProps {
    fill: number; // 0-100%
    open?: boolean;
    color?: string;
    className?: string;
}

export function Burette({fill = 0, open = false, color="bg-transparent", className=""}: BuretteProps){
    return(
         <div className={`relative w-4 h-[300px] flex flex-col items-center ${className}`}>
            {/* Glass Tube */}
            <div className="relative w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-t-sm shadow-inner z-10 overflow-hidden">

                {/* Liquid */}
                <div
                    className={`absolute bottom-0 left-0 w-full transition-all duration-300 ${color}`}
                    style={{ height: `${fill}%` }}
                ></div>

                {/* Graduations */}
                <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-between py-2 pointer-events-none">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="w-2 h-[1px] bg-white/30 ml-auto mr-0.5"></div>
                    ))}
                </div>

                {/* Reflections */}
                <div className="absolute top-0 left-0.5 w-[2px] h-full bg-white/20 z-20"></div>
            </div>

            {/* Stopcock/Tap */}
            <div className="relative z-20 flex flex-col items-center -mt-[1px]">
                {/* Connection */}
                <div className="w-2 h-4 bg-white/10 backdrop-blur-md border-x border-white/20"></div>

                {/* Valve Body */}
                <div className="relative w-6 h-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-sm flex items-center justify-center">
                    {/* Handle */}
                    <div
                        className={`w-8 h-1 bg-amber-500 rounded-full shadow-sm transition-transform duration-300 ${open ? 'rotate-90' : 'rotate-0'}`}
                    ></div>
                </div>

                {/* Tip */}
                <div className="w-1 h-6 bg-white/10 backdrop-blur-md border-x border-white/20 rounded-b-sm flex justify-center">
                    {/* Drop Animation */}
                    {open && fill > 0 && (
                        <div className="absolute top-full w-2 h-2 bg-transparent rounded-full animate-ping opacity-75">
                            <div className={`w-full h-full rounded-full ${color}`}></div>
                        </div>
                    )}
                    {open && fill > 0 && (
                        <div className={`absolute top-full mt-1 w-1.5 h-2 ${color} rounded-b-full animate-bounce`}></div>
                    )}
                </div>
            </div>
        </div>
    )
}