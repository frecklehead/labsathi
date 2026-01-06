import React from 'react';
import { Wire, Terminal } from '../../types/circuit.types';

interface WireRendererProps {
    wires: Wire[];
    allTerminals: Terminal[];
}

export default function WireRenderer({ wires, allTerminals }: WireRendererProps) {
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

                return (
                    <g key={wire.id}>
                        <path
                            d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                            stroke="rgba(0,0,0,0.4)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            fill="none"
                            className="transition-all duration-300"
                            style={{ transform: 'translateY(3px)' }}
                        />
                        <path
                            d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                            stroke="url(#wireGradient)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            fill="none"
                            className="transition-all duration-300"
                        />
                        <path
                            d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="1"
                            strokeLinecap="round"
                            fill="none"
                            className="transition-all duration-300"
                            style={{ transform: 'translateY(-0.5px) translateX(-0.5px)' }}
                        />
                        <circle cx={fromTerminal.x} cy={fromTerminal.y} r="3" fill="#4a5568" />
                        <circle cx={toTerminal.x} cy={toTerminal.y} r="3" fill="#4a5568" />
                    </g>
                );
            })}
        </svg>
    );
}
