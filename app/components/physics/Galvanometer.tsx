import React from 'react';

interface GalvanometerProps {
    current?: number; // in milliamperes (mA)
    internalResistance?: number; // in Ohms (G)
    fullScaleCurrent?: number; // full scale deflection current in milliamperes (mA)
    onPropertyChange?: (prop: string, value: number) => void;
}

export function Galvanometer({
    current = 0,
    internalResistance = 100,
    fullScaleCurrent = 1,
    onPropertyChange
}: GalvanometerProps) {
    // A typical galvanometer has a center-zero scale (-30 to +30 divs)
    const maxDivisions = 30;

    // Calculate needle angle (-90 to +90 degrees)
    // Clamp current between -fullScaleCurrent and fullScaleCurrent
    const clampedCurrent = Math.max(Math.min(current, fullScaleCurrent), -fullScaleCurrent);
    const angle = (clampedCurrent / fullScaleCurrent) * 45; // Max 45 degrees deflection each side

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            {/* Galvanometer Visual */}
            <div className="relative w-44 h-48 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 rounded-2xl border-4 border-slate-600 shadow-2xl flex flex-col items-center p-3">
                {/* Top reflection */}
                <div className="absolute top-2 inset-x-2 h-8 bg-gradient-to-b from-white/10 to-transparent rounded-t-xl pointer-events-none"></div>

                {/* Label */}
                <div className="text-[10px] text-slate-300 font-black tracking-[0.2em] mb-1 uppercase">Galvanometer</div>

                {/* Gauge Display */}
                <div className="relative w-full h-32 bg-slate-950 rounded-lg border-2 border-slate-600 overflow-hidden shadow-inner">
                    {/* Glass reflection */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-20"></div>

                    <svg className="w-full h-full" viewBox="0 0 100 85">
                        <defs>
                            <filter id="gNeedleShadow">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" />
                                <feOffset dx="0.5" dy="0.5" result="offsetblur" />
                                <feMerge>
                                    <feMergeNode />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Scale Arc */}
                        <path
                            d="M 15 75 A 35 35 0 0 1 85 75"
                            fill="none"
                            stroke="#475569"
                            strokeWidth="1.5"
                        />

                        {/* Tick Marks (Center Zero: -30, -20, -10, 0, 10, 20, 30) */}
                        {[-30, -20, -10, 0, 10, 20, 30].map((div, i) => {
                            const actualAngle = (div / 30) * 45 - 90;
                            const rad = (actualAngle * Math.PI) / 180;

                            const x1 = 50 + 38 * Math.cos(rad);
                            const y1 = 78 + 38 * Math.sin(rad);
                            const x2 = 50 + (div % 10 === 0 ? 32 : 35) * Math.cos(rad);
                            const y2 = 78 + (div % 10 === 0 ? 32 : 35) * Math.sin(rad);

                            return (
                                <g key={i}>
                                    <line
                                        x1={x1}
                                        y1={y1}
                                        x2={x2}
                                        y2={y2}
                                        stroke={div === 0 ? "#ef4444" : "#94a3b8"}
                                        strokeWidth={div % 10 === 0 ? "1.5" : "1"}
                                    />
                                    {div % 10 === 0 && (
                                        <text
                                            x={50 + 44 * Math.cos(rad)}
                                            y={78 + 44 * Math.sin(rad) + 2}
                                            fill="#e2e8f0"
                                            fontSize="6"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                        >
                                            {Math.abs(div)}
                                        </text>
                                    )}
                                </g>
                            );
                        })}

                        {/* The Large 'G' */}
                        <text x="50" y="65" fill="#334155" fontSize="18" fontWeight="900" textAnchor="middle" opacity="0.3">G</text>

                        {/* Needle */}
                        <g transform={`rotate(${angle}, 50, 78)`}>
                            <line
                                x1="50"
                                y1="78"
                                x2="50"
                                y2="40"
                                stroke="#ef4444"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                filter="url(#gNeedleShadow)"
                                className="transition-all duration-700 ease-out"
                            />
                        </g>

                        {/* Pivot point */}
                        <circle cx="50" cy="78" r="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <circle cx="50" cy="78" r="1.5" fill="#ef4444" />
                    </svg>
                </div>

                {/* Dynamic Controls / Labels */}
                <div className="w-full mt-2 grid grid-cols-2 gap-2">
                    <div className="bg-slate-900/80 p-1.5 rounded border border-slate-600/50 flex flex-col items-center">
                        <span className="text-[7px] text-slate-500 uppercase font-bold">Resist. (G)</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={internalResistance}
                                onChange={(e) => onPropertyChange?.('internalResistance', parseInt(e.target.value) || 0)}
                                className="bg-transparent w-10 text-[10px] text-amber-500 font-mono focus:outline-none text-center"
                            />
                            <span className="text-[8px] text-slate-500">Ω</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded border border-slate-600/50 flex flex-col items-center">
                        <span className="text-[7px] text-slate-500 uppercase font-bold">Max (Ig)</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                step="0.1"
                                value={fullScaleCurrent}
                                onChange={(e) => onPropertyChange?.('fullScaleCurrent', parseFloat(e.target.value) || 0)}
                                className="bg-transparent w-10 text-[10px] text-green-500 font-mono focus:outline-none text-center"
                            />
                            <span className="text-[8px] text-slate-500">mA</span>
                        </div>
                    </div>
                </div>

                {/* Figure of Merit (k = Ig / n) */}
           

                {/* Divisions Display */}
                <div className="mt-1 bg-slate-900 w-full px-3 py-1.5 rounded border border-slate-600 shadow-inner flex items-center justify-between col-span-2">
                    <div className="flex flex-col">
                        <span className="text-[7px] text-slate-500 uppercase font-bold leading-tight">Reading</span>
                        <span className="text-amber-400 font-mono text-xs font-black">
                            {Math.abs(Math.round((clampedCurrent / fullScaleCurrent) * maxDivisions))} Div
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-[7px] text-slate-500 uppercase font-bold leading-tight">Direction</span>
                        <div className="text-slate-300 text-[9px] font-bold">
                            {clampedCurrent > 0.001 ? '→ Right' : clampedCurrent < -0.001 ? '← Left' : 'Zero'}
                        </div>
                    </div>
                </div>

                {/* Professional Metallic Terminals */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-700 rounded-full border border-gray-500 shadow-lg flex items-center justify-center cursor-pointer group/term">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900/40 border border-black/20 shadow-inner flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 rotate-45 opacity-40"></div>
                    </div>
                    <div className="absolute -bottom-3 text-[5px] text-red-500 font-bold group-hover/term:scale-110 transition-transform">+</div>
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-700 rounded-full border border-gray-500 shadow-lg flex items-center justify-center cursor-pointer group/term">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900/40 border border-black/20 shadow-inner flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 -rotate-45 opacity-40"></div>
                    </div>
                    <div className="absolute -bottom-3 text-[5px] text-blue-500 font-bold group-hover/term:scale-110 transition-transform">-</div>
                </div>
            </div>
        </div>
    );
}
