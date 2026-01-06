import React, { forwardRef } from 'react';
import { PhysicsItem, Wire, Terminal } from '../../types/circuit.types';
import CircuitGrid from './CircuitGrid';
import WireRenderer from './WireRenderer';
import CircuitItem from './CircuitItem';
import TerminalRenderer from './TerminalRenderer';

interface WorkbenchProps {
    items: PhysicsItem[];
    wires: Wire[];
    terminals: Terminal[];
    connectingFrom: { itemId: string; terminal: string } | null;
    onDrop: (e: React.DragEvent) => void;
    onPositionChange: (id: string, x: number, y: number) => void;
    onDelete: (id: string) => void;
    onPropertyChange: (id: string, property: string, value: any) => void;
    onTerminalClick: (itemId: string, name: string) => void;
}

const Workbench = forwardRef<HTMLDivElement, WorkbenchProps>(({
    items,
    wires,
    terminals,
    connectingFrom,
    onDrop,
    onPositionChange,
    onDelete,
    onPropertyChange,
    onTerminalClick
}, ref) => {
    return (
        <div
            ref={ref}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex-1 relative bg-[#f8fafc] overflow-hidden"
        >
            <CircuitGrid />
            <WireRenderer wires={wires} allTerminals={terminals} />

            {items.map(item => (
                <CircuitItem
                    key={item.id}
                    item={item}
                    onPositionChange={onPositionChange}
                    onDelete={onDelete}
                    onPropertyChange={onPropertyChange}
                />
            ))}

            <TerminalRenderer
                terminals={terminals}
                wires={wires}
                connectingFrom={connectingFrom}
                onTerminalClick={onTerminalClick}
            />

            {items.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-600">
                            <svg className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <p className="text-3xl mb-3 font-light text-slate-500 tracking-tight">Workbench Ready</p>
                        <p className="text-slate-600 font-medium">Drag components to begin the experiment</p>
                    </div>
                </div>
            )}
        </div>
    );
});

Workbench.displayName = "Workbench";

export default Workbench;
