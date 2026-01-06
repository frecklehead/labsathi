import React from 'react';
import { Terminal, Wire } from '../../types/circuit.types';

interface TerminalRendererProps {
    terminals: Terminal[];
    wires: Wire[];
    connectingFrom: { itemId: string; terminal: string } | null;
    suggestedConnection: { from: string; fromT: string; to: string; toT: string } | null;
    onTerminalClick: (itemId: string, name: string) => void;
}

export default function TerminalRenderer({
    terminals,
    wires,
    connectingFrom,
    suggestedConnection,
    onTerminalClick
}: TerminalRendererProps) {
    return (
        <>
            {terminals.map(terminal => {
                const isConnecting = connectingFrom?.itemId === terminal.itemId &&
                    connectingFrom?.terminal === terminal.name;
                
                const isSuggested = suggestedConnection && (
                    (terminal.itemId === suggestedConnection.from && terminal.name === suggestedConnection.fromT) ||
                    (terminal.itemId === suggestedConnection.to && terminal.name === suggestedConnection.toT)
                );

                const isConnected = wires.some(w =>
                    (w.from.itemId === terminal.itemId && w.from.terminal === terminal.name) ||
                    (w.to.itemId === terminal.itemId && w.to.terminal === terminal.name)
                );

                return (
                    <div
                        key={terminal.id}
                        onClick={() => onTerminalClick(terminal.itemId, terminal.name)}
                        className={`absolute w-7 h-7 flex items-center justify-center cursor-pointer transition-all z-[60] group/terminal ${
                            isConnecting ? "scale-125" : ""
                        } ${isSuggested && !isConnected ? "animate-pulse-glow" : ""}`}
                        style={{
                            left: terminal.x - 14,
                            top: terminal.y - 14,
                        }}
                        title={`${terminal.itemId.split("-")[0]} - ${terminal.name}`}
                    >
                        <div className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${
                            isConnecting
                                ? 'bg-green-500/30 ring-4 ring-green-500/20 scale-110'
                                : isSuggested && !isConnected
                                    ? 'bg-yellow-400/30 ring-4 ring-yellow-400/20 scale-110'
                                    : 'bg-transparent'
                        }`}>
                            <div className={`w-full h-full rounded-full border ${
                                isSuggested && !isConnected 
                                    ? 'border-yellow-400 opacity-100' 
                                    : 'border-yellow-400/0 group-hover/terminal:border-yellow-400/50'
                            } group-hover/terminal:scale-110 transition-all duration-300`}></div>
                            {(isConnecting || (isSuggested && !isConnected)) && (
                                <div className={`absolute inset-0 rounded-full border-2 ${
                                    isConnecting ? 'border-green-400' : 'border-yellow-400'
                                } animate-ping opacity-20`}></div>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
