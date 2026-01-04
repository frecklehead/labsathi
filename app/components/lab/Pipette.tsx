"use client";

import React, { useState, useRef, useEffect } from "react";

interface PipetteProps {
    fill?: number; // 0-100%
    color?: string;
    className?: string;
    onAddContent?: (amount: number, color: string, type: string) => void;
    label?: string; // Added label prop
}

const CHEMICALS = [
    { name: 'Water', color: 'bg-blue-200/30', type: 'solvent' },
    { name: 'Analyte', color: 'bg-transparent', type: 'analyte' },
    { name: 'Titrant', color: 'bg-transparent', type: 'titrant' },
    { name: 'Acid (HCl)', color: 'bg-transparent', type: 'acid' },
    { name: 'Base (NaOH)', color: 'bg-transparent', type: 'base' },
];

export function Pipette({ fill = 0, color = "bg-yellow-500", className = "", onAddContent, label }: PipetteProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [selectedChem, setSelectedChem] = useState(CHEMICALS[0]);
    const [amount, setAmount] = useState(10); // Default small amount for pipette
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
            {/* Simple Label (Tooltop style or static) */}
            {label && <span className="absolute -top-6 text-[10px] text-gray-500 opacity-60 font-mono">{label}</span>}

            {/* Interaction Menu */}
            {showMenu && (
                <div
                    ref={menuRef}
                    className="absolute bottom-full mb-2 z-50 bg-gray-800 border border-gray-600 rounded p-3 shadow-xl w-40 no-drag cursor-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h4 className="text-xs font-bold text-gray-400 mb-2 border-b border-gray-700 pb-1">Fill Pipette</h4>
                    <div className="space-y-2">
                        <select
                            className="w-full bg-gray-900 border border-gray-700 text-xs rounded p-1 text-gray-300"
                            value={selectedChem.name}
                            onChange={(e) => setSelectedChem(CHEMICALS.find(c => c.name === e.target.value) || CHEMICALS[0])}
                        >
                            {CHEMICALS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                        <button
                            onClick={handleAdd}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-xs text-white py-1 rounded"
                        >
                            Fill
                        </button>
                    </div>
                </div>
            )}

            {/* Top Stem */}
            <div className="relative w-1.5 h-20 bg-white/20 backdrop-blur-sm border-x border-white/30 flex flex-col justify-end">
                {/* Liquid in Top Stem - Fill from 80% up to 100% (which hits mark at 50% height) */}
                {/* Mark is at top-10 (40px down). Height is 80px. Mark is at 50% of div height from top, so 50% from bottom. */}
                {/* Thus, we want 100% fill -> 50% height of this div. */}
                <div className={`w-full transition-all duration-500 ${color}`} style={{ height: `${Math.min(50, Math.max(0, (fill - 80) * 2.5))}%` }}></div>
            </div>

            {/* Bulb */}
            <div
                className="relative w-6 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full my-[-2px] z-10 overflow-hidden cursor-pointer hover:bg-white/30 transition-colors"
                onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
            >
                {/* Liquid in Bulb - roughly 60% of volume (20-80) */}
                <div className={`absolute bottom-0 w-full transition-all duration-500 ${color}`} style={{ height: `${Math.min(100, Math.max(0, (fill - 20) * 1.666))}%` }}></div>
                {/* Reflection */}
                <div className="absolute top-2 right-1 w-2 h-4 bg-white/30 rounded-full -rotate-12"></div>
            </div>

            {/* Bottom Stem */}
            <div className="relative w-1.5 h-24 bg-white/20 backdrop-blur-sm border-x border-white/30 flex flex-col justify-end items-center">
                {/* Liquid in Stem - roughly 20% of volume (0-20) */}
                <div className={`w-full transition-all duration-500 ${color}`} style={{ height: `${Math.min(100, fill * 5)}%` }}></div>
            </div>

            {/* Calibration Mark */}
            <div className="absolute top-10 w-4 h-[1px] bg-white/60"></div>
        </div>
    );
}
