import React from 'react';
import { Activity, LineChart } from 'lucide-react';

interface CircuitAnalyticsProps {
    vSource: number;
    current: number;
    gRes: number;
    rSeries: number;
    convertedRange: number;
    igMax: number;
    onShowGraph: () => void;
}

export default function CircuitAnalytics({
    vSource,
    current,
    gRes,
    rSeries,
    convertedRange,
    igMax,
    onShowGraph
}: CircuitAnalyticsProps) {
    return (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col border-b-4 border-b-blue-600/20">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-blue-900 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    Circuit Analytics
                </h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[8px] text-slate-400 mb-1 uppercase font-black tracking-tighter">EMF {"($E$)"}</div>
                    <div className="text-xl font-black text-blue-600 tabular-nums">{vSource.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-60">V</span></div>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[8px] text-slate-400 mb-1 uppercase font-black tracking-tighter">Current {"($I$)"}</div>
                    <div className="text-xl font-black text-green-600 tabular-nums">{current.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-60">mA</span></div>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[8px] text-slate-400 mb-1 uppercase font-black tracking-tighter">Resist. {"($G$)"}</div>
                    <div className="text-lg font-bold text-amber-600 tabular-nums">{gRes}<span className="text-[10px] ml-0.5 opacity-60">Ω</span></div>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[8px] text-slate-400 mb-1 uppercase font-black tracking-tighter">Series {"($R$)"}</div>
                    <div className="text-lg font-bold text-amber-600 tabular-nums">{rSeries}<span className="text-[10px] ml-0.5 opacity-60">Ω</span></div>
                </div>
                <div className="bg-blue-600 p-4 rounded-xl shadow-lg shadow-blue-600/10 col-span-2 flex items-center justify-between">
                    <div>
                        <div className="text-[8px] text-white/60 uppercase font-black tracking-tighter">Max Range {"($V$)"}</div>
                        <div className="text-lg font-black text-white">{convertedRange.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-60">V</span></div>
                    </div>
                    <div className="text-right">
                        <div className="text-[8px] text-white/60 uppercase font-black tracking-tighter">Merit {"($k$)"}</div>
                        <div className="text-sm font-bold text-white/90">{(igMax * 1000 / 30).toFixed(4)}</div>
                    </div>
                </div>
                <button
                    onClick={onShowGraph}
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black p-3 rounded-xl transition-all text-white text-[10px] font-bold col-span-2 group"
                >
                    <LineChart className="w-3.5 h-3.5 text-blue-400" />
                    Visualize V-I Curve
                </button>
            </div>
        </div>
    );
}
