"use client";

import React from "react";

export function Tile() {
    return (
        <div className="w-48 h-32 bg-white/90 rounded-sm shadow-xl transform skew-x-12 relative flex items-center justify-center overflow-hidden border-b-4 border-gray-300">
            {/* A slight gloss */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-gray-200 opacity-50"></div>
        </div>
    );
}

export function Funnel({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex flex-col items-center group ${className}`}>
      {/* Funnel Bowl (Cone) */}
      <div className="relative w-20 h-16 group-hover:scale-105 transition-transform duration-500">
        
        {/* Top Rim (Opening) */}
        <div className="absolute top-0 left-0 w-full h-5 bg-white/20 rounded-[100%] border-[1.5px] border-white/40 z-20 backdrop-blur-[2px] overflow-hidden">
          {/* Inner Shadow to show depth */}
          <div className="w-full h-full bg-gradient-to-b from-black/20 to-transparent"></div>
        </div>

        {/* Main Cone Body */}
        <div 
          className="absolute top-2 w-full h-full bg-gradient-to-br from-white/30 via-white/10 to-black/20 backdrop-blur-md border-x border-white/20"
          style={{
            clipPath: 'polygon(0% 15%, 100% 15%, 60% 100%, 40% 100%)'
          }}
        >
          {/* Highlight streak for glass effect */}
          <div className="absolute left-1/4 top-0 w-1 h-full bg-white/20 blur-[1px] rotate-12"></div>
        </div>
      </div>

      {/* Stem/Neck */}
      <div className="relative w-4 h-14 -mt-1">
        {/* The stem itself */}
        <div className="w-full h-full bg-gradient-to-r from-white/20 via-white/5 to-black/20 backdrop-blur-md border-x border-white/20 rounded-b-sm">
          {/* Reflection on the stem */}
          <div className="absolute left-1 w-0.5 h-full bg-white/30 blur-[0.5px]"></div>
        </div>
        
        {/* Angled cut at the bottom of the stem for realism */}
        <div 
          className="absolute bottom-0 w-full h-3 bg-white/10"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 70%)' }}
        ></div>
      </div>

      {/* Drop Shadow on the floor */}
      <div className="w-12 h-2 bg-black/10 blur-md rounded-full mt-1"></div>
    </div>
  );
}
export function MeasuringCylinder({ fill = 0, color = "bg-blue-400", className = "" }: { fill?: number, color?: string, className?: string }) {
    return (
        <div className={`relative w-8 h-32 bg-white/5 backdrop-blur-sm border border-white/20 rounded-b-md flex flex-col justify-end items-center ${className} shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]`}>
            {/* Base */}
            <div className="absolute -bottom-1 w-12 h-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full z-10 shadow-lg"></div>

            {/* Liquid */}
            <div className={`w-full ${color} opacity-70 transition-all duration-300 relative`} style={{ height: `${fill}%` }}>
                <div className="absolute top-0 w-full h-1 bg-white/30 -translate-y-1/2 rounded-[100%]"></div>
            </div>

            {/* Marks */}
            <div className="absolute inset-0 flex flex-col justify-evenly py-2 px-1 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-2 h-[1px] bg-white/30 self-end"></div>
                ))}
            </div>
        </div>
    );
}
