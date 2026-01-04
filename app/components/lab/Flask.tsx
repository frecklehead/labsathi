import React, { useState, useRef, useEffect } from "react";

interface FlaskProps {
    fill?: number; // 0-100
    color?: string; // liquid color
    className?: string;
    label?: string;
    onAddContent?: (amount: number, color: string, type: string) => void;
}

const CHEMICALS = [
    { name: 'Water', color: 'bg-blue-200/40', type: 'solvent' },
    { name: 'Analyte', color: 'bg-transparent', type: 'analyte' },
    { name: 'Indicator', color: 'bg-pink-500/20', type: 'indicator' },
    { name: 'Acid (HCl)', color: 'bg-transparent', type: 'acid' },
    { name: 'Base (NaOH)', color: 'bg-transparent', type: 'base' },
];

export function Flask({ fill = 20, color = "bg-transparent", className = "", label, onAddContent }: FlaskProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [selectedChem, setSelectedChem] = useState(CHEMICALS[0]);
    const [amount, setAmount] = useState(50);
    const menuRef = useRef<HTMLDivElement>(null);

    // Path representing the specific Erlenmeyer shape from your image
    const flaskShapePath = "M 38,10 L 38,40 L 10,105 Q 8,115 50,115 Q 92,115 90,105 L 62,40 L 62,10 Z";

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
        if (onAddContent) onAddContent(amount, selectedChem.color, selectedChem.type);
        setShowMenu(false);
    };

    return (
        <div className={`relative flex flex-col items-center ${className}`}>
            {showMenu && (
                <div ref={menuRef} className="absolute bottom-full mb-4 z-50 bg-gray-800 border border-gray-600 rounded p-3 shadow-xl w-48 no-drag cursor-auto">
                    <h4 className="text-xs font-bold text-gray-400 mb-2 border-b border-gray-700 pb-1">Add Contents</h4>
                    <div className="space-y-2">
                        <select
                            className="w-full bg-gray-900 border border-gray-700 text-xs rounded p-1 text-gray-300 outline-none focus:border-blue-500"
                            value={selectedChem.name}
                            onChange={(e) => setSelectedChem(CHEMICALS.find(c => c.name === e.target.value) || CHEMICALS[0])}
                        >
                            {CHEMICALS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                        <input
                            type="number"
                            className="w-full bg-gray-900 border border-gray-700 text-xs rounded p-1 text-gray-300 outline-none focus:border-blue-500"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                        />
                        <button onClick={handleAdd} className="w-full bg-blue-600 hover:bg-blue-500 text-xs text-white py-1 rounded transition-colors">
                            Add to Flask
                        </button>
                    </div>
                </div>
            )}

            <div
                className="relative w-32 h-40 cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
            >
                <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-2xl overflow-visible">
                    <defs>
                        <clipPath id="flask-clip">
                            <path d={flaskShapePath} />
                        </clipPath>
                        <linearGradient id="glass-gradient" x1="0" x2="1" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                            <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
                        </linearGradient>
                    </defs>

                    {/* Liquid Layer */}
                    <g clipPath="url(#flask-clip)">
                        <rect
                            x="0"
                            y={115 - (fill * 1.05)} // Adjusted mapping for the taller base
                            width="100"
                            height="120"
                            className={`transition-all duration-1000 ease-in-out ${color} opacity-80`}
                        />
                        {/* Liquid Surface highlight */}
                        <path
                            d={`M 0,${115 - (fill * 1.05)} L 100,${115 - (fill * 1.05)}`}
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="1"
                        />
                    </g>

                    {/* Glass Body with the original textures */}
                    <path
                        d={flaskShapePath}
                        fill="url(#glass-gradient)"
                        stroke="rgba(255,255,255,0.6)"
                        strokeWidth="1.5"
                        className="backdrop-blur-[1px]"
                    />

                    {/* Rim (tighter for the narrower neck) */}
                    <ellipse cx="50" cy="10" rx="12" ry="2.5" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="1.5" strokeOpacity="0.8" />

                    {/* Graduations matching the image layout */}
                    <g className="font-mono text-[4px] fill-gray-400 opacity-60 select-none">
                        <line x1="45" y1="60" x2="55" y2="60" stroke="currentColor" strokeWidth="0.5" />
                        <text x="57" y="61" textAnchor="start">250ml</text>
                        <text x="43" y="61" textAnchor="end">0</text>

                        <line x1="42" y1="75" x2="58" y2="75" stroke="currentColor" strokeWidth="0.5" />
                        <text x="60" y="76" textAnchor="start">200</text>
                        <text x="40" y="76" textAnchor="end">50</text>

                        <line x1="38" y1="90" x2="62" y2="90" stroke="currentColor" strokeWidth="0.5" />
                        <text x="64" y="91" textAnchor="start">150</text>
                        <text x="36" y="91" textAnchor="end">100</text>
                    </g>

                    {/* Reflections */}
                    <path d="M 42,15 Q 43,40 25,100" fill="none" stroke="white" strokeWidth="0.8" strokeOpacity="0.2" />
                </svg>
            </div>

            {label && <span className="mt-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest">{label}</span>}
        </div>
    );
}