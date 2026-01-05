import React from 'react';

interface ResistanceBoxProps {
    resistance?: number;
    onResistanceChange?: (value: number) => void;
}

export function HighResistanceBox({ resistance = 1000, onResistanceChange }: ResistanceBoxProps) {
    // Commonly used values in a High Resistance Box for conversion experiments
    const denominations = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            {/* Resistance Box Visual */}
            <div className="relative w-48 h-36 bg-[#3d2b1f] rounded-lg border-4 border-[#2d1b0f] shadow-2xl p-3 flex flex-col gap-2">
                {/* Wood texture simulation */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 1px, transparent 1px, transparent 10px)'
                }}></div>

                <div className="text-[9px] text-[#8b5e34] font-bold text-center uppercase tracking-widest border-b border-[#2d1b0f]/50 pb-1">
                    High Resistance Box (R)
                </div>

                {/* The "Plugs" / Sockets - clickable for quick selection */}
                <div className="grid grid-cols-4 gap-2 mt-1">
                    {denominations.map((v, i) => (
                        <button
                            key={i}
                            onClick={() => onResistanceChange?.(v)}
                            className="flex flex-col items-center gap-1 group/plug"
                        >
                            <div className={`w-4 h-4 rounded-full border border-yellow-800 shadow-inner flex items-center justify-center transition-colors ${resistance === v ? 'bg-yellow-400' : 'bg-yellow-700 hover:bg-yellow-600'}`}>
                                <div className="w-1 h-1 bg-black rounded-full"></div>
                            </div>
                            <span className={`text-[6px] font-bold transition-colors ${resistance === v ? 'text-yellow-400' : 'text-yellow-500/80'}`}>
                                {v >= 1000 ? `${v / 1000}k` : v}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Value Display */}
                <div className="mt-auto bg-black/60 rounded border border-[#5d3b2f] p-1.5 flex items-center justify-between">
                    <span className="text-[9px] text-gray-400 font-mono">SERIES R:</span>
                    <div className="flex items-center">
                        <input
                            type="number"
                            value={resistance}
                            onChange={(e) => onResistanceChange?.(parseInt(e.target.value) || 0)}
                            className="w-20 bg-transparent text-amber-500 font-mono text-xs text-right focus:outline-none"
                        />
                        <span className="text-[9px] text-gray-400 font-mono ml-1">Ω</span>
                    </div>
                </div>

                {/* Professional Metallic Terminals */}
                <div className="absolute -left-2 bottom-4 w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-700 border border-gray-500 shadow-lg flex items-center justify-center cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-slate-900/40 border border-black/20 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 rotate-45 opacity-30"></div>
                    </div>
                </div>
                <div className="absolute -right-2 bottom-4 w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-700 border border-gray-500 shadow-lg flex items-center justify-center cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-slate-900/40 border border-black/20 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 -rotate-45 opacity-30"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
