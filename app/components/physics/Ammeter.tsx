import React from 'react';

interface AmmeterProps {
    current?: number; // in Amperes
}

export function Ammeter({ current = 0 }: AmmeterProps) {
    // Calculate needle angle based on current (0-2A range)
    const maxCurrent = 2;
    const angle = Math.min(current / maxCurrent, 1) * 180 - 90;

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            {/* Ammeter Visual - More Realistic Instrument */}
            <div className="relative w-28 h-32 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-2xl border-4 border-gray-700 shadow-2xl flex flex-col items-center p-2">
                {/* Top reflection */}
                <div className="absolute top-1.5 inset-x-1.5 h-6 bg-gradient-to-b from-white/5 to-transparent rounded-t-xl pointer-events-none"></div>

                {/* Label */}
                <div className="text-[7px] text-gray-400 font-bold tracking-wider mb-1">AMMETER</div>

                {/* Gauge Display with Glass Effect */}
                <div className="relative w-full h-20 bg-gradient-to-b from-slate-900 to-black rounded-lg border-2 border-gray-600 overflow-hidden shadow-inner">
                    {/* Glass reflection */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>

                    {/* Gauge Background */}
                    <svg className="w-full h-full" viewBox="0 0 100 80">
                        {/* Gauge Arc - Glowing */}
                        <defs>
                            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="50%" stopColor="#eab308" />
                                <stop offset="100%" stopColor="#22c55e" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M 10 70 A 40 40 0 0 1 90 70"
                            fill="none"
                            stroke="url(#arcGradient)"
                            strokeWidth="2.5"
                            opacity="0.3"
                        />

                        {/* Tick Marks */}
                        {[0, 0.5, 1, 1.5, 2].map((val, i) => {
                            const tickAngle = (val / maxCurrent) * 180 - 90;
                            const rad = (tickAngle * Math.PI) / 180;
                            const x1 = 50 + 35 * Math.cos(rad);
                            const y1 = 70 + 35 * Math.sin(rad);
                            const x2 = 50 + 30 * Math.cos(rad);
                            const y2 = 70 + 30 * Math.sin(rad);

                            return (
                                <g key={i}>
                                    <line
                                        x1={x1}
                                        y1={y1}
                                        x2={x2}
                                        y2={y2}
                                        stroke="#94a3b8"
                                        strokeWidth="1.5"
                                    />
                                    <text
                                        x={50 + 42 * Math.cos(rad)}
                                        y={70 + 42 * Math.sin(rad) + 2}
                                        fill="#e2e8f0"
                                        fontSize="6"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                    >
                                        {val}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Needle - Enhanced with shadow */}
                        <defs>
                            <filter id="needleShadow">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" />
                                <feOffset dx="0.8" dy="0.8" result="offsetblur" />
                                <feComponentTransfer>
                                    <feFuncA type="linear" slope="0.5" />
                                </feComponentTransfer>
                                <feMerge>
                                    <feMergeNode />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <line
                            x1="50"
                            y1="70"
                            x2={50 + 28 * Math.cos((angle * Math.PI) / 180)}
                            y2={70 + 28 * Math.sin((angle * Math.PI) / 180)}
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeLinecap="round"
                            filter="url(#needleShadow)"
                            className="transition-all duration-500 ease-out"
                        />
                        <circle cx="50" cy="70" r="2.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
                    </svg>
                </div>

                {/* Digital Display - LED style */}
                <div className="mt-1.5 bg-black px-2 py-1 rounded border border-green-900 shadow-inner">
                    <span className="text-green-400 font-mono text-[11px] font-bold drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]">
                        {current.toFixed(3)} A
                    </span>
                </div>

                {/* Professional Metallic Terminals */}
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-gray-400 to-gray-700 rounded-full border border-gray-500 shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900/40 border border-black/20 shadow-inner flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 rotate-45 opacity-40"></div>
                    </div>
                </div>
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-gray-400 to-gray-700 rounded-full border border-gray-500 shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900/40 border border-black/20 shadow-inner flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 -rotate-45 opacity-40"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
