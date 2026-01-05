import React from "react";
import { CheckCircle } from "lucide-react";

interface EndPointData {
    detected: boolean;
    buretteInitial: number;
    buretteFinal: number;
    volumeUsed: number;
    flaskVolume: number;
    timestamp: Date;
}

interface ResultsCardProps {
    data: EndPointData | null;
    onClose?: () => void;
}

export function ResultsCard({ data, onClose }: ResultsCardProps) {
    if (!data || !data.detected) return null;

    return (
        <div className="fixed right-6 top-24 z-50 w-80 animate-in slide-in-from-right-10 duration-700">
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.3)] overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
                
                {/* Header */}
                <div className="relative p-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div>
                                <h3 className="text-sm font-bold text-white">End Point Detected!</h3>
                                <p className="text-[10px] text-cyan-300">Titration Complete ✓</p>
                            </div>
                        </div>
                        {onClose && (
                            <button 
                                onClick={onClose}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="relative p-4 space-y-4">
                    {/* Burette Readings */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded"></div>
                            Burette Readings
                        </h4>
                        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">Initial Volume:</span>
                                <span className="text-sm font-mono font-bold text-white">{data.buretteInitial.toFixed(1)} mL</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">Final Volume:</span>
                                <span className="text-sm font-mono font-bold text-white">{data.buretteFinal.toFixed(1)} mL</span>
                            </div>
                            <div className="pt-2 border-t border-slate-700/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-pink-400">Volume Used:</span>
                                    <span className="text-lg font-mono font-bold text-pink-300 bg-pink-500/10 px-2 py-1 rounded">
                                        {data.volumeUsed.toFixed(1)} mL
                                    </span>
                                </div>
                </div>
                        </div>
                    </div>

                    {/* End Point Indicator */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-purple-600 rounded"></div>
                            End Point Indicator
                        </h4>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">Color Change:</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-pink-500 animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                                    <span className="text-sm font-bold text-pink-300">Pink</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-slate-400">pH Range:</span>
                                <span className="text-sm font-mono text-white">~8-10 (Basic)</span>
                            </div>
                        </div>
                    </div>

                    {/* Solution Details */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-4 bg-gradient-to-b from-green-400 to-green-600 rounded"></div>
                            Solution Details
                        </h4>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">Flask Volume:</span>
                                <span className="text-sm font-mono text-white">{data.flaskVolume.toFixed(1)} mL</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">Titrant:</span>
                                <span className="text-sm font-mono text-white">NaOH (0.1M)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">Analyte:</span>
                                <span className="text-sm font-mono text-white">HCl (0.1M)</span>
                            </div>
                        </div>
                    </div>

                    {/* Verification Badge */}
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <div className="text-xs font-bold text-green-300">Neutralization Complete</div>
                        </div>
                        <div className="text-[10px] text-green-400/70 mt-0.5">Stoichiometric end point reached</div>
                    </div>
                </div>

                {/* Sparkle effect */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse"></div>
            </div>
        </div>
    );
}
