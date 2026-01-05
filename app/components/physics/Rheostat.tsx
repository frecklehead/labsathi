"use client";

import React from "react";

interface RheostatProps {
    resistance?: number;
    maxResistance?: number;
    onResistanceChange?: (value: number) => void;
}

export function Rheostat({
    resistance = 50,
    maxResistance = 100,
    onResistanceChange,
}: RheostatProps) {
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        onResistanceChange?.(newValue);
    };

    return (
        <div className="flex flex-col items-center gap-6 select-none py-6">

            {/* ===== RHEOSTAT VISUAL ===== */}
            <div className="relative w-[520px] h-48">

                {/* Wooden Base */}
                <div className="absolute bottom-0 w-full h-10 rounded-md shadow-2xl
                    bg-gradient-to-b from-[#7a4b22] via-[#5a3a1a] to-[#3b2411]">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:8px_8px]" />
                </div>

                {/* Left Support */}
                <div className="absolute left-10 bottom-10 w-14 h-28 bg-gradient-to-b from-gray-900 to-black rounded shadow-xl" />

                {/* Right Support */}
                <div className="absolute right-10 bottom-10 w-14 h-28 bg-gradient-to-b from-gray-900 to-black rounded shadow-xl" />

                {/* Brass Guide Rod */}
                <div className="absolute top-14 left-24 right-24 h-1.5 rounded-full shadow-md
                    bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700" />

                {/* Resistance Coil */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-16 flex items-center">

                    {/* Coil Body */}
                    <div className="relative w-full h-14 overflow-hidden rounded-sm shadow-inner bg-gray-300">

                        <div className="absolute inset-0 flex">
                            {Array.from({ length: 140 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-full border-r border-black/10"
                                    style={{
                                        width: "2px",
                                        background:
                                            "linear-gradient(to bottom, #bfc6cc 0%, #e5e7ea 30%, #9fa6ad 50%, #e5e7ea 70%, #bfc6cc 100%)",
                                    }}
                                />
                            ))}
                        </div>

                        {/* Depth shading */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
                    </div>

                    {/* Coil End Caps */}
                    <div className="absolute -left-3 w-6 h-14 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full shadow-md" />
                    <div className="absolute -right-3 w-6 h-14 bg-gradient-to-l from-gray-600 to-gray-400 rounded-full shadow-md" />
                </div>

                {/* Sliding Contact */}
                <div
                    className="absolute top-7 transition-all duration-200 ease-out z-30"
                    style={{
                        left: `${(resistance / maxResistance) * 52 + 23.5}%`,
                    }}
                >
                    <div className="flex flex-col items-center">

                        {/* Round Knob */}
                        <div className="w-7 h-7 rounded-full shadow-lg
                            bg-gradient-to-b from-gray-800 to-black border border-gray-700" />

                        {/* Clamp */}
                        <div className="w-9 h-4 bg-gray-700 rounded-sm shadow-md" />

                        {/* Contact Arm */}
                        <div className="w-1 h-12 bg-yellow-600 shadow-sm" />
                    </div>
                </div>

                {/* Binding Post A (Left Coil End - Common) */}
                <div className="absolute bottom-[35px] left-[55px] w-6 h-6 z-40 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-800 rounded-full border border-yellow-900 shadow-lg" />
                    <div className="absolute inset-1.5 bg-yellow-400/20 rounded-full border border-yellow-900/40" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-bold text-yellow-600 uppercase">A</div>
                </div>

                {/* Binding Post B (Right Coil End) */}
                <div className="absolute bottom-[35px] right-[55px] w-6 h-6 z-40 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-800 rounded-full border border-yellow-900 shadow-lg" />
                    <div className="absolute inset-1.5 bg-yellow-400/20 rounded-full border border-yellow-900/40" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-bold text-yellow-600 uppercase">B</div>
                </div>

                {/* Binding Post C (Slider Rod End) */}
                <div className="absolute top-[50px] right-[55px] w-6 h-6 z-40 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-800 rounded-full border border-yellow-900 shadow-lg" />
                    <div className="absolute inset-1.5 bg-yellow-400/20 rounded-full border border-yellow-900/40" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-bold text-yellow-600 uppercase">C</div>
                </div>
            </div>

            {/* ===== CONTROL SLIDER ===== */}
            <div className="w-96 flex flex-col gap-3">
                <input
                    type="range"
                    min="0"
                    max={maxResistance}
                    step="0.1"
                    value={resistance}
                    onChange={handleSliderChange}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer
                        bg-gray-700 accent-yellow-600 shadow-inner"
                />

                <div className="flex justify-between items-center bg-gray-800/70 px-5 py-2 rounded-xl border border-gray-700 shadow-lg">
                    <span className="text-gray-400 text-xs uppercase tracking-wide">
                        Resistance
                    </span>
                    <span className="text-xl text-yellow-400 font-mono font-bold">
                        {resistance.toFixed(1)} Ω
                    </span>
                    <span className="text-gray-500 text-xs">
                        Max {maxResistance}Ω
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Rheostat;
