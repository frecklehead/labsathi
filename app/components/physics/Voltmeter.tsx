import React from 'react';

interface VoltmeterProps {
    voltage?: number; // in Volts
    resistance?: number; // in Ohms
    onPropertyChange?: (prop: string, value: number) => void;
}

export function Voltmeter({
    voltage = 0,
    resistance = 1000000,
    onPropertyChange
}: VoltmeterProps) {
    // Standard voltmeter range (0-12V)
    const maxVoltage = 12;
    const angle = Math.min(voltage / maxVoltage, 1) * 180 - 90;

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            {/* Voltmeter Visual - More Realistic Instrument */}
            <div className="relative w-28 h-32 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-2xl border-4 border-gray-700 shadow-2xl flex flex-col items-center p-2">
                {/* Top reflection */}
                <div className="absolute top-1.5 inset-x-1.5 h-6 bg-gradient-to-b from-white/5 to-transparent rounded-t-xl pointer-events-none"></div>

                {/* Label */}
                <div className="text-[7px] text-gray-400 font-bold tracking-wider mb-1">VOLTMETER</div>

                {/* Gauge Display with Glass Effect */}
                <div className="relative w-full h-20 bg-gradient-to-b from-slate-900 to-black rounded-lg border-2 border-gray-600 overflow-hidden shadow-inner">
                    {/* Glass reflection */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>

                    {/* Gauge Background */}
                    <svg className="w-full h-full" viewBox="0 0 100 80">
                        {/* Gauge Arc - Glowing */}
                        <defs>
                            <linearGradient id="voltArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M 10 70 A 40 40 0 0 1 90 70"
                            fill="none"
                            stroke="url(#voltArcGradient)"
                            strokeWidth="2.5"
                            opacity="0.3"
                        />

                        {/* Tick Marks */}
                        {[0, 3, 6, 9, 12].map((val, i) => {
                            const tickAngle = (val / maxVoltage) * 180 - 90;
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
                            <filter id="voltNeedleShadow">
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
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            filter="url(#voltNeedleShadow)"
                            className="transition-all duration-500 ease-out"
                        />
                        <circle cx="50" cy="70" r="2.5" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1" />
                    </svg>
                </div>

                {/* Digital Display & Control */}
                <div className="mt-1.5 w-full flex flex-col gap-1">
                    <div className="bg-black px-2 py-0.5 rounded border border-blue-900 shadow-inner flex justify-center">
                        <span className="text-blue-400 font-mono text-[11px] font-bold drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]">
                            {voltage.toFixed(2)} V
                        </span>
                    </div>

                    <div className="bg-slate-900/80 p-0.5 rounded border border-slate-700 flex flex-col items-center">
                        <span className="text-[6px] text-gray-500 uppercase font-bold tracking-tighter">Resistance</span>
                        <div className="flex items-center gap-0.5">
                            <input
                                type="number"
                                value={resistance}
                                onChange={(e) => onPropertyChange?.('internalResistance', parseInt(e.target.value) || 0)}
                                className="bg-transparent w-10 text-[9px] text-blue-400 font-mono focus:outline-none text-center"
                            />
                            <span className="text-[7px] text-gray-500">Ω</span>
                        </div>
                    </div>
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
