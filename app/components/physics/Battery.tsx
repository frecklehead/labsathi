import React from 'react';

interface BatteryProps {
    voltage?: number;
    onVoltageChange?: (voltage: number) => void;
}

export function Battery({ voltage = 5, onVoltageChange }: BatteryProps) {
    return (
        <div className="flex flex-col items-center gap-2 select-none w-32">
            {/* Battery Visual - Standardized width to match other instruments */}
            <div className="relative flex items-end justify-center w-full h-[100px]">
                {/* Battery Body - Cylindrical 3D effect */}
                <div className="relative w-16 h-24 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-lg border-2 border-gray-800 shadow-2xl overflow-hidden">
                    {/* Shine effect */}
                    <div className="absolute inset-y-0 left-2 w-1 bg-gradient-to-b from-white/40 to-transparent"></div>
                    <div className="absolute inset-y-0 right-2 w-1 bg-gradient-to-b from-transparent to-black/30"></div>

                    {/* Label area */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-white font-bold text-lg drop-shadow-lg">
                            {voltage}V
                        </div>
                        <div className="text-xs text-gray-300 font-semibold">DC</div>
                    </div>

                    {/* Top stripe */}
                    <div className="absolute top-2 inset-x-0 h-1 bg-red-500"></div>
                    {/* Bottom stripe */}
                    <div className="absolute bottom-2 inset-x-0 h-1 bg-blue-500"></div>
                </div>

                {/* Professional Metallic Terminals - centered in 128px width */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-gray-400 to-gray-700 rounded-full border border-gray-500 shadow-lg flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900/40 border border-black/20 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 rotate-45 opacity-40"></div>
                    </div>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-gray-400 to-gray-700 rounded-full border border-gray-500 shadow-lg flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-900/40 border border-black/20 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-slate-400 -rotate-45 opacity-40"></div>
                    </div>
                </div>
            </div>

            {/* Voltage Control */}
            {onVoltageChange && (
                <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-700 shadow-lg">
                    <button
                        onClick={() => onVoltageChange(Math.max(1, voltage - 1))}
                        className="w-7 h-7 bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 rounded text-white text-sm font-bold shadow-md active:scale-95 transition-all"
                    >
                        −
                    </button>
                    <span className="text-white text-xs font-mono w-10 text-center font-bold">{voltage}V</span>
                    <button
                        onClick={() => onVoltageChange(Math.min(12, voltage + 1))}
                        className="w-7 h-7 bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 rounded text-white text-sm font-bold shadow-md active:scale-95 transition-all"
                    >
                        +
                    </button>
                </div>
            )}
        </div>
    );
}
