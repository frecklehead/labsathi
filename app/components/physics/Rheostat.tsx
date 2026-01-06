"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";

interface RheostatProps {
    id?: string;
    resistance?: number;
    maxResistance?: number;
    onResistanceChange?: (value: number) => void;
    onTerminalClick?: (itemId: string, terminalName: string) => void;
}

export function Rheostat({
    id = "rheostat-1",
    resistance = 50,
    maxResistance = 100,
    onResistanceChange,
    onTerminalClick,
}: RheostatProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Ultra-compact: 240px width
    const TRACK_START = 240 * 0.20; // 48px
    const TRACK_END = 240 * 0.80;   // 192px
    const TRACK_WIDTH = TRACK_END - TRACK_START;

    const x = useMotionValue(TRACK_START + (resistance / maxResistance) * TRACK_WIDTH);

    useEffect(() => {
        if (!isDragging) {
            const currentX = TRACK_START + (resistance / maxResistance) * TRACK_WIDTH;
            x.set(currentX);
        }
    }, [resistance, maxResistance, isDragging, TRACK_START, TRACK_WIDTH]);

    const handleDrag = () => {
        const currentX = x.get();
        let percentage = (currentX - TRACK_START) / TRACK_WIDTH;
        percentage = Math.max(0, Math.min(1, percentage));
        onResistanceChange?.(percentage * maxResistance);
    };

    const handleTerminalInternalClick = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        onTerminalClick?.(id, name);
    };

    return (
        <div className="flex flex-col items-center gap-3 select-none py-1">

            {/* ===== RHEOSTAT VISUAL (Ultra-Compact 240px) ===== */}
            <div
                ref={containerRef}
                className="relative w-[240px] h-28 cursor-default"
            >
                {/* Wooden Base */}
                <div className="absolute bottom-0 w-full h-6 rounded-lg shadow-lg
                    bg-gradient-to-b from-[#8b5a2b] via-[#5d3a1a] to-[#3d2610]">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
                </div>

                {/* Left Support Pillar */}
                <div className="absolute left-4 bottom-6 w-8 h-16 bg-gradient-to-b from-slate-800 via-slate-950 to-black rounded-lg shadow-lg" />

                {/* Right Support Pillar */}
                <div className="absolute right-4 bottom-6 w-8 h-16 bg-gradient-to-b from-slate-800 via-slate-950 to-black rounded-lg shadow-lg" />

                {/* Brass Guide Rod */}
                <div className="absolute top-8 left-10 right-10 h-0.5 rounded-full shadow-sm
                    bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800" />

                {/* Main Coil Assembly */}
                <div className="absolute top-14 left-1/2 -translate-x-1/2 w-36 h-10 flex items-center">

                    {/* Ceramic Core */}
                    <div className="relative w-full h-8 overflow-hidden rounded-md shadow-inner bg-slate-200 border border-black/10">
                        <div className="absolute inset-0 flex">
                            {Array.from({ length: 60 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-full border-r border-black/5"
                                    style={{
                                        width: "2px",
                                        background: "linear-gradient(to bottom, #bfc6cc 0%, #e5e7ea 30%, #9fa6ad 50%, #e5e7ea 70%, #bfc6cc 100%)",
                                    }}
                                />
                            ))}
                        </div>

                        {/* Contact Glow */}
                        <motion.div
                            className="absolute top-0 bottom-0 w-6 bg-yellow-400/20 blur-md pointer-events-none z-10"
                            style={{
                                left: x,
                                x: "-50%",
                                marginLeft: "-120px"
                            }}
                        />

                        {/* Subtle Shading */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
                    </div>

                    {/* Coil End Caps */}
                    <div className="absolute -left-1.5 w-4 h-9 bg-gradient-to-r from-gray-700 to-gray-500 rounded-full shadow-md" />
                    <div className="absolute -right-1.5 w-4 h-9 bg-gradient-to-l from-gray-700 to-gray-500 rounded-full shadow-md" />
                </div>

                {/* Slider Handle (Knob) */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: TRACK_START, right: TRACK_END }}
                    dragMomentum={false}
                    dragElastic={0}
                    style={{ x }}
                    onDragStart={() => setIsDragging(true)}
                    onDrag={handleDrag}
                    onDragEnd={() => setIsDragging(false)}
                    className="absolute top-4 z-30 flex flex-col items-center cursor-grab active:cursor-grabbing"
                    initial={false}
                >
                    <motion.div
                        style={{ x: "-50%" }}
                        animate={{
                            scale: isDragging ? 1.1 : 1,
                            y: isDragging ? -1 : 0
                        }}
                        className="flex flex-col items-center"
                    >
                        {/* Compact Knob */}
                        <div className="w-6 h-6 rounded-full shadow-md
                            bg-gradient-to-br from-gray-700 via-gray-950 to-black border border-white/10"
                        />
                        {/* Polished Clamp */}
                        <div className="w-6 h-2 bg-gradient-to-b from-slate-700 to-slate-900 rounded-sm shadow-sm mt-[-1px] border-t border-white/10" />
                        {/* Brass Brush */}
                        <div className="w-1 h-6 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-800 shadow-sm" />
                    </motion.div>
                </motion.div>

                {/* Terminals (Ultra-Compact) */}
                {[
                    { label: 'A', pos: 'bottom-[18px] left-[25px]' },
                    { label: 'B', pos: 'bottom-[18px] right-[25px]' },
                    { label: 'C', pos: 'top-[16px] right-[45px]' }
                ].map((term) => (
                    <div
                        key={term.label}
                        className={`absolute ${term.pos} w-5 h-5 z-40 cursor-pointer group/terminal`}
                        onClick={(e) => handleTerminalInternalClick(e, term.label)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-900 rounded-full border border-yellow-950 shadow-md transition-all group-hover/terminal:brightness-110 group-active/terminal:scale-95" />
                        <div className="absolute inset-1 bg-yellow-300/10 rounded-full border border-yellow-900/40" />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[6px] font-black text-yellow-500 uppercase tracking-widest">{term.label}</div>
                    </div>
                ))}
            </div>

            {/* ===== ULTRA-COMPACT PILL DISPLAY ===== */}
            <div className="flex gap-3 items-center">
                <motion.div
                    layout
                    className="flex items-center bg-[#0d1117]/95 backdrop-blur-xl px-5 py-2 rounded-full border border-white/5 shadow-xl space-x-4"
                >
                    <div className="flex flex-col">
                        <span className="text-slate-500 text-[6px] font-bold uppercase tracking-[0.15em] mb-0.5 opacity-80">
                            Resist.
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg text-cyan-400 font-mono font-black drop-shadow-[0_0_5px_rgba(34,211,238,0.3)] tabular-nums">
                                {resistance.toFixed(1)}
                            </span>
                            <span className="text-cyan-600 font-black text-[10px] opacity-70">Ω</span>
                        </div>
                    </div>

                    <div className="h-4 w-px bg-white/5" />

                    <div className="flex flex-col items-end justify-center">
                        <span className="text-slate-500 text-[6px] font-bold uppercase tracking-[0.1em] opacity-80">Max</span>
                        <span className="text-slate-300 font-mono font-bold text-sm tracking-tighter">{maxResistance}</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default Rheostat;
