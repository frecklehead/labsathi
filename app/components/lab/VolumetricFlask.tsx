import React, { useState, useRef, useEffect } from "react";

interface VolumetricFlaskProps {
    fill?: number; // 0-100
    color?: string; // liquid color
    className?: string;
    label?: string;
    onAddContent?: (amount: number, color: string, type: string) => void;
    currentStep?: number; // Guide step for contextual hints
    containerState?: {
        totalVolume: number;
        molesH: number;
        molesOH: number;
        hasIndicator: boolean;
    };
}

const CHEMICALS = [
    { name: 'Water', color: 'bg-blue-200/30', type: 'solvent' },
    { name: 'Analyte (Unknown)', color: 'bg-transparent', type: 'analyte' },
    { name: 'Indicator (Phenol.)', color: 'bg-pink-500/10', type: 'indicator' },
    { name: 'Acid (HCl)', color: 'bg-transparent', type: 'acid' },
    { name: 'Base (NaOH)', color: 'bg-transparent', type: 'base' },
];

export function VolumetricFlask({ fill = 0, color = "bg-blue-200/50", className = "", label, onAddContent, currentStep = 0, containerState }: VolumetricFlaskProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [selectedChem, setSelectedChem] = useState(CHEMICALS[0]);
    const [amount, setAmount] = useState(50); // mL
    const menuRef = useRef<HTMLDivElement>(null);

    // Determine recommended chemical based on current step
    const getRecommendation = () => {
        if (currentStep === 6) return { chem: 'Acid (HCl)', amount: 50, hint: 'Add 50ml HCl (0.1M)' };
        if (currentStep === 7) return { chem: 'Indicator (Phenol.)', amount: 5, hint: 'Add 5ml Phenolphthalein' };
        return null;
    };

    const recommendation = getRecommendation();

    // Auto-select recommended chemical when step changes
    useEffect(() => {
        if (recommendation) {
            const chem = CHEMICALS.find(c => c.name === recommendation.chem);
            if (chem) {
                setSelectedChem(chem);
                setAmount(recommendation.amount);
            }
        }
    }, [recommendation?.chem, recommendation?.amount]);

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
            {/* Step Hint Badge */}
            {recommendation && !showMenu && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                        {recommendation.hint}
                    </div>
                </div>
            )}

            {/* State Display */}
            {containerState && (
                <div className="absolute -right-20 top-0 bg-slate-800/90 backdrop-blur border border-slate-600 rounded p-2 text-[9px] font-mono space-y-1 shadow-xl pointer-events-none z-30">
                    <div className="text-slate-400 font-bold border-b border-slate-700 pb-1 mb-1">Flask Status</div>
                    <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Volume:</span>
                        <span className="text-cyan-400">{containerState.totalVolume.toFixed(0)}ml</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Indicator:</span>
                        <span className={containerState.hasIndicator ? "text-green-400" : "text-red-400"}>
                            {containerState.hasIndicator ? "✓ Added" : "✗ None"}
                        </span>
                    </div>
                    {containerState.molesH > 0 && (
                        <div className="flex justify-between gap-2">
                            <span className="text-slate-500">H⁺:</span>
                            <span className="text-red-400">{(containerState.molesH * 1000).toFixed(2)}mmol</span>
                        </div>
                    )}
                    {containerState.molesOH > 0 && (
                        <div className="flex justify-between gap-2">
                            <span className="text-slate-500">OH⁻:</span>
                            <span className="text-blue-400">{(containerState.molesOH * 1000).toFixed(2)}mmol</span>
                        </div>
                    )}
                </div>
            )}

            {/* Interaction Menu */}
            {showMenu && (
                <div
                    ref={menuRef}
                    className="absolute bottom-full mb-2 z-50 bg-gray-800 border border-gray-600 rounded p-3 shadow-xl w-48 no-drag"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h4 className="text-xs font-bold text-gray-400 mb-2 border-b border-gray-700 pb-1">Add Contents</h4>

                    {recommendation && (
                        <div className="mb-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded text-[10px] text-cyan-300">
                            💡 Recommended: {recommendation.hint}
                        </div>
                    )}

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

            {/* Stopper (optional visual) */}
            <div className="w-3 h-2 bg-white/20 mb-[1px] rounded-sm backdrop-blur-sm"></div>

            {/* Long Neck */}
            <div
                className="relative w-4 h-24 bg-white/10 backdrop-blur-md border-x border-white/30 z-10 shadow-[inset_0_0_5px_rgba(255,255,255,0.1)] overflow-hidden cursor-pointer hover:bg-white/20 transition-all duration-300"
                onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
            >
                {/* Graduation Mark */}
                <div className="absolute top-8 w-full h-[1px] bg-white/40 shadow-[0_0_2px_rgba(255,255,255,0.5)]"></div>

                {/* Liquid in Neck (if full enough) */}
                <div
                    className={`absolute bottom-0 left-0 w-full transition-colors duration-1000 ease-in-out ${color}`}
                    style={{
                        height: fill > 80 ? `${(fill - 80) * 5}%` : '0%',
                        transition: 'height 1s ease-in-out, background-color 1s ease-in-out'
                    }}
                ></div>
                <div className="absolute top-0 left-0.5 w-[1px] h-full bg-white/20"></div>
            </div>

            {/* Bulbous Body */}
            <div
                className="relative w-20 h-20 -mt-1 cursor-pointer hover:scale-[1.02] active:scale-100 transition-transform duration-300"
                onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
            >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/30 rounded-full shadow-[inset_0_-5px_15px_rgba(255,255,255,0.1)] overflow-hidden group-hover:shadow-[inset_0_-5px_20px_rgba(255,255,255,0.2)] transition-shadow duration-300">
                    {/* Liquid in Body */}
                    <div
                        className={`absolute bottom-0 left-0 w-full rounded-b-full ${color}`}
                        style={{
                            height: fill > 80 ? '100%' : `${fill * 1.25}%`,
                            transition: 'height 1s ease-in-out, background-color 1s ease-in-out'
                        }}
                    >
                        <div className="absolute top-0 w-full h-4 bg-white/20 -translate-y-1/2 rounded-[100%] scale-x-125 opacity-30"></div>
                    </div>

                    {/* Reflection */}
                    <div className="absolute top-4 right-4 w-5 h-10 bg-gradient-to-b from-white/40 to-transparent rounded-full -rotate-45 opacity-50 pointer-events-none"></div>
                </div>
            </div>

            {label && <span className="mt-2 text-[10px] uppercase font-bold tracking-wider text-center text-gray-500 font-mono transition-colors duration-300 group-hover:text-gray-300">{label}</span>}
        </div>
    );
}
