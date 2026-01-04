"use client";

import React, { useState, useEffect, useRef } from "react";

interface BuretteProps {
    fill?: number;
    open?: boolean;
    color?: string;
    className?: string;
    onDispense?: (amount: number, color: string) => void;
}

const LIQUIDS = [
    { name: 'Water', color: 'bg-blue-500/80' },
    { name: 'NaOH', color: 'bg-white/40' },
    { name: 'KMnO4', color: 'bg-purple-700/80' },
    { name: 'HCl', color: 'bg-blue-200/50' },
    { name: 'Indicator', color: 'bg-pink-500/60' },
];

export function Burette({ fill = 0, open = false, color = "bg-transparent", className = "", onDispense }: BuretteProps) {
    const [currentFill, setCurrentFill] = useState(fill);
    const [handleAngle, setHandleAngle] = useState(0); // 0 = closed, 90 = fully open
    const [isDragging, setIsDragging] = useState(false);
    const [liquidColor, setLiquidColor] = useState(color);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const valveRef = useRef<HTMLDivElement>(null);

    // Calculate flow rate based on angle (more realistic physics)
    const getFlowRate = (angle: number): number => {
        if (angle < 10) return 0; // Closed threshold
        // Flow rate increases non-linearly with angle
        const normalizedAngle = Math.min(angle, 90) / 90;
        return normalizedAngle * normalizedAngle * 2; // Quadratic increase (0 to 2% per tick)
    };

    const isOpen = handleAngle > 10;

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

    // Realistic liquid flow simulation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen && currentFill > 0) {
            const flowRate = getFlowRate(handleAngle);
            interval = setInterval(() => {
                const amount = flowRate; // Simulate volume (1:1 for 100mL capacity)
                setCurrentFill(prev => Math.max(0, prev - flowRate));

                if (onDispense) {
                    onDispense(amount, liquidColor);
                }
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isOpen, currentFill, handleAngle, liquidColor, onDispense]);

    // Handle drag interactions
    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!valveRef.current) return;

            const rect = valveRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

            // Calculate angle from center
            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;
            let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

            // Normalize to 0-90 range (horizontal right = 0, vertical down = 90)
            angle = Math.max(0, Math.min(90, angle));
            setHandleAngle(angle);
        };

        const handleEnd = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging]);

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const selectLiquid = (newColor: string) => {
        setLiquidColor(newColor);
        setCurrentFill(100);
        setShowMenu(false);
    };

    // Get visual flow characteristics based on angle
    const getFlowVisuals = () => {
        if (!isOpen || currentFill === 0) return { droplets: 0, streamWidth: 0, speed: 0 };

        const normalizedAngle = handleAngle / 90;
        return {
            droplets: Math.ceil(normalizedAngle * 5), // 0-5 droplets
            streamWidth: 1 + normalizedAngle * 2, // 1-3px
            speed: 0.4 + normalizedAngle * 0.4 // 0.4-0.8s
        };
    };

    const flowVisuals = getFlowVisuals();

    return (
        <div className={`relative w-4 h-[300px] flex flex-col items-center ${className}`}>
            {/* Interaction Menu - Standardized */}
            {showMenu && (
                <div
                    ref={menuRef}
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-600 rounded p-3 shadow-xl w-48 no-drag cursor-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h4 className="text-xs font-bold text-gray-400 mb-2 border-b border-gray-700 pb-1">Fill Burette</h4>
                    <div className="space-y-2">
                        <select
                            className="w-full bg-gray-900 border border-gray-700 text-xs rounded p-1 text-gray-300 outline-none focus:border-blue-500"
                            value={liquidColor}
                            onChange={(e) => setLiquidColor(e.target.value)}
                        >
                            {LIQUIDS.map(l => <option key={l.name} value={l.color}>{l.name}</option>)}
                        </select>
                        <button onClick={() => { setCurrentFill(100); setShowMenu(false); }} className="w-full bg-blue-600 hover:bg-blue-500 text-xs text-white py-1 rounded transition-colors">
                            Fill to Top
                        </button>
                    </div>
                </div>
            )}

            {/* Glass Tube */}
            <div
                className="relative w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-t-sm shadow-inner z-10 overflow-hidden cursor-pointer group"
                onClick={toggleMenu}
                title="Click to add liquid"
            >
                {/* Visual cue */}
                <div className="absolute top-0 w-full h-4 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity z-30"></div>

                {/* Liquid */}
                <div
                    className={`absolute bottom-0 left-0 w-full transition-all duration-75 ease-linear ${liquidColor}`}
                    style={{ height: `${currentFill}%` }}
                >
                    {/* Surface meniscus */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-white/30 blur-[0.5px]"></div>
                </div>

                {/* Graduations */}
                <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-between py-2 pointer-events-none">
                    {[...Array(11)].map((_, i) => (
                        <div key={i} className="flex items-center justify-end w-full text-[6px] text-white/40 font-mono">
                            <span className="mr-0.5">{i * 10}</span>
                            <div className="w-2 h-[1px] bg-white/30"></div>
                        </div>
                    ))}
                </div>


                {/* Reflections */}
                <div className="absolute top-0 left-0.5 w-[2px] h-full bg-white/20 z-20 pointer-events-none"></div>
            </div>

            {/* Stopcock/Tap */}
            <div className="relative z-20 flex flex-col items-center -mt-[1px]">
                {/* Connection */}
                <div className="w-2 h-4 bg-white/10 backdrop-blur-md border-x border-white/20"></div>

                {/* Valve Body */}
                <div
                    ref={valveRef}
                    className="relative w-6 h-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-sm flex items-center justify-center"
                >
                    {/* Handle - Draggable */}
                    <div
                        onPointerDown={handlePointerDown}
                        className={`w-8 h-1 rounded-full shadow-sm transition-colors no-drag ${isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab'
                            } ${isOpen ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{
                            transform: `rotate(${handleAngle}deg)`,
                            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                        }}
                    >
                        {/* Handle grip */}
                        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border ${isOpen ? 'bg-green-600 border-green-700' : 'bg-amber-600 border-amber-700'
                            }`}></div>
                    </div>

                    {/* Angle display */}
                    <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/70 whitespace-nowrap">
                        {Math.round(handleAngle)}°
                    </div>
                </div>

                {/* Tip with realistic flow */}
                <div className="w-1 h-6 bg-white/10 backdrop-blur-md border-x border-white/20 rounded-b-sm flex justify-center relative overflow-visible">
                    {isOpen && currentFill > 0 && (
                        <>
                            {/* Continuous stream (for angles > 30°) */}
                            {handleAngle > 30 && (
                                <div
                                    className={`absolute top-full ${liquidColor} opacity-70`}
                                    style={{
                                        width: `${flowVisuals.streamWidth}px`,
                                        height: '40px',
                                        animation: 'flow 0.3s linear infinite'
                                    }}
                                ></div>
                            )}

                            {/* Droplets */}
                            {[...Array(flowVisuals.droplets)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`absolute top-full w-1 h-1 ${liquidColor} rounded-full`}
                                    style={{
                                        animation: `fall ${flowVisuals.speed}s ease-in ${i * (flowVisuals.speed / flowVisuals.droplets)}s infinite`,
                                        left: '50%',
                                        transform: 'translateX(-50%)'
                                    }}
                                ></div>
                            ))}

                            {/* Splash at bottom (for fast flows) */}
                            {handleAngle > 50 && (
                                <div
                                    className={`absolute ${liquidColor} rounded-full opacity-30`}
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        top: '50px',
                                        animation: 'splash 0.6s ease-out infinite'
                                    }}
                                ></div>
                            )}

                            {/* Drip sound indicator (visual only) */}
                            {handleAngle < 30 && handleAngle > 10 && (
                                <div className={`absolute top-full mt-1 w-1.5 h-2 ${liquidColor} rounded-b-full animate-bounce`}></div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Flow rate indicator */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] text-white/50 font-mono whitespace-nowrap">
                {isOpen ? `${(getFlowRate(handleAngle) * 20).toFixed(1)} mL/s` : 'CLOSED'}
            </div>

            <style jsx>{`
                @keyframes fall {
                    0% {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translateX(-50%) translateY(50px);
                        opacity: 0;
                    }
                }
                @keyframes flow {
                    0%, 100% {
                        opacity: 0.7;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
                @keyframes splash {
                    0% {
                        transform: scale(0.5);
                        opacity: 0.4;
                    }
                    50% {
                        transform: scale(1.5);
                        opacity: 0.2;
                    }
                    100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}

// Demo Component
export default function BuretteDemo() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Realistic Burette Simulator</h1>
                    <p className="text-sm text-white/60">Drag the handle to control flow • Click the tube to add liquid</p>
                </div>

                <div className="flex gap-16 items-start">
                    <Burette color="bg-blue-500/80" />
                    <Burette color="bg-purple-700/80" />
                    <Burette color="bg-pink-500/60" />
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/20 max-w-md">
                    <h3 className="text-white font-semibold mb-3">How to Use:</h3>
                    <ul className="text-sm text-white/70 space-y-2">
                        <li>• <strong>Click tube</strong> - Select liquid type</li>
                        <li>• <strong>Drag handle</strong> - Control valve angle (0-90°)</li>
                        <li>• <strong>0-10°</strong> - Closed</li>
                        <li>• <strong>10-30°</strong> - Slow drip</li>
                        <li>• <strong>50-90°</strong> - Steady stream</li>
                        <li>• <strong>50-90°</strong> - Fast flow with splash</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}