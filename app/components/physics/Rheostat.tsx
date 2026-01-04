import React, { useState, useEffect } from 'react';

interface RheostatProps {
    resistance?: number;
    maxResistance?: number;
    onResistanceChange?: (value: number) => void;
}

export function Rheostat({ resistance = 50, maxResistance = 100, onResistanceChange }: RheostatProps) {
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        onResistanceChange?.(newValue);
    };

    return (
        <div className="flex flex-col items-center gap-2 select-none group">
            {/* Rheostat Visual */}
            <div className="relative w-48 h-24 bg-gradient-to-b from-gray-300 to-gray-400 rounded-lg border-2 border-gray-500 shadow-xl p-2 flex items-center justify-center">
                {/* End Terminals (Insulators) */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-16 bg-slate-800 rounded shadow-md"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-16 bg-slate-800 rounded shadow-md"></div>

                {/* Ceramics Core with Wire Winding Effect */}
                <div className="w-40 h-10 bg-slate-200 rounded-full border border-gray-400 overflow-hidden relative shadow-inner">
                    {/* Wire windings texture */}
                    <div className="absolute inset-0 opacity-40" style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, #4a5568 2px, #4a5568 3px)',
                        backgroundSize: '4px 100%'
                    }}></div>

                    {/* Metal Slide Bar */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-b from-gray-400 to-gray-600"></div>
                </div>

                {/* The Slider (Jockey) */}
                <div
                    className="absolute top-0 bottom-0 pointer-events-none transition-all duration-200 ease-out z-10"
                    style={{ left: `${(resistance / maxResistance) * 80 + 10}%` }}
                >
                    <div className="w-6 h-full bg-slate-700 rounded-sm border border-slate-900 shadow-lg flex flex-col items-center py-1">
                        <div className="w-full h-1 bg-yellow-600 rounded-full mb-1"></div>
                        <div className="w-1 h-12 bg-gray-500 rounded-full"></div>
                    </div>
                </div>

                {/* Professional Metallic Screw Terminals */}
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-700 border border-gray-500 shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900/30 border border-black/10 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 rotate-45 opacity-30"></div>
                    </div>
                </div>
                <div className="absolute -right-2 top-0 w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-700 border border-gray-500 shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900/30 border border-black/10 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 -rotate-45 opacity-30"></div>
                    </div>
                </div>
                <div className="absolute -right-2 bottom-0 w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-700 border border-gray-500 shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900/30 border border-black/10 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 rotate-45 opacity-30"></div>
                    </div>
                </div>

                {/* Range Label */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-gray-600 bg-white/50 px-1 rounded">
                    RHEOSTAT: {maxResistance}Ω
                </div>
            </div>

            {/* Hidden Input for interaction */}
            <div className="w-full px-4 mt-1">
                <input
                    type="range"
                    min="0"
                    max={maxResistance}
                    step="0.1"
                    value={resistance}
                    onChange={handleSliderChange}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
            </div>

            <div className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {resistance.toFixed(1)} Ω
            </div>
        </div>
    );
}
