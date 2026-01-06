import React from 'react';

interface ToolbarProps {
    connectingFrom: { itemId: string; terminal: string } | null;
    onCancelWire: () => void;
    onClearWires: () => void;
    onReset: () => void;
}

export default function Toolbar({
    connectingFrom,
    onCancelWire,
    onClearWires,
    onReset
}: ToolbarProps) {
    return (
        <div className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6">
            <div className="flex flex-col">
                <h2 className="text-sm font-bold text-blue-900">Experiment Environment</h2>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Session</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {connectingFrom && (
                    <button
                        onClick={onCancelWire}
                        className="bg-amber-50 text-amber-600 hover:bg-amber-100 px-4 py-1.5 rounded-lg text-xs font-bold border border-amber-100 transition-all active:scale-95"
                    >
                        Cancel Wire
                    </button>
                )}
                <button
                    onClick={onClearWires}
                    className="bg-slate-50 text-slate-600 hover:bg-slate-100 px-4 py-1.5 rounded-lg text-xs font-bold border border-slate-100 transition-all active:scale-95"
                >
                    Clear Wires
                </button>
                <button
                    onClick={onReset}
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                    Reset Workbench
                </button>
            </div>
        </div>
    );
}
