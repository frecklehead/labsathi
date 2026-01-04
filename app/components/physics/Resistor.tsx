import React from 'react';

interface ResistorProps {
    resistance?: number;
    onResistanceChange?: (resistance: number) => void;
}

export function Resistor({ resistance = 10, onResistanceChange }: ResistorProps) {
    return (
        <div className="flex flex-col items-center gap-2 select-none">
            {/* Resistor Visual - More Realistic 3D */}
            <div className="relative flex items-center" style={{ width: '140px', height: '50px' }}>
                {/* Left Wire */}
                <div className="w-10 h-0.5 bg-gradient-to-r from-gray-400 to-gray-500 shadow-sm"></div>

                {/* Resistor Body - 3D Cylinder */}
                <div className="relative w-20 h-8 bg-gradient-to-b from-amber-200 via-amber-100 to-amber-200 rounded-full border border-amber-300 shadow-lg overflow-hidden">
                    {/* Top shine */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-b from-white/50 to-transparent"></div>
                    {/* Bottom shadow */}
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-t from-black/20 to-transparent"></div>

                    {/* Color Bands - More realistic with 3D effect */}
                    <div className="absolute left-3 inset-y-0 w-1.5 bg-gradient-to-r from-amber-800 via-amber-900 to-amber-800 shadow-inner"></div>
                    <div className="absolute left-6 inset-y-0 w-1.5 bg-gradient-to-r from-gray-800 via-black to-gray-800 shadow-inner"></div>
                    <div className="absolute right-6 inset-y-0 w-1.5 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 shadow-inner"></div>
                    <div className="absolute right-3 inset-y-0 w-1.5 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 shadow-inner"></div>

                    {/* Value label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gray-700 bg-white/60 px-1 rounded">{resistance}Ω</span>
                    </div>
                </div>

                {/* Right Wire */}
                <div className="w-10 h-0.5 bg-gradient-to-r from-gray-500 to-gray-400 shadow-sm"></div>
            </div>

            {/* Resistance Control */}
            {onResistanceChange && (
                <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-700 shadow-lg">
                    <button
                        onClick={() => onResistanceChange(Math.max(1, resistance - 5))}
                        className="w-7 h-7 bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 rounded text-white text-sm font-bold shadow-md active:scale-95 transition-all"
                    >
                        −
                    </button>
                    <span className="text-white text-xs font-mono w-14 text-center font-bold">{resistance}Ω</span>
                    <button
                        onClick={() => onResistanceChange(Math.min(100, resistance + 5))}
                        className="w-7 h-7 bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 rounded text-white text-sm font-bold shadow-md active:scale-95 transition-all"
                    >
                        +
                    </button>
                </div>
            )}
        </div>
    );
}
