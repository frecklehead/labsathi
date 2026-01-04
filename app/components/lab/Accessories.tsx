import React, { useState, useRef, useEffect } from "react";

const CHEMICALS = [
  { name: 'Water', color: 'bg-blue-200/40', type: 'solvent' },
  { name: 'Analyte', color: 'bg-transparent', type: 'analyte' },
  { name: 'Indicator', color: 'bg-pink-500/20', type: 'indicator' },
  { name: 'Acid (HCl)', color: 'bg-transparent', type: 'acid' },
  { name: 'Base (NaOH)', color: 'bg-transparent', type: 'base' },
];

export function Tile() {
  return (
    <div className="w-48 h-32 bg-white/90 rounded-sm shadow-xl transform skew-x-12 relative flex items-center justify-center overflow-hidden border-b-4 border-gray-300">
      {/* A slight gloss */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-100 to-gray-200 opacity-50"></div>
    </div>
  );
}

export function Funnel({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex flex-col items-center group ${className}`}>
      {/* Funnel Bowl (Cone) */}
      <div className="relative w-20 h-16 group-hover:scale-105 transition-transform duration-500">

        {/* Top Rim (Opening) */}
        <div className="absolute top-0 left-0 w-full h-5 bg-white/20 rounded-[100%] border-[1.5px] border-white/40 z-20 backdrop-blur-[2px] overflow-hidden">
          {/* Inner Shadow to show depth */}
          <div className="w-full h-full bg-gradient-to-b from-black/20 to-transparent"></div>
        </div>

        {/* Main Cone Body */}
        <div
          className="absolute top-2 w-full h-full bg-gradient-to-br from-white/30 via-white/10 to-black/20 backdrop-blur-md border-x border-white/20"
          style={{
            clipPath: 'polygon(0% 15%, 100% 15%, 60% 100%, 40% 100%)'
          }}
        >
          {/* Highlight streak for glass effect */}
          <div className="absolute left-1/4 top-0 w-1 h-full bg-white/20 blur-[1px] rotate-12"></div>
        </div>
      </div>

      {/* Stem/Neck */}
      <div className="relative w-4 h-14 -mt-1">
        {/* The stem itself */}
        <div className="w-full h-full bg-gradient-to-r from-white/20 via-white/5 to-black/20 backdrop-blur-md border-x border-white/20 rounded-b-sm">
          {/* Reflection on the stem */}
          <div className="absolute left-1 w-0.5 h-full bg-white/30 blur-[0.5px]"></div>
        </div>

        {/* Angled cut at the bottom of the stem for realism */}
        <div
          className="absolute bottom-0 w-full h-3 bg-white/10"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 70%)' }}
        ></div>
      </div>

      {/* Drop Shadow on the floor */}
      <div className="w-12 h-2 bg-black/10 blur-md rounded-full mt-1"></div>
    </div>
  );
}

interface MeasuringCylinderProps {
  fill?: number;
  color?: string;
  className?: string;
  onAddContent?: (amount: number, color: string, type: string) => void;
}

export function MeasuringCylinder({ fill = 0, color = "bg-blue-400", className = "", onAddContent }: MeasuringCylinderProps) {
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

  return (
    <div className={`relative flex flex-col items-center group ${className}`}>
      {/* Interaction Menu */}
      {showMenu && (
        <div ref={menuRef} className="absolute bottom-full mb-2 z-50 bg-gray-800 border border-gray-600 rounded p-3 shadow-xl w-48 no-drag cursor-auto" onClick={(e) => e.stopPropagation()}>
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
              Add to Cylinder
            </button>
          </div>
        </div>
      )}

      <div
        className={`relative w-8 h-32 bg-white/5 backdrop-blur-sm border border-white/20 rounded-b-md flex flex-col justify-end items-center shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] cursor-pointer transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] active:scale-100`}
        onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
      >
        {/* Base */}
        <div className="absolute -bottom-1 w-12 h-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-full z-10 shadow-lg group-hover:shadow-xl transition-shadow duration-300"></div>

        {/* Liquid */}
        <div className={`w-full ${color} opacity-70 transition-all duration-300 relative`} style={{ height: `${fill}%` }}>
          <div className="absolute top-0 w-full h-1 bg-white/30 -translate-y-1/2 rounded-[100%]"></div>
        </div>

        {/* Marks */}
        <div className="absolute inset-0 flex flex-col justify-evenly py-2 px-1 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-2 h-[1px] bg-white/30 self-end"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
