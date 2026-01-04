"use client";

import React, { useState, useRef, useEffect } from "react";

const CHEMICALS = [
    { name: 'Water', color: 'bg-blue-200/30', type: 'solvent' },
    { name: 'Analyte', color: 'bg-transparent', type: 'analyte' },
    { name: 'Acid (HCl)', color: 'bg-transparent', type: 'acid' },
    { name: 'Base (NaOH)', color: 'bg-transparent', type: 'base' },
];

interface TubeProps {
    fill?: number; // 0 to 100
    color?: string; // hex or tailwind color class
    size?: "sm" | "md" | "lg";
    label?: string;
    className?: string;
    onAddContent?: (amount: number, color: string, type: string) => void;
}

export function Tube({
    fill = 0,
    color = "bg-blue-500",
    size = "md",
    label,
    className = "",
    onAddContent
}: TubeProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [selectedChem, setSelectedChem] = useState(CHEMICALS[0]);
    const [amount, setAmount] = useState(10);
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

    const sizeClasses = {
        sm: "w-8 h-24",
        md: "w-12 h-40",
        lg: "w-16 h-56",
    };

    return (
        <div
            className={`relative flex flex-col items-center justify-end ${sizeClasses[size]} ${className} group`}
        >
            {/* Interaction Menu */}
            {showMenu && (
                <div
                    ref={menuRef}
                    className="absolute bottom-full mb-2 z-50 bg-gray-800 border border-gray-600 rounded p-3 shadow-xl w-40 no-drag cursor-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h4 className="text-xs font-bold text-gray-400 mb-2 border-b border-gray-700 pb-1">Fill Tube</h4>
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

            {/* Label */}
            {label && (
                <span className="absolute -top-6 text-xs font-medium text-gray-500 whitespace-nowrap">
                    {label}
                </span>
            )}

            {/* Tube Body (Glass) */}
            <div
                className="relative w-full h-full overflow-hidden rounded-b-full rounded-t-lg bg-white/10 backdrop-blur-md border border-white/30 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] cursor-pointer hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
            >

                {/* Shine/Reflection */}
                <div className="absolute top-0 left-2 w-1 h-3/4 bg-gradient-to-b from-white/40 to-transparent rounded-full opacity-60 z-20 pointer-events-none"></div>
                <div className="absolute top-0 right-2 w-0.5 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-full opacity-40 z-20 pointer-events-none"></div>

                {/* Liquid */}
                <div
                    className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out ${color} shadow-[0_0_20px_rgba(0,0,0,0.1)]`}
                    style={{ height: `${fill}%` }}
                >
                    {/* Liquid surface/meniscus */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-white/30 -translate-y-1/2 scale-x-110 rounded-[100%]"></div>

                    {/* Bubbles (visual decoration) */}
                    {fill > 10 && (
                        <>
                            <div className="absolute bottom-2 left-1/4 w-1 h-1 bg-white/40 rounded-full animate-bounce delay-100"></div>
                            <div className="absolute bottom-4 left-3/4 w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce delay-300"></div>
                        </>
                    )}
                </div>
            </div>

            {/* Tube Rim */}
            <div className="absolute top-[-2px] w-[110%] h-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/40 z-30 shadow-sm"></div>
        </div>
    )


};



