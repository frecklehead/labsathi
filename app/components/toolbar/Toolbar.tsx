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
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Galvanometer to voltmeter</h2>
                </div>
            <div className="flex items-center gap-3">
                {connectingFrom && (
                    <button
                        onClick={onCancelWire}
                        className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 
                bg-gradient-to-b from-zinc-800 to-black border border-black
                shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.3)] 
                hover:brightness-125 transition-all active:scale-95"
                    >
                        Cancel Wire
                    </button>
                )}
                <button
                    onClick={onClearWires}
                    className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest 
    text-zinc-300 hover:text-white transition-all duration-300
    bg-gradient-to-b from-zinc-800 to-black border border-black
    shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.3)] 
    hover:brightness-125 active:scale-95"
                >
                    Clear Wires
                </button>
                <button
                    onClick={onReset}
                    className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest 
    text-zinc-300 hover:text-white transition-all duration-300
    bg-gradient-to-b from-zinc-800 to-black border border-black
    shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.3)] 
    hover:brightness-125 active:scale-95"
                >
                    Reset Workbench
                </button>
            </div>
        </div>
    );
}
