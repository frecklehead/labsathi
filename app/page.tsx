"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Stand } from "./components/lab/stand";
import { Clamp } from "./components/lab/Clamp";
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

interface GuideStep {
    id: number;
    title: string;
    description: string;
    check: (items: LabItem[]) => boolean;
}

const GUIDE_STEPS: GuideStep[] = [
    {
        id: 1,
        title: "Setup Stand",
        description: "Drag a Retort Stand from the apparatus shelf to the workbench.",
        check: (items) => items.some(i => i.type === 'stand')
    },
    {
        id: 2,
        title: "Attach Clamp",
        description: "Attach a Stand Clamp to the Retort Stand.",
        check: (items) => items.some(i => i.type === 'clamp' && i.snappedToId?.startsWith('rod-'))
    },
    {
        id: 3,
        title: "Mount Burette",
        description: "Attach a Burette to the clamp. Drag it near the clamp holder.",
        check: (items) => items.some(i => i.type === 'burette' && i.snappedToId?.startsWith('holder-'))
    },
    {
        id: 4,
        title: "Prepare Tile",
        description: "Place a White Tile on the base of the stand to see color changes clearly.",
        check: (items) => items.some(i => i.type === 'tile')
    },
    {
        id: 5,
        title: "Place Flask",
        description: "Place a Conical Flask or Titration Flask on the white tile under the burette.",
        check: (items) => items.some(i => (i.type === 'flask' || i.type === 'titration-flask') && i.snappedToId?.startsWith('base-'))
    },
    {
        id: 6,
        title: "Start Titration",
        description: "Open the burette tap to release the titrant into the flask. Observe the color change.",
        check: (items) => items.some(i => (i.type === 'flask' || i.type === 'titration-flask') && (i.props.fill > 20 || i.props.color !== 'bg-transparent')) // Check if liquid added
    }
];

