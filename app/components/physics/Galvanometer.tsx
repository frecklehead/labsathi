import React from 'react';

interface GalvanometerProps {
    current?: number; // in milliamperes (mA)
}

export function Galvanometer({ current = 0 }: GalvanometerProps) {
    // A typical galvanometer has a center-zero scale (-30 to +30 divs)
    // Let's assume max current of 1mA correlates to full scale deflection
    const maxCurrent = 1; // 1mA
    const maxDivisions = 30;

    // Calculate needle angle (-90 to +90 degrees)
    // Clamp current between -1 and 1 mA
    const clampedCurrent = Math.max(Math.min(current, maxCurrent), -maxCurrent);
    const angle = (clampedCurrent / maxCurrent) * 90;

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            {/* Galvanometer Visual */}
            <div className="relative w-36 h-40 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 rounded-2xl border-4 border-slate-600 shadow-2xl flex flex-col items-center p-3">
                {/* Top reflection */}
                <div className="absolute top-2 inset-x-2 h-8 bg-gradient-to-b from-white/10 to-transparent rounded-t-xl pointer-events-none"></div>

                {/* Label */}
                <div className="text-[10px] text-slate-300 font-black tracking-[0.2em] mb-1">GALVANOMETER</div>

                {/* Gauge Display */}
                <div className="relative w-full h-28 bg-slate-950 rounded-lg border-2 border-slate-600 overflow-hidden shadow-inner">
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
                            const tickAngle = (div / 30) * 90 - 90; // Relative to top? No, let's adjust for SVG coord system.
                            // -90 is vertical (0), -180 is left, 0 is right.
                            // For -30 to 30: -135deg to -45deg
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

                {/* Divisions Display */}
                <div className="mt-2 bg-slate-900 px-3 py-1 rounded border border-slate-600 shadow-inner">
                    <span className="text-amber-400 font-mono text-xs font-bold">
                        {Math.abs(Math.round((clampedCurrent / maxCurrent) * maxDivisions))} Div
                    </span>
                    <span className="text-slate-500 text-[8px] ml-1 uppercase">{clampedCurrent >= 0 ? 'Right' : 'Left'}</span>
                </div>

                {/* Professional Metallic Terminals */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-700 rounded-full border border-gray-500 shadow-lg flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900/40 border border-black/20 shadow-inner flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 rotate-45 opacity-40"></div>
                    </div>
                    <div className="absolute -bottom-3 text-[5px] text-red-500 font-bold">+</div>
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-700 rounded-full border border-gray-500 shadow-lg flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900/40 border border-black/20 shadow-inner flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 -rotate-45 opacity-40"></div>
                    </div>
                    <div className="absolute -bottom-3 text-[5px] text-blue-500 font-bold">-</div>
                </div>
            </div>
        </div>
    );
}
