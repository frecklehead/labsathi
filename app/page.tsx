"use client";

import { useState, useRef, useMemo } from "react";
import { Stand } from "./components/lab/stand";
import { Burette } from "./components/lab/Burette";
import { Flask } from "./components/lab/Flask";
import { Tile, Funnel, MeasuringCylinder } from "./components/lab/Accessories";
import { Bottle } from "./components/lab/Bottles";
import { Pipette } from "./components/lab/Pipette";
import { Draggable } from "./Draggable";
import { DraggableLabObject, SnapTarget } from "./snapped";
import { Tube } from "./components/lab/Tube";
import { VolumetricFlask } from "./components/lab/VolumetricFlask";
import { TitrationFlask } from "./components/lab/TitrationFlask";

interface ContainerState {
    totalVolume: number; // mL
    molesH: number;      // Moles H+
    molesOH: number;     // Moles OH-
    hasIndicator: boolean;
}

interface LabItem {
    id: string;
    type: string;
    x: number;
    y: number;
    snappedToId?: string | null;
    props?: any;
    containerState?: ContainerState;
}

export default function TitrationLab() {
    const [workbenchItems, setWorkbenchItems] = useState<LabItem[]>([]);
    const workbenchRef = useRef<HTMLDivElement>(null);
    const snapTargets = useMemo(() => {
        const targets: SnapTarget[] = [];
        workbenchItems.forEach(item => {
            if (item.type === 'stand') {
                targets.push({
                    id: `clamp-${item.id}`,
                    x: item.x + 38,
                    y: item.y + 70,
                    radius: 40,
                    validTypes: ['burette', 'pipette']
                });
                targets.push({
                    id: `base-${item.id}`,
                    x: item.x - 25,
                    y: item.y + 330,
                    radius: 60,
                    validTypes: ['flask', 'tile', 'cylinder', 'volumetric-flask']
                });
            }
        });
        return targets;
    }, [workbenchItems]);


    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!workbenchRef.current) return;

        const dataStr = e.dataTransfer.getData("application/json");
        if (!dataStr) return;

        try {
            const data = JSON.parse(dataStr);
            const rect = workbenchRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left - 50;
            const y = e.clientY - rect.top - 50;

            if (data.id.startsWith('template-')) {
                const newItem: LabItem = {
                    id: `item-${Date.now()}`,
                    type: data.type,
                    x,
                    y,
                    props: getDefaultProps(data.type)
                };
                setWorkbenchItems(prev => [...prev, newItem]);
            }
        } catch (err) {
            console.error("Drop Error", err);
        }
    };

    const handlePositionChange = (id: string, x: number, y: number, snappedToId: string | null) => {
        setWorkbenchItems(items => items.map(item =>
            item.id === id ? { ...item, x, y, snappedToId } : item
        ));
    };

    const getDefaultProps = (type: string) => {
        switch (type) {
            case 'burette': return { fill: 100, open: false, color: 'bg-white/40' }; // Default to NaOH
            case 'flask': return { fill: 0, color: 'bg-transparent', label: 'Analyte' };
            case 'volumetric-flask': return { fill: 0, color: 'bg-transparent', label: '250ml' };
            case 'titration-flask': return { fill: 0, color: 'bg-transparent', label: 'Reaction' };
            case 'bottle-naoh': return { label: 'NaOH', color: 'bg-blue-500' };
            case 'stand': return { height: 'h-96' };
            default: return {};
        }
    };

    // Helper: Logic to determine color based on pH/moles
    const calculateColor = (state: ContainerState): string => {
        if (!state.hasIndicator) {
            return 'bg-transparent';
        }
        // Reaction: H+ + OH- => H2O
        // Excess OH- + Indicator => Pink
        if (state.molesOH > state.molesH) {
            const excess = state.molesOH - state.molesH;
            return excess > 0.000001 ? 'bg-pink-500/80' : 'bg-transparent';
        }
        return 'bg-transparent';
    }


    // ... snapTargets ... (unchanged)

    // ... handleDrop ... (unchanged) note: you might need to preserve handleDrop and others if they were inside the replaced block?
    // Wait, the replaced block starts at handleDispense which is ~line 178 but I need to insert types before that.
    // I will put types at the top of the component (or outside) and then the functions.
    // Since I can't easily see line numbers in the replace block request context (it just replaces content), 
    // I will stick to replacing the Logic Engine part.

    // ... handlePositionChange ... (unchanged)


    // --- 2. LOGIC ENGINE ---

    // Generalized helper to update container state
    const updateContainerState = (
        current: ContainerState | undefined,
        addVolume: number,
        addType: string,
        addConcentration: number = 0.1
    ): { newState: ContainerState, newColor: string, newFill: number } => {

        const state = current || {
            totalVolume: 0,
            molesH: 0,
            molesOH: 0,
            hasIndicator: false
        };

        let { molesH, molesOH, hasIndicator } = state;
        const molesAdded = addConcentration * (addVolume / 1000);

        if (addType === 'acid') molesH += molesAdded;
        if (addType === 'base') molesOH += molesAdded;
        if (addType === 'indicator') hasIndicator = true;

        const newTotalVolume = state.totalVolume + addVolume;

        // Color Logic
        const newState = { totalVolume: newTotalVolume, molesH, molesOH, hasIndicator };
        let newColor = 'bg-transparent';

        // If purely one thing, show its color roughly? 
        // Or simplified: if Indicator present, run titration logic. 
        // If no indicator, transparent (or water/acid/base/analyte are all clear).
        if (hasIndicator) {
            newColor = calculateColor(newState);
        } else {
            // No indicator
            newColor = 'bg-transparent';
        }

        // Fill Logic (Assume 250mL max for % calculation)
        const newFill = Math.min(100, (newTotalVolume / 250) * 100);

        return { newState, newColor, newFill };
    }


    const handleDispense = (sourceId: string, amount: number, color: string) => {
        // Infer Burette Content from its color (Simplified for now as Burette doesn't store robust state yet)
        let type = 'solvent'; // water
        let conc = 0;

        // Map common colors to types for the simulation
        if (color.includes('bg-white/40') || color.includes('bg-blue-500')) { type = 'base'; conc = 0.1; } // NaOH
        else if (color.includes('bg-blue-200/50')) { type = 'acid'; conc = 0.1; } // HCl
        else if (color.includes('bg-pink')) { type = 'indicator'; conc = 0; }

        setWorkbenchItems(prevItems => {
            const source = prevItems.find(i => i.id === sourceId);
            if (!source) return prevItems;

            const target = prevItems.find(item => {
                if (item.id === sourceId) return false;
                // Universal interaction: all flask types
                if (!['flask', 'volumetric-flask', 'titration-flask', 'cylinder'].includes(item.type)) return false;

                const xDiff = Math.abs((item.x) - (source.x));
                const yDiff = item.y - source.y;
                return xDiff < 40 && yDiff > 100 && yDiff < 400;
            });

            if (target) {
                return prevItems.map(item => {
                    if (item.id === target.id) {
                        const { newState, newColor, newFill } = updateContainerState(
                            item.containerState,
                            amount,
                            type,
                            conc
                        );

                        return {
                            ...item,
                            containerState: newState,
                            props: {
                                ...item.props,
                                fill: newFill,
                                color: newColor
                            }
                        };
                    }
                    return item;
                });
            }
            return prevItems;
        });
    };

    const handleFlaskAdd = (id: string, amount: number, color: string, type: string) => {
        // Map type string to simplified types if needed, but components send valid 'acid'/'base'/'indicator'
        // Concentration assumption: Standard 0.1M for Acid/Base in this sim.
        const concentration = (type === 'acid' || type === 'base') ? 0.1 : 0;

        setWorkbenchItems(items => items.map(item => {
            if (item.id === id) {
                const { newState, newColor, newFill } = updateContainerState(
                    item.containerState,
                    amount,
                    type,
                    concentration
                );

                return {
                    ...item,
                    containerState: newState,
                    props: { ...item.props, fill: newFill, color: newColor }
                };
            }
            return item;
        }));
    };



    const handleDelete = (id: string) => {
        setWorkbenchItems(items => items.filter(item => item.id !== id));
    };

    const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

    // --- 3. RENDER PIECE ---
    const renderItem = (item: LabItem) => {
        let Component;
        switch (item.type) {
            case 'stand': Component = <Stand {...item.props} />; break;
            case 'burette':
                Component = <Burette
                    {...item.props}
                    onDispense={(a, c) => handleDispense(item.id, a, c)}
                />;
                break;
            case 'flask':
                Component = <Flask {...item.props} onAddContent={(a, c, t) => handleFlaskAdd(item.id, a, c, t)} />;
                break;
            case 'titration-flask':
                Component = <TitrationFlask {...item.props} onAddContent={(a, c, t) => handleFlaskAdd(item.id, a, c, t)} />;
                break;
            case 'volumetric-flask':
                Component = <VolumetricFlask {...item.props} onAddContent={(a, c, t) => handleFlaskAdd(item.id, a, c, t)} />;
                break;
            case 'tile': Component = <Tile />; break;
            case 'funnel': Component = <Funnel />; break;
            case 'cylinder': Component = <MeasuringCylinder fill={40} />; break;
            case 'bottle-naoh': Component = <Bottle label="NaOH" color="bg-blue-500" />; break;
            case 'bottle-hcl': Component = <Bottle label="HCl" color="bg-transparent" />; break;
            case 'bottle-phenol': Component = <Bottle label="Phenol." color="bg-pink-500" type="reagent" />; break;
            case 'wash-bottle': Component = <Bottle label="H2O" color="bg-blue-200" type="wash" />; break;
            case 'pipette': Component = <Pipette fill={60} />; break;
            case 'tube': Component = <Tube fill={0} />; break;
            default: Component = <div className="p-4 bg-red-500">?</div>;
        }

        return (
            <DraggableLabObject
                key={item.id}
                id={item.id}
                type={item.type}
                initialX={item.x}
                initialY={item.y}
                snapTargets={snapTargets}
                onPositionChange={handlePositionChange}
                onDelete={handleDelete}
                onHover={(isHovered) => setHoveredItemId(isHovered ? item.id : null)}
            >
                {Component}
            </DraggableLabObject>
        );
    };

    const hoveredItemData = workbenchItems.find(i => i.id === hoveredItemId);

    return (
        <main className="flex h-screen bg-gray-900 overflow-hidden text-white selection:bg-pink-500/30">
            {/* Sidebar (Existing) */}

            {/* Sidebar (Existing) */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col z-20 shadow-2xl">
                <div className="p-4 border-b border-gray-700">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-400">LabSathi</h1>
                    <p className="text-xs text-gray-500">Drag items to workbench</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    <ShelfCategory title="Apparatus">
                        <ShelfItem type="stand" label="Retort Stand"><div className="scale-50 origin-top-left"><Stand /></div></ShelfItem>
                        <ShelfItem type="tile" label="White Tile"><div className="scale-50"><Tile /></div></ShelfItem>
                    </ShelfCategory>
                    <ShelfCategory title="Glassware">
                        <ShelfItem type="burette" label="Burette"><div className="scale-75 origin-top-left h-32 overflow-hidden"><Burette fill={80} /></div></ShelfItem>
                        <ShelfItem type="titration-flask" label="Titration Flask"><div className="scale-75"><TitrationFlask fill={30} label="Interactive" /></div></ShelfItem>
                        <ShelfItem type="flask" label="Conical Flask"><div className="scale-75"><Flask fill={30} /></div></ShelfItem>
                        <ShelfItem type="volumetric-flask" label="Vol. Flask"><div className="scale-50"><VolumetricFlask fill={100} color="bg-blue-400/20" /></div></ShelfItem>
                        <ShelfItem type="cylinder" label="Meas. Cylinder"><div className="scale-75"><MeasuringCylinder fill={50} /></div></ShelfItem>
                        <ShelfItem type="funnel" label="Funnel"><div className="scale-75"><Funnel /></div></ShelfItem>
                    </ShelfCategory>
                    <ShelfCategory title="Reagents">
                        <ShelfItem type="bottle-naoh" label="NaOH"><div className="scale-50 origin-left"><Bottle label="NaOH" color="bg-blue-500" /></div></ShelfItem>
                        <ShelfItem type="bottle-hcl" label="HCl"><div className="scale-50 origin-left"><Bottle label="HCl" color="bg-transparent" /></div></ShelfItem>
                        <ShelfItem type="pipette" label="Pipette"><div className="scale-50 origin-left -rotate-45"><Pipette fill={50} /></div></ShelfItem>
                    </ShelfCategory>
                </div>
            </aside>

            <div className="flex-1 flex flex-col relative">
                <div className="h-14 bg-gray-800/50 border-b border-white/5 flex items-center justify-between px-6 backdrop-blur-sm z-10">
                    <span className="text-sm text-gray-400 font-mono">Workbench 1</span>
                    <button onClick={() => setWorkbenchItems([])} className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded hover:bg-red-500/20 transition-colors">Clear All</button>
                </div>

                {/* Chemistry Inspector Overlay */}
                {hoveredItemData && hoveredItemData.containerState && (
                    <div className="absolute top-16 right-6 z-50 bg-gray-800/90 backdrop-blur border border-gray-600 p-4 rounded-md shadow-xl w-64 pointer-events-none">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-700 pb-1">Inspector</h3>
                        <div className="space-y-2 text-xs font-mono text-gray-300">
                            <div className="flex justify-between">
                                <span>Volume:</span>
                                <span className="text-blue-400">{hoveredItemData.containerState.totalVolume.toFixed(1)} mL</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Moles H+:</span>
                                <span className="text-red-400">{hoveredItemData.containerState.molesH.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Moles OH-:</span>
                                <span className="text-blue-400">{hoveredItemData.containerState.molesOH.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                                <span>Indicator:</span>
                                <span className={hoveredItemData.containerState.hasIndicator ? "text-green-400" : "text-gray-500"}>
                                    {hoveredItemData.containerState.hasIndicator ? "YES" : "NO"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>State:</span>
                                <span className={
                                    hoveredItemData.containerState.molesOH > hoveredItemData.containerState.molesH
                                        ? "text-pink-500 font-bold"
                                        : "text-white/50"
                                }>
                                    {hoveredItemData.containerState.molesOH > hoveredItemData.containerState.molesH ? "BASIC (Pink)" : "NEUTRAL/ACID"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div
                    ref={workbenchRef}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-gray-900 overflow-hidden touch-none"
                >

                    <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                    {workbenchItems.map(renderItem)}

                    {workbenchItems.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center text-white/20">
                                <p className="text-4xl mb-4 font-thin">Empty Workbench</p>
                                <p>Drag apparatus from the left shelf to start.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function ShelfCategory({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
            <div className="grid grid-cols-2 gap-4">{children}</div>
        </div>
    )
}

function ShelfItem({ type, label, children }: { type: string, label: string, children: React.ReactNode }) {
    return (
        <Draggable id={`template-${type}`} type={type} className="flex flex-col items-center group cursor-grab">
            <div className="w-20 h-20 bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-center group-hover:bg-gray-700 group-hover:border-gray-500 transition-all overflow-hidden relative">
                {children}
            </div>
            <span className="text-[10px] text-gray-400 mt-2 text-center leading-tight group-hover:text-gray-200">{label}</span>
        </Draggable>
    )
}