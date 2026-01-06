"use client";

import React from "react";
import { ClipboardList, TrendingUp, Zap, Gauge } from "lucide-react";

interface DataPoint {
    current: number; // in mA
    voltage: number; // in V
    timestamp: number;
}

interface PhysicsResultsCardProps {
    galvanometerResistance: number;
    fullScaleCurrent: number;
    seriesResistance: number;
    dataPoints: DataPoint[];
    onClose: () => void;
}

export function PhysicsResultsCard({
    galvanometerResistance,
    fullScaleCurrent,
    seriesResistance,
    dataPoints,
    onClose
}: PhysicsResultsCardProps) {
    const totalResistance = galvanometerResistance + seriesResistance;
    const theoreticalRange = (fullScaleCurrent / 1000) * totalResistance;

    return (
        <div className="bg-white border-[12px] border-slate-900 rounded-[48px] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.4)] w-[720px] max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-700 font-serif">
            {/* Stamp/Watermark */}
            <div className="absolute top-10 right-10 w-32 h-32 border-4 border-emerald-500/20 rounded-full flex items-center justify-center -rotate-12 pointer-events-none">
                <div className="text-[10px] font-black text-emerald-500/20 uppercase text-center tracking-tighter">Verified<br/>Calibration<br/>SUCCESS</div>
            </div>
            
            <div className="border-b-4 border-slate-900 pb-8 mb-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">Laboratory Report</h3>
                        <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Instrumentation & Calibration Division</p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-black text-slate-400 uppercase mb-1">Experiment ID</div>
                        <div className="text-sm font-bold text-slate-900">#GALV-VOLT-2026</div>
                    </div>
                </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-[32px] p-8 mb-10 flex items-center justify-between">
                <div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Effective conversion range</div>
                    <div className="text-5xl font-black text-slate-900 tracking-tighter">
                        0 — {theoreticalRange.toFixed(1)} <span className="text-xl font-medium text-slate-400">Volts</span>
                    </div>
                </div>
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
                    <Zap className="w-8 h-8 text-white" />
                </div>
            </div>

            {/* Parameter Specification */}
            <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Gauge className="w-4 h-4 text-slate-900" />
                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Device Specs</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-xs text-slate-500 font-medium">Galv. Resistance (G)</span>
                                <span className="text-sm font-bold text-slate-900 font-mono">{galvanometerResistance}Ω</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-xs text-slate-500 font-medium">Full Scale (Ig)</span>
                                <span className="text-sm font-bold text-slate-900 font-mono">{fullScaleCurrent}mA</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-slate-900" />
                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Calibration</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-xs text-slate-500 font-medium">Series Resistance (R)</span>
                                <span className="text-sm font-bold text-slate-900 font-mono">{seriesResistance}Ω</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                                <span className="text-xs text-slate-500 font-medium">Multiplier Factor</span>
                                <span className="text-sm font-bold text-indigo-600 font-mono">{(theoreticalRange/fullScaleCurrent).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-4 bg-slate-900 rounded-full" />
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Observed Calibration Values</span>
                </div>
                
                {dataPoints.length > 0 ? (
                    <div className="border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm font-mono">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Ref #</th>
                                    <th className="px-6 py-4 text-right">Galv. Current (mA)</th>
                                    <th className="px-6 py-4 text-right underline decoration-indigo-400">Converted Voltage (V)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {dataPoints.map((point, idx) => (
                                    <tr key={point.timestamp} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 font-bold text-slate-400">OP-0{idx + 1}</td>
                                        <td className="px-6 py-3 text-right font-medium text-slate-900">
                                            {point.current.toFixed(3)}
                                        </td>
                                        <td className="px-6 py-3 text-right font-black text-slate-900 text-sm">
                                            {point.voltage.toFixed(2)}V
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl">
                        <p className="text-slate-400 text-sm italic font-medium">Incomplete data set for certified report generation.</p>
                    </div>
                )}
            </div>
            
            <div className="mt-12 flex gap-4">
                <button 
                    onClick={onClose}
                    className="flex-1 py-5 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                    Dismiss Report
                </button>
                <button 
                    onClick={() => window.print()}
                    className="w-20 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all flex items-center justify-center group"
                >
                    <ClipboardList className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                </button>
            </div>
        </div>
    );
}
