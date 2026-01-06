import React from 'react';
import { Wire, Terminal } from '../../types/circuit.types';

interface WireRendererProps {
    wires: Wire[];
    allTerminals: Terminal[];
    onDeleteWire: (wireId: string) => void;
}

export default function WireRenderer({ wires, allTerminals, onDeleteWire }: WireRendererProps) {
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
                <filter id="wireShadow">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                    <feOffset dx="2" dy="2" result="offsetblur" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="50%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
            </defs>
            {wires.map(wire => {
                const fromTerminal = allTerminals.find(t =>
                    t.itemId === wire.from.itemId && t.name === wire.from.terminal
                );
                const toTerminal = allTerminals.find(t =>
                    t.itemId === wire.to.itemId && t.name === wire.to.terminal
                );

                if (!fromTerminal || !toTerminal) return null;

                const dx = toTerminal.x - fromTerminal.x;
                const dy = toTerminal.y - fromTerminal.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const hang = Math.max(30, distance * 0.2);

                const cp1x = fromTerminal.x + dx * 0.2;
                const cp1y = fromTerminal.y + hang;
                const cp2x = toTerminal.x - dx * 0.2;
                const cp2y = toTerminal.y + hang;

                // Calculate actual midpoint on the bezier curve (t=0.5) for delete button
                const t = 0.5;
                const midX = Math.pow(1 - t, 3) * fromTerminal.x +
                    3 * Math.pow(1 - t, 2) * t * cp1x +
                    3 * (1 - t) * Math.pow(t, 2) * cp2x +
                    Math.pow(t, 3) * toTerminal.x;
                const midY = Math.pow(1 - t, 3) * fromTerminal.y +
                    3 * Math.pow(1 - t, 2) * t * cp1y +
                    3 * (1 - t) * Math.pow(t, 2) * cp2y +
                    Math.pow(t, 3) * toTerminal.y;

                return (
                    <g key={wire.id} className="group/wire">
                        {/* Invisible wide hover area along the wire */}
                        <path
                            d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                            stroke="transparent"
                            strokeWidth="20"
                            fill="none"
                            className="pointer-events-auto cursor-pointer"
                        />

                        {/* Broad, soft shadow for depth */}
                        <path
                            d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                            stroke="rgba(0,0,0,0.4)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            fill="none"
                            className="transition-all duration-300 pointer-events-none"
                            style={{ transform: 'translateY(3px)' }}
                        />
                        {/* Main Insulation (Red) */}
                        <path
                            d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                            stroke="url(#wireGradient)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            fill="none"
                            className="transition-all duration-300 group-hover/wire:stroke-red-400 group-hover/wire:drop-shadow-[0_0_8px_rgba(248,113,113,0.8)] pointer-events-none"
                        />
                        {/* Specular Highlight for 3D effect */}
                        <path
                            d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="1"
                            strokeLinecap="round"
                            fill="none"
                            className="transition-all duration-300 pointer-events-none"
                            style={{ transform: 'translateY(-0.5px) translateX(-0.5px)' }}
                        />

                        {/* Wire Connectors (Ends) */}
                        <circle cx={fromTerminal.x} cy={fromTerminal.y} r="3" fill="#4a5568" className="pointer-events-none" />
                        <circle cx={toTerminal.x} cy={toTerminal.y} r="3" fill="#4a5568" className="pointer-events-none" />

                        {/* Delete button - shows on wire hover */}
                        <g
                            className="opacity-0 group-hover/wire:opacity-100 transition-opacity cursor-pointer pointer-events-auto"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteWire(wire.id);
                            }}
                        >
                            <circle
                                cx={midX}
                                cy={midY}
                                r="12"
                                fill="rgb(239, 68, 68)"
                                className="drop-shadow-lg"
                            />
                            <path
                                d={`M ${midX - 4} ${midY - 4} L ${midX + 4} ${midY + 4} M ${midX + 4} ${midY - 4} L ${midX - 4} ${midY + 4}`}
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                className="pointer-events-none"
                            />
                        </g>
                    </g>
                );
            })}
        </svg>
    );
}