export default function TitrationLab() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedStepIds, setCompletedStepIds] = useState<number[]>([]);

    const [workbenchItems, setWorkbenchItems] = useState<LabItem[]>([]);
    const workbenchRef = useRef<HTMLDivElement>(null);
    const snapTargets = useMemo(() => {
        const targets: SnapTarget[] = [];
        workbenchItems.forEach(item => {
            if (item.type === 'stand') {
                // Stand provides 'rod' for Clamp
                targets.push({
                    id: `rod-${item.id}`,
                    x: item.x + 96, // Center of w-48 (192px) base
                    y: item.y + 70, // Position on rod
                    radius: 40,
                    validTypes: ['clamp']
                });
                // Stand provides 'base' for Flask/Tile
                targets.push({
                    id: `base-${item.id}`,
                    x: item.x + 96, // Center of stand
                    y: item.y + 330,
                    radius: 60,
                    validTypes: ['flask', 'tile', 'cylinder', 'volumetric-flask', 'titration-flask']
                });
            } else if (item.type === 'clamp') {
                // Clamp provides 'holder' for Burette
                // Position relative to clamp's snapped position (on the stand)
                // Clamp is at item.x, item.y
                // Holder visual is roughly at dx=56, dy=-8 relative to clamp origin
                targets.push({
                    id: `holder-${item.id}`,
                    x: item.x + 56,
                    y: item.y - 8,
                    radius: 30,
                    validTypes: ['burette']
                });
            }
        });
        return targets;
    }, [workbenchItems]);

    // Check step progress
    useEffect(() => {
        const currentStep = GUIDE_STEPS[currentStepIndex];
        if (!currentStep) return;

        if (currentStep.check(workbenchItems)) {
            if (!completedStepIds.includes(currentStep.id)) {
                setCompletedStepIds(prev => [...prev, currentStep.id]);
                // Auto-advance after short delay for better UX
                if (currentStepIndex < GUIDE_STEPS.length - 1) {
                    setTimeout(() => setCurrentStepIndex(prev => prev + 1), 1000);
                }
            }
        }
    }, [workbenchItems, currentStepIndex, completedStepIds]);


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
                if (!['flask', 'volumetric-flask', 'cylinder'].includes(item.type)) return false;

                // Simple collision detection for "underneath"
                // Source center X approx = Target center X
                // Source Bottom Y approx = Target Top Y

                const xDiff = Math.abs((item.x) - (source.x));
                const yDiff = item.y - source.y;
                return xDiff < 40 && yDiff > 100 && yDiff < 400;
            });

            // Always update items (to capture source changes regardless of target existence)
            return prevItems.map(item => {
                // Update Target (if exists)
                if (target && item.id === target.id) {
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

                // Update Source (Burette) - Always track volume loss
                if (item.id === sourceId) {
                    return {
                        ...item,
                        props: {
                            ...item.props,
                            fill: Math.max(0, (item.props.fill !== undefined ? item.props.fill : 100) - amount)
                        }
                    };
                }

                return item;
            });
        });
    };



    // ... existing code ...

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
            case 'clamp': Component = <Clamp {...item.props} />; break;
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
                Component = <TitrationFlask {...item.props} onAddContent={(a, c, t) => handleFlaskAdd(item.id, a, c)} />;
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
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col z-20 shadow-2xl">
                <div className="p-4 border-b border-gray-700">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-400">LabSathi</h1>
                    <p className="text-xs text-gray-500">Drag items to workbench</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <ShelfCategory title="Apparatus">
                        <ShelfItem highlight={currentStepIndex === 0 && !workbenchItems.some(i => i.type === 'stand')} type="stand" label="Retort Stand"><div className="scale-50 origin-top-left"><Stand /></div></ShelfItem>
                        <ShelfItem highlight={currentStepIndex === 1 && !workbenchItems.some(i => i.type === 'clamp')} type="clamp" label="Clamp"><div className="scale-75 origin-top-left"><Clamp /></div></ShelfItem>
                        <ShelfItem highlight={currentStepIndex === 3 && !workbenchItems.some(i => i.type === 'tile')} type="tile" label="White Tile"><div className="scale-50"><Tile /></div></ShelfItem>
                    </ShelfCategory>
                    <ShelfCategory title="Glassware">
                        <ShelfItem highlight={currentStepIndex === 2 && !workbenchItems.some(i => i.type === 'burette')} type="burette" label="Burette"><div className="scale-75 origin-top-left h-32 overflow-hidden"><Burette fill={80} /></div></ShelfItem>
                        <ShelfItem highlight={currentStepIndex === 4 && !workbenchItems.some(i => i.type === 'titration-flask')} type="titration-flask" label="Titration Flask"><div className="scale-75"><TitrationFlask fill={30} label="Interactive" /></div></ShelfItem>
                        <ShelfItem highlight={currentStepIndex === 4 && !workbenchItems.some(i => i.type === 'flask')} type="flask" label="Conical Flask"><div className="scale-75"><Flask fill={30} /></div></ShelfItem>
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

            <div className="flex-1 flex flex-col relative bg-slate-950">
                <div className="h-16 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between px-8 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                        <span className="text-sm text-slate-400 font-mono font-medium">Workbench 1</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700/50 shadow-lg backdrop-blur-md">
                            <Circle className="text-pink-500 fill-pink-500/20 animate-pulse" size={10} />
                            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Guide</span>
                            <div className="h-3 w-px bg-slate-700"></div>
                            <span className="text-xs font-medium text-pink-400">Step {currentStepIndex + 1} of {GUIDE_STEPS.length}</span>
                        </div>
                        <button
                            onClick={() => setWorkbenchItems([])}
                            className="text-xs font-medium bg-red-500/10 text-red-400 px-4 py-2 rounded-full hover:bg-red-500/20 hover:text-red-300 transition-all border border-red-500/20 hover:border-red-500/40"
                        >
                            Clear Workbench
                        </button>
                    </div>
                </div>

                {/* Guide Overlay - Top Right */}
                <div className="absolute top-24 right-8 z-30 w-80 pointer-events-none">
                    <div className="group bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden animate-in slide-in-from-right-10 duration-700 pointer-events-auto transition-all hover:bg-slate-900/90 hover:border-slate-600/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-pink-500/5 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative p-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-transparent">
                            <h2 className="font-bold text-slate-100 flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white text-xs font-bold shadow-lg shadow-pink-500/20">{currentStepIndex + 1}</span>
                                {GUIDE_STEPS[currentStepIndex]?.title || "Lab Complete"}
                            </h2>
                        </div>
                        <div className="relative p-5 space-y-5">
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                {GUIDE_STEPS[currentStepIndex]?.description || "Congratulations! You have completed the titration setup."}
                            </p>

                            {/* Progress indicator */}
                            <div className="space-y-3 pt-3 border-t border-slate-700/50">
                                {GUIDE_STEPS.map((step, idx) => (
                                    <div key={step.id} className={`flex items-center gap-3 text-xs transition-colors duration-300 ${idx === currentStepIndex ? 'text-cyan-50' : idx < currentStepIndex ? 'text-emerald-400/80' : 'text-slate-600'}`}>
                                        {idx < currentStepIndex ?
                                            <CheckCircle2 size={14} className="text-emerald-500" /> :
                                            <Circle size={14} className={idx === currentStepIndex ? "text-cyan-400 fill-cyan-400/20 animate-pulse" : "text-slate-700"} />
                                        }
                                        <span className={idx === currentStepIndex ? "font-semibold tracking-wide" : ""}>{step.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chemistry Inspector Overlay - Top Left */}
                {hoveredItemData && (hoveredItemData.containerState || hoveredItemData.type === 'burette') && (
                    <div className="absolute top-24 left-8 z-30 w-64 pointer-events-none animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="bg-gray-800/90 backdrop-blur border border-gray-600 p-4 rounded-md shadow-xl">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-700 pb-1">Inspector</h3>

                            {hoveredItemData.type === 'burette' ? (
                                <div className="space-y-2 text-xs font-mono text-gray-300">
                                    <div className="flex justify-between">
                                        <span>Type:</span>
                                        <span className="text-cyan-400">Burette</span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                                        <span>Volume Used:</span>
                                        <span className="text-blue-400">{(100 - (hoveredItemData.props?.fill ?? 100)).toFixed(1)} mL</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Content:</span>
                                        <span className="text-white">NaOH (0.1M)</span>
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-500 italic">
                                        Initial volume: 100mL
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 text-xs font-mono text-gray-300">
                                    <div className="flex justify-between">
                                        <span>Volume:</span>
                                        <span className="text-blue-400">{hoveredItemData.containerState!.totalVolume.toFixed(1)} mL</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Moles H+:</span>
                                        <span className="text-red-400">{hoveredItemData.containerState!.molesH.toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Moles OH-:</span>
                                        <span className="text-blue-400">{hoveredItemData.containerState!.molesOH.toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                                        <span>Indicator:</span>
                                        <span className={hoveredItemData.containerState!.hasIndicator ? "text-green-400" : "text-gray-500"}>
                                            {hoveredItemData.containerState!.hasIndicator ? "YES" : "NO"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>State:</span>
                                        <span className={
                                            hoveredItemData.containerState!.molesOH > hoveredItemData.containerState!.molesH
                                                ? "text-pink-500 font-bold"
                                                : "text-white/50"
                                        }>
                                            {hoveredItemData.containerState!.molesOH > hoveredItemData.containerState!.molesH ? "BASIC (Pink)" : "NEUTRAL/ACID"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div
                    ref={workbenchRef}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-gray-900 overflow-hidden touch-none"
                >

                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-60"></div>

                    {workbenchItems.map(renderItem)}

                    {workbenchItems.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-600">
                                    <div className="w-3 h-3 bg-cyan-500 rounded-full animate-ping"></div>
                                </div>
                                <p className="text-3xl mb-3 font-light text-slate-500 tracking-tight">Workbench Ready</p>
                                <p className="text-slate-600 font-medium">Drag apparatus from the left to begin setup</p>
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
        <div className="mb-6">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 pl-1">{title}</h3>
            <div className="grid grid-cols-2 gap-3">{children}</div>
        </div>
    )
}

interface ShelfItemProps {
    type: string;
    label: string;
    children: React.ReactNode;
    highlight?: boolean;
}

function ShelfItem({ type, label, children, highlight = false }: ShelfItemProps) {
    return (
        <Draggable id={`template-${type}`} type={type} className="flex flex-col items-center group cursor-grab active:cursor-grabbing relative">
            {highlight && (
                <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-2xl blur-md opacity-70 animate-pulse pointer-events-none"></div>
            )}
            <div className={`w-full aspect-square bg-slate-800/40 rounded-xl border flex items-center justify-center transition-all duration-300 overflow-hidden relative ${highlight ? 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]' : 'border-slate-700/50 group-hover:bg-slate-800 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>
                {children}
            </div>
            <span className={`text-[11px] font-medium mt-3 text-center leading-tight transition-colors duration-300 ${highlight ? 'text-cyan-300 font-bold' : 'text-slate-500 group-hover:text-cyan-400'}`}>{label}</span>
        </Draggable>
    )
}