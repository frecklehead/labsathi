import React, { useState, useEffect } from 'react';

// Standard Physics Lab Resistance Box Values
const PLUG_DATA = [
    { id: '1', value: 10000 }, { id: '2', value: 5000 }, { id: '3', value: 2000 }, { id: '4', value: 2000 },
    { id: '5', value: 1000 }, { id: '6', value: 500 }, { id: '7', value: 200 }, { id: '8', value: 200 },
    { id: '9', value: 100 }, { id: '10', value: 50 }, { id: '11', value: 20 }, { id: '12', value: 20 },
    { id: '13', value: 10 }, { id: '14', value: 5 }, { id: '15', value: 2 }, { id: '16', value: 1 }
];

export function HighResistanceBox({
    resistance = 0,
    onResistanceChange
}: {
    resistance?: number;
    onResistanceChange?: (v: number) => void
}) {
    const [pulledKeys, setPulledKeys] = useState<Set<string>>(new Set());

    // Effect to initialize pulled keys from resistance prop on mount or prop change
    // This allows it to work as a controlled component
    useEffect(() => {
        const newPulled = new Set<string>();
        let remaining = resistance;

        // Greedy approach to match the resistance with available plugs
        // We iterate through PLUG_DATA from largest to smallest
        PLUG_DATA.forEach(plug => {
            if (remaining >= plug.value) {
                newPulled.add(plug.id);
                remaining -= plug.value;
            }
        });

        setPulledKeys(newPulled);
    }, [resistance]);

    // Calculate total resistance from current state (for user interaction)
    const currentTotal = PLUG_DATA.reduce((acc, plug) =>
        acc + (pulledKeys.has(plug.id) ? plug.value : 0), 0
    );

    const toggleKey = (id: string) => {
        const next = new Set(pulledKeys);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }

        // Calculate what the new resistance would be
        const newTotal = PLUG_DATA.reduce((acc, plug) =>
            acc + (next.has(plug.id) ? plug.value : 0), 0
        );

        // Notify parent, which will update the prop
        onResistanceChange?.(newTotal);
    };

    return (
        <div className="relative w-[360px] h-[200px] flex flex-col items-center justify-center group/rb-container">
            {/* Main Instrument Body - Scaled Down and Centered */}
            <div className="relative transform scale-90 origin-center perspective-1000">

                {/* Wooden Case */}
                <div className="
                    relative bg-[#5D4037] 
                    rounded-md shadow-[0_15px_30px_rgba(0,0,0,0.5),0_5px_15px_rgba(0,0,0,0.4)] 
                    border-[4px] border-[#3E2723]
                    p-2
                    before:content-[''] before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] before:opacity-30 before:rounded-sm
                ">
                    {/* Top Panel (Ebonite - Black polished material) */}
                    <div className="
                        relative bg-[#18181b] 
                        rounded px-6 py-6 
                        shadow-[inset_0_2px_8px_rgba(255,255,255,0.1),inset_0_-2px_10px_rgba(0,0,0,0.8)]
                        border border-[#333]
                        flex flex-col gap-5
                    ">

                        {/* Brass Terminals (Binding Posts) */}
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col items-center group/terminal">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-700 shadow-md border border-yellow-800 relative z-20 cursor-pointer hover:brightness-110">
                                <div className="absolute inset-1 rounded-full border border-yellow-200/40"></div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-black/60 blur-sm absolute top-1 left-0 transform translate-y-1"></div>
                        </div>
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col items-center group/terminal">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-700 shadow-md border border-yellow-800 relative z-20 cursor-pointer hover:brightness-110">
                                <div className="absolute inset-1 rounded-full border border-yellow-200/40"></div>
                            </div>
                        </div>

                        {/* Metallic Badge / Label */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2">
                            <div className="
                                px-3 py-0.5 
                                bg-gradient-to-b from-[#b45309] to-[#78350f]
                                rounded-[1px] 
                                text-[7px] text-yellow-100/80 font-serif tracking-[0.2em] 
                                shadow-sm border border-yellow-900/50
                                uppercase
                            ">
                                Resistance Box
                            </div>
                        </div>

                        {/* Plug Layout: 2 Rows */}
                        <div className="flex flex-col gap-6 mt-3">
                            {[PLUG_DATA.slice(0, 8), PLUG_DATA.slice(8, 16)].map((row, rowIdx) => (
                                <div key={rowIdx} className="flex items-center gap-0">
                                    {row.map((plug, idx) => {
                                        const isPulled = pulledKeys.has(plug.id);
                                        const isLast = idx === row.length - 1;

                                        return (
                                            <div key={plug.id} className="relative flex flex-col items-center">

                                                {/* Resistance Value Label - Engraved look */}
                                                <div className="
                                                    absolute -top-5
                                                    text-[8px] font-bold text-[#888] 
                                                    font-mono tracking-tighter select-none
                                                    drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]
                                                ">
                                                    {plug.value}
                                                </div>

                                                <div className="relative flex items-center">

                                                    {/* Brass Block Segment */}
                                                    <div className="
                                                        h-8 w-7
                                                        bg-gradient-to-b from-[#FCD34D] via-[#D97706] to-[#92400E]
                                                        shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),0_3px_4px_rgba(0,0,0,0.6)]
                                                        border-t border-[#FEF3C7]
                                                        relative z-0
                                                        flex items-center justify-center
                                                    ">
                                                        {/* Screw head detail */}
                                                        <div className="w-2 h-2 rounded-full border border-yellow-900/40 bg-yellow-600/20 shadow-inner"></div>
                                                    </div>

                                                    {/* The Gap / Connection Point */}
                                                    {!isLast && (
                                                        <div
                                                            className="w-3 h-6 bg-transparent relative -ml-[1px] -mr-[1px] z-10 flex items-center justify-center cursor-pointer group/key"
                                                            onClick={() => toggleKey(plug.id)}
                                                        >
                                                            {/* The Hole (Always visible but covered by key if present) */}
                                                            <div className="absolute w-2 h-2 rounded-full bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,1)] border border-white/5"></div>

                                                            {/* The Key (Plug) */}
                                                            {!isPulled && (
                                                                <div className="absolute -top-3 w-4 h-9 flex flex-col items-center transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 origin-bottom">
                                                                    {/* Key Head (Black Ebonite Handle) */}
                                                                    <div className="w-3.5 h-5 bg-gradient-to-r from-[#27272a] via-[#18181b] to-[#09090b] rounded-t-[1px] rounded-b-md shadow-lg border-t border-white/10 flex items-center justify-center">
                                                                        <div className="w-2 h-[1px] bg-white/10 mb-1"></div>
                                                                    </div>
                                                                    {/* Key Shaft (Brass) */}
                                                                    <div className="w-1.5 h-2.5 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-700 shadow-md -mt-0.5 rounded-b-[1px]"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Final Closing Block */}
                                    <div className="
                                        h-8 w-4 
                                        bg-gradient-to-b from-[#FCD34D] via-[#D97706] to-[#92400E]
                                        shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),0_3px_4px_rgba(0,0,0,0.6)]
                                        border-t border-[#FEF3C7]
                                        rounded-r-[2px]
                                        flex items-center justify-center
                                    ">
                                        <div className="w-2 h-2 rounded-full border border-yellow-900/40 bg-yellow-600/20 shadow-inner"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Digital Readout - Positioned relative to container */}
            <div className="
                absolute bottom-2 left-1/2 -translate-x-1/2
                px-3 py-1 
                bg-black/40 
                rounded border border-white/10 
                shadow-sm backdrop-blur-sm
                z-30
            ">
                <span className="text-sm font-mono text-cyan-400 font-medium tabular-nums">
                    {currentTotal} Ω
                </span>
            </div>
        </div>
    );
}

// Expose terminal offsets for the wiring system in page.tsx
// Calculations based on 360x200 container and scale-90 instrument
HighResistanceBox.terminalOffsets = [
    { name: 'left', dx: 14, dy: 96 },
    { name: 'right', dx: 346, dy: 96 }
];