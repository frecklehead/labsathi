"use client";

import React, { useMemo } from "react";
import { LineChart, Trash2, Activity } from "lucide-react";

interface DataPoint {
    voltage: number;
    current: number;
    resistance: number;
    timestamp: number;
}

interface VIGraphProps {
    data: DataPoint[];
    onClear: () => void;
}

export function VIGraph({ data, onClear }: VIGraphProps) {
    // Chart dimensions scaled slightly narrower
    const width = 380;
    const height = 300;
    const padding = 50;

    // Find max values for scaling
    const maxV = useMemo(() => Math.max(5, ...data.map(p => p.voltage), 1), [data]);
    const maxI = useMemo(() => Math.max(5, ...data.map(p => p.current), 1), [data]);

    // Scale function
    const getX = (v: number) => padding + (v / maxV) * (width - padding * 2);
    const getY = (i: number) => height - padding - (i / maxI) * (height - padding * 2);

    // Generate SVG path for the data line
    const pathData = useMemo(() => {
        if (data.length < 2) return "";
        // Sort data by voltage for a cleaner line
        const sortedData = [...data].sort((a, b) => a.voltage - b.voltage);
        return sortedData.map((p, i) =>
            `${i === 0 ? "M" : "L"} ${getX(p.voltage).toFixed(1)} ${getY(p.current).toFixed(1)}`
        ).join(" ");
    }, [data, maxV, maxI]);

    return (
        <div className="bg-[#1e1e1e]/90 backdrop-blur-xl border border-[#3e3e3e] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] transition-all hover:scale-[1.01]">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-[#3e3e3e] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                        <Activity className="w-4 h-4 text-yellow-500" />
                    </div>
                    <span className="text-xs font-black text-gray-200 uppercase tracking-[0.2em]">V-I Characteristic</span>
                </div>
                <button
                    onClick={onClear}
                    title="Clear Graph"
                    className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors group"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Graph Content */}
            <div className="p-4 pt-2 relative">
                {data.length === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-gray-600">
                        <LineChart className="w-12 h-12 mb-4 opacity-20" />
                        <span className="text-xs font-bold opacity-50 uppercase tracking-[0.2em]">No data recorded</span>
                        <span className="text-[10px] opacity-30 mt-2 italic">Adjust resistance to plot real-time data</span>
                    </div>
                ) : (
                    <svg width={width} height={height} className="overflow-visible">
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map(f => (
                            <React.Fragment key={f}>
                                {/* Horizontal */}
                                <line
                                    x1={padding} y1={padding + f * (height - 2 * padding)}
                                    x2={width - padding} y2={padding + f * (height - 2 * padding)}
                                    stroke="#333" strokeWidth="0.5" strokeDasharray="2,2"
                                />
                                {/* Vertical */}
                                <line
                                    x1={padding + f * (width - 2 * padding)} y1={padding}
                                    x2={padding + f * (width - 2 * padding)} y2={height - padding}
                                    stroke="#333" strokeWidth="0.5" strokeDasharray="2,2"
                                />
                            </React.Fragment>
                        ))}

                        {/* Axes */}
                        <line x1={padding} y1={height - padding} x2={width - padding + 10} y2={height - padding} stroke="#666" strokeWidth="1.5" />
                        <line x1={padding} y1={height - padding} x2={padding} y2={padding - 10} stroke="#666" strokeWidth="1.5" />

                        {/* Labels */}
                        <text x={width / 2} y={height - 10} textAnchor="middle" fill="#aaa" fontSize="10" fontWeight="bold" className="tracking-widest capitalize">Voltage (V)</text>
                        <text x={15} y={height / 2} textAnchor="middle" fill="#aaa" fontSize="10" fontWeight="bold" transform={`rotate(-90, 15, ${height / 2})`} className="tracking-widest capitalize">Current (mA)</text>

                        {/* Scale labels */}
                        <text x={padding - 10} y={padding + 5} textAnchor="end" fill="#777" fontSize="9" fontWeight="bold">{maxI.toFixed(2)}</text>
                        <text x={width - padding} y={height - padding + 20} textAnchor="middle" fill="#777" fontSize="9" fontWeight="bold">{maxV.toFixed(2)}</text>
                        <text x={padding - 10} y={height - padding + 5} textAnchor="end" fill="yellow" fontSize="10" fontWeight="bold">0</text>

                        {/* Data Line */}
                        <path
                            d={pathData}
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-[0_0_12px_rgba(234,179,8,0.7)]"
                        />

                        {/* Data Points */}
                        {data.map((p, i) => (
                            <circle
                                key={i}
                                cx={getX(p.voltage)}
                                cy={getY(p.current)}
                                r="2.5"
                                fill="#fbbf24"
                                className="hover:scale-150 transition-transform cursor-crosshair"
                            >
                                <title>V: {p.voltage.toFixed(2)}V, I: {p.current.toFixed(1)}mA</title>
                            </circle>
                        ))}
                    </svg>
                )}

                {data.length > 0 && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/40 rounded border border-white/5 backdrop-blur-sm">
                        <span className="text-[8px] font-mono text-yellow-500/80">{data.length} pts</span>
                    </div>
                )}
            </div>
        </div>
    );
}
