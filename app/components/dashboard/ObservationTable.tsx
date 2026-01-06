import React from 'react';
import { LineChart } from 'lucide-react';
import { DataPoint } from '../../types/circuit.types';

interface ObservationTableProps {
    dataPoints: DataPoint[];
    onClear: () => void;
}

export default function ObservationTable({ dataPoints, onClear }: ObservationTableProps) {
    return (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col flex-1 border-b-4 border-b-cyan-600/20">
            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-blue-900 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                    <LineChart className="w-3.5 h-3.5 text-cyan-600" />
                    Observation Table
                </h2>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{dataPoints.length} pts</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                        <tr className="border-b border-slate-100">
                            <th className="px-4 py-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center">S.N.</th>
                            <th className="px-4 py-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter">Voltage (V)</th>
                            <th className="px-4 py-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter">Current (mA)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {dataPoints.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-12 text-center text-[10px] font-medium text-slate-400 italic">
                                    No readings recorded. Vary the rheostat to capture data.
                                </td>
                            </tr>
                        ) : (
                            dataPoints.slice().reverse().slice(0, 10).map((dp, idx) => (
                                <tr key={dp.timestamp} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-4 py-2.5 text-[10px] font-mono text-slate-400 text-center">{dataPoints.length - idx}</td>
                                    <td className="px-4 py-2.5 text-[11px] font-extrabold text-blue-600 tabular-nums">{dp.voltage.toFixed(3)}</td>
                                    <td className="px-4 py-2.5 text-[11px] font-extrabold text-green-600 tabular-nums">{dp.current.toFixed(3)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {dataPoints.length > 0 && (
                <div className="p-3 border-t border-slate-100 flex justify-center bg-slate-50/30">
                    <button
                        onClick={onClear}
                        className="text-[9px] font-black text-red-500/60 hover:text-red-600 uppercase tracking-widest transition-colors py-1 px-4"
                    >
                        Clear History
                    </button>
                </div>
            )}
        </div>
    );
}
