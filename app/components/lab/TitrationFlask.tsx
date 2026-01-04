"use client";

import React, { useState, useRef, useEffect } from "react";

interface TitrationFlaskProps {
    fill?: number; // 0-100%
    color?: string; // liquid color
    className?: string;
    label?: string;
    onAddContent?: (amount: number, color: string, type: string) => void;
}

const CHEMICALS = [
    { name: 'Water', color: 'bg-blue-200/30', type: 'solvent' },
    { name: 'Analyte (Unknown)', color: 'bg-transparent', type: 'analyte' },
    { name: 'Indicator (Phenol.)', color: 'bg-pink-500/10', type: 'indicator' },
    { name: 'Acid (HCl)', color: 'bg-transparent', type: 'acid' },
    { name: 'Base (NaOH)', color: 'bg-transparent', type: 'base' },
];

export function TitrationFlask({ fill = 0, color = "bg-transparent", className = "", label, onAddContent }: TitrationFlaskProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [selectedChem, setSelectedChem] = useState(CHEMICALS[0]);
    const [amount, setAmount] = useState(50); // mL
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAdd = () => {
        if (onAddContent) {
            onAddContent(amount, selectedChem.color, selectedChem.type);
        }
        setShowMenu(false);
    };

    return (
        <div className={`relative flex flex-col items-center group ${className}`}>
            {/* Interaction Menu */}
            {showMenu && (
                <div
                    ref={menuRef}
                    className="absolute bottom-full mb-2 z-50 bg-gray-800 border border-gray-600 rounded p-3 shadow-xl w-48 no-drag"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h4 className="text-xs font-bold text-gray-400 mb-2 border-b border-gray-700 pb-1">Add Contents</h4>

                    <div className="space-y-2">
                        <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Chemical</label>
                            <select
                                className="w-full bg-gray-900 border border-gray-700 text-xs rounded p-1 text-gray-300 outline-none focus:border-blue-500"
                                value={selectedChem.name}
                                onChange={(e) => setSelectedChem(CHEMICALS.find(c => c.name === e.target.value) || CHEMICALS[0])}
                            >
                                {CHEMICALS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Vol (mL)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-900 border border-gray-700 text-xs rounded p-1 text-gray-300 outline-none focus:border-blue-500"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                min="1"
                                max="250"
                            />
                        </div>

                        <button
                            onClick={handleAdd}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-xs text-white py-1 rounded transition-colors"
                        >
                            Add to Flask
                        </button>
                    </div>
                </div>
            )}

            {/* Neck */}
            <div
                className="w-8 h-12 bg-white/10 backdrop-blur-md border-x border-t border-white/30 relative z-10 top-1 rounded-t-md shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] cursor-pointer hover:bg-white/20 transition-all duration-300"
                onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
            >
                <div className="absolute top-[-2px] -left-[2px] w-[calc(100%+4px)] h-2 bg-white/20 rounded-full border border-white/40"></div>
            </div>

            {/* Body (Trapezoid-ish) */}
            <div
                className="relative w-24 h-24 cursor-pointer hover:scale-[1.02] active:scale-100 transition-transform duration-300"
                onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
            >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/30 rounded-full rounded-t-[40%] shadow-[inset_0_-5px_15px_rgba(255,255,255,0.1)] overflow-hidden group-hover:shadow-[inset_0_-5px_20px_rgba(255,255,255,0.2)] transition-shadow duration-300">
                    {/* Liquid */}
                    <div
                        className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out ${color}`}
                        style={{ height: `${fill}%` }}
                    >
                        {/* Surface */}
                        <div className="absolute top-0 w-full h-2 bg-white/20 -translate-y-1/2 rounded-[100%] scale-x-125 opacity-50"></div>
                    </div>

                    {/* Reflection */}
                    <div className="absolute top-4 right-4 w-4 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-full -rotate-12 opacity-60 pointer-events-none"></div>
                </div>
            </div>

            {label && <span className="mt-2 text-[10px] uppercase font-bold tracking-wider text-center text-gray-500 font-mono transition-colors duration-300 group-hover:text-gray-300">{label}</span>}
        </div>
    );
}
