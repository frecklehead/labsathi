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
import { AIInstructor } from "./components/ai/Allinstructor";

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
        title: "Place Flask",
        description: "Place a Conical Flask or Titration Flask on the white tile under the burette.",
        check: (items) => items.some(i => (i.type === 'flask' || i.type === 'titration-flask') && i.snappedToId?.startsWith('base-'))
    },
    {
        id: 5,
        title: "Start Titration",
        description: "Open the burette tap to release the titrant into the flask. Observe the color change.",
        check: (items) => items.some(i => (i.type === 'flask' || i.type === 'titration-flask') && (i.props.fill > 20 || i.props.color !== 'bg-transparent')) // Check if liquid added
    }
];

export default function TitrationLab() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedStepIds, setCompletedStepIds] = useState<number[]>([]);

    // AI State
    const [messages, setMessages] = useState<{ role: "user" | "model" | "system", content: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastErrorTime, setLastErrorTime] = useState(0);

    // Action Tracking for Agent
    const [studentActions, setStudentActions] = useState<Array<{ step: number, action: string, value: number, unit: string }>>([]);

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

    // --- AI Logic ---
    const addToChat = (role: "user" | "model" | "system", content: string) => {
        setMessages(prev => [...prev, { role, content }]);
    };

    const askAI = async (prompt: string, isError = false) => {
        if (Date.now() - lastErrorTime < 5000 && isError) return; // Debounce errors

        if (isError) setLastErrorTime(Date.now());
        if (!isError) {
            addToChat("user", prompt);
            setIsLoading(true);
        }

        try {
            const response = await fetch('/api/lab-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    experimentId: 'acid-base-titration',
                    studentActions,
                    studentQuestion: isError ? undefined : prompt,
                    conversationHistory: messages
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            const text = data.response;
            addToChat("model", text);

        } catch (error: any) {
            console.error("AI Error", error);
            addToChat("model", `Error: ${error.message || "Network issue"}`);
        } finally {
            setIsLoading(false);
        }
    };


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
            case 'pipette': return { fill: 0, label: '25ml' };
            case 'stand': return { height: 'h-[500px]' };
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



    // --- 2. LOGIC ENGINE ---

    // Generalized helper to update container state
    const updateContainerState = (
        current: ContainerState | undefined,
        addVolume: number,
        addType: string,
        addConcentration: number = 0.1,
        currentColor: string = 'bg-transparent',
        addedColor: string = 'bg-transparent'
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
        let newColor = currentColor;

        if (hasIndicator) {
            newColor = calculateColor(newState);
        } else {
            // If no indicator, adoption of added liquid color
            // Check for strong colors (KMnO4, Indicator, Strong Blue)
            const isStrongColor = addedColor.includes('purple') || addedColor.includes('pink') || addedColor.includes('blue-500');

            if (isStrongColor) {
                newColor = addedColor;
            } else if (currentColor === 'bg-transparent' && addedColor !== 'bg-transparent') {
                // Initial fill with something that has slight color (like water/base)
                newColor = addedColor;
            }
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
        else if (color.includes('bg-purple')) { type = 'oxidizer'; conc = 0.1; } // KMnO4

        // AI Action Tracking
        const newAction = {
            step: 2, // General dispensing step
            action: `Dispensed ${type}`,
            value: amount,
            unit: 'ml'
        };
        if (amount > 0.5) {
            setStudentActions(prev => [...prev, newAction]);

            // Simple check: Excess filling
            const targetItem = workbenchItems.find(item => {
                if (item.id === sourceId) return false;
                if (!['flask', 'volumetric-flask', 'cylinder'].includes(item.type)) return false;
                const xDiff = Math.abs((item.x) - (workbenchItems.find(i => i.id === sourceId)?.x || 0));
                const yDiff = item.y - (workbenchItems.find(i => i.id === sourceId)?.y || 0);
                return xDiff < 40 && yDiff > 100 && yDiff < 400;
            });

            if (targetItem && (targetItem.props.fill || 0) > 95) {
                askAI("Watch out! The flask is about to overflow.", true);
            }
        }

        setWorkbenchItems(prevItems => {
            const source = prevItems.find(i => i.id === sourceId);
            if (!source) return prevItems;

            const target = prevItems.find(item => {
                if (item.id === sourceId) return false;
                if (!['flask', 'volumetric-flask', 'cylinder'].includes(item.type)) return false;


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
                        conc,
                        item.props.color,
                        color // addedColor
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
                    concentration,
                    item.props.color,
                    color
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
                Component = <TitrationFlask {...item.props} onAddContent={(a, c, t) => handleFlaskAdd(item.id, a, c, t)} />;
                break;
            case 'volumetric-flask':
                Component = <VolumetricFlask {...item.props} onAddContent={(a, c, t) => handleFlaskAdd(item.id, a, c, t)} />;
                break;
            case 'tile': Component = <Tile />; break;
            case 'funnel': Component = <Funnel />; break;
            case 'cylinder': Component = <MeasuringCylinder fill={0} />; break;
            case 'bottle-naoh': Component = <Bottle label="NaOH" color="bg-blue-500" />; break;
            case 'bottle-hcl': Component = <Bottle label="HCl" color="bg-transparent" />; break;
            case 'bottle-phenol': Component = <Bottle label="Phenol." color="bg-pink-500" type="reagent" />; break;
            case 'wash-bottle': Component = <Bottle label="H2O" color="bg-blue-200" type="wash" />; break;
            case 'pipette': Component = <Pipette {...item.props} />; break;
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
        <main className="flex h-screen bg-[#1e1e1e] overflow-hidden text-[#d4d4d4] font-sans">
            {/* Sidebar (Draw.io Style) */}
            <aside className="w-60 bg-[#2a2a2a] border-r border-[#3e3e3e] flex flex-col z-20 shadow-xl select-none">
                {/* Header / Search */}
                <div className="p-3 border-b border-[#3e3e3e] bg-[#252526]">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-pink-600 rounded flex items-center justify-center text-white font-bold text-xs">L</div>
                        <h1 className="text-sm font-semibold text-gray-200 tracking-wide">LabSathi</h1>
                    </div>
                    {/* Search Bar Input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search shapes..."
                            className="w-full bg-[#3c3c3c] text-xs text-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-[#3e3e3e]"
                        />
                        <div className="absolute right-2 top-1.5 text-gray-500">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#424242] scrollbar-track-transparent">

                    {/* Sidebar Content */}

                    <SidebarSection title="General Apparatus" defaultOpen={true}>
                        <div className="grid grid-cols-3 gap-2 p-2">
                            <SidebarItem type="stand" label="Stand" highlight={GUIDE_STEPS[currentStepIndex]?.target === 'stand'}><div className="scale-[0.08] text-gray-400 origin-center"><Stand /></div></SidebarItem>
                            <SidebarItem type="clamp" label="Clamp" highlight={GUIDE_STEPS[currentStepIndex]?.target === 'clamp'}><div className="scale-[0.3] text-gray-400 origin-center"><Clamp /></div></SidebarItem>
                            <SidebarItem type="tile" label="Tile" highlight={GUIDE_STEPS[currentStepIndex]?.target === 'tile'}><div className="scale-[0.25] text-gray-400 origin-center"><Tile /></div></SidebarItem>
                        </div>
                    </SidebarSection>

                    <SidebarSection title="Glassware & Flasks" defaultOpen={true}>
                        <div className="grid grid-cols-2 gap-2 p-2">
                            <SidebarItem type="burette" label="Burette" highlight={GUIDE_STEPS[currentStepIndex]?.target === 'burette'}><div className="scale-[0.3] origin-center h-24 overflow-hidden"><Burette fill={0} color="bg-transparent" /></div></SidebarItem>
                            <SidebarItem type="titration-flask" label="Titration" highlight={GUIDE_STEPS[currentStepIndex]?.target === 'titration-flask'}><div className="scale-[0.3] origin-center"><TitrationFlask fill={0} label="" /></div></SidebarItem>
                            <SidebarItem type="flask" label="Conical" highlight={GUIDE_STEPS[currentStepIndex]?.target === 'flask'}><div className="scale-[0.3] origin-center"><Flask fill={0} /></div></SidebarItem>
                            <SidebarItem type="volumetric-flask" label="Volumetric" highlight={GUIDE_STEPS[currentStepIndex]?.target === 'volumetric-flask'}><div className="scale-[0.25] origin-center"><VolumetricFlask fill={0} color="bg-transparent" /></div></SidebarItem>
                            <SidebarItem type="cylinder" label="Cylinder" highlight={GUIDE_STEPS[currentStepIndex]?.target === 'cylinder'}><div className="scale-[0.35] origin-center"><MeasuringCylinder fill={0} /></div></SidebarItem>
                            <SidebarItem type="funnel" label="Funnel" highlight={GUIDE_STEPS[currentStepIndex]?.target === 'funnel'}><div className="scale-[0.4] origin-center"><Funnel /></div></SidebarItem>
                            <SidebarItem type="tube" label="Test Tube" highlight={GUIDE_STEPS[currentStepIndex]?.target === 'tube'}><div className="scale-[0.25] origin-center"><Tube fill={0} /></div></SidebarItem>
                        </div>
                    </SidebarSection>

                    <SidebarSection title="Misc" defaultOpen={false}>
                        <div className="grid grid-cols-4 gap-2 p-2">
                            <SidebarItem type="pipette" label="Pipette" highlight={GUIDE_STEPS[currentStepIndex]?.target === 'pipette'}><div className="scale-[0.3] -rotate-45 origin-center"><Pipette fill={0} color="bg-yellow-500/50" /></div></SidebarItem>
                        </div>
                    </SidebarSection>

                    {/* Reagents Section REMOVED as requested */}

                </div>
            </aside>

            {/* Main Workspace Area */}
            <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
                {/* Top Toolbar (simplified) */}
                <div className="h-10 bg-[#2d2d2d] border-b border-[#3e3e3e] flex items-center justify-between px-4">
                    <div className="flex items-center gap-4 text-[#cccccc] text-xs">
                        <span className="cursor-pointer hover:bg-[#3e3e3e] px-2 py-1 rounded">File</span>
                        <span className="cursor-pointer hover:bg-[#3e3e3e] px-2 py-1 rounded">Edit</span>
                        <span className="cursor-pointer hover:bg-[#3e3e3e] px-2 py-1 rounded">View</span>
                        <span className="cursor-pointer hover:bg-[#3e3e3e] px-2 py-1 rounded">Arrange</span>
                        <span className="cursor-pointer hover:bg-[#3e3e3e] px-2 py-1 rounded">Extras</span>
                        <span className="px-2 py-1 opacity-50">|</span>
                        <span className="text-cyan-400 font-mono">Workbench 1</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-[#3e3e3e] px-3 py-1 rounded text-xs">
                            <span className="text-pink-400 font-bold">Step {currentStepIndex + 1}</span>
                            <span className="opacity-50">/</span>
                            <span>{GUIDE_STEPS.length}</span>
                        </div>
                        <button
                            onClick={() => setWorkbenchItems([])}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded text-xs border border-red-900/50 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Guide Overlay - Top Right - Styled Darker */}
                <div className="absolute top-16 right-6 z-30 w-72 pointer-events-none">
                    <div className="bg-[#252526]/90 backdrop-blur border border-[#3e3e3e] shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden pointer-events-auto transition-transform hover:scale-[1.01]">
                        <div className="px-4 py-3 bg-gradient-to-r from-[#2d2d2d] to-[#363636] border-b border-[#3e3e3e] flex items-center justify-between">
                            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Guide: {GUIDE_STEPS[currentStepIndex]?.title}
                            </h2>
                        </div>
                        <div className="p-4 text-xs text-gray-300 leading-relaxed font-medium">
                            {GUIDE_STEPS[currentStepIndex]?.description || "Setup Complete."}
                            <div className="mt-4 pt-3 border-t border-[#3e3e3e] space-y-2 opacity-90">
                                {GUIDE_STEPS.map((step, idx) => (
                                    <div key={step.id} className={`flex items-center gap-2 transition-all duration-300 ${idx === currentStepIndex ? 'translate-x-1' : ''}`}>
                                        {idx < currentStepIndex ?
                                            <div className="w-3 h-3 text-green-500">✓</div> :
                                            <div className={`w-3 h-3 rounded-full border transition-colors ${idx === currentStepIndex ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'border-gray-600'}`}></div>
                                        }
                                        <span className={`transition-colors duration-300 ${idx === currentStepIndex ? "text-cyan-300 font-bold" : idx < currentStepIndex ? "text-gray-500 line-through" : "text-gray-500"}`}>{step.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


                {/* Chemistry Inspector Overlay - Top Left */}
                {hoveredItemData && (hoveredItemData.containerState || hoveredItemData.type === 'burette') && (
                    <div className="absolute top-16 left-6 z-30 w-64 pointer-events-none">
                        <div className="bg-[#252526]/95 backdrop-blur border border-[#3e3e3e] p-3 rounded shadow-xl text-xs font-mono">
                            <div className="text-gray-400 mb-2 border-b border-[#3e3e3e] pb-1">INSPECTOR</div>
                            {/* ... inspector content preserved ... */}
                            <div className="space-y-1">
                                <div className="flex justify-between"><span>ID:</span> <span className="text-sky-400">{hoveredItemData.id.slice(-6)}</span></div>
                                <div className="flex justify-between"><span>Type:</span> <span className="text-white">{hoveredItemData.type}</span></div>
                                { /* Simplified inspector for brevity in this view */}
                                {hoveredItemData.containerState && (
                                    <>
                                        <div className="flex justify-between text-yellow-500"><span>Vol:</span> <span>{hoveredItemData.containerState.totalVolume.toFixed(1)}ml</span></div>
                                        <div className="flex justify-between text-pink-500"><span>pH Status:</span> <span>{hoveredItemData.containerState.molesOH > hoveredItemData.containerState.molesH ? "Basic" : "Acidic"}</span></div>
                                    </>
                                )}
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
                                <p className="text-slate-600 font-medium">Drag apparatus from the dock below to begin setup</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Instructor Panel */}
            <AIInstructor
                messages={messages}
                onSendMessage={(msg) => askAI(msg, false)}
                isLoading={isLoading}
            />
        </main>
    );
}

// Draw.io Style Sidebar Components

function SidebarSection({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-[#3e3e3e]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#2d2d2d] hover:bg-[#383838] transition-colors text-xs font-bold text-gray-400 uppercase tracking-tighter"
            >
                <span>{title}</span>
                <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="bg-[#252526] transition-all duration-300 ease-in-out">
                    {children}
                </div>
            )}
        </div>
    )
}

// SidebarItem Component with Highlighting
function SidebarItem({ type, label, children, highlight = false }: { type: string, label: string, children: React.ReactNode, highlight?: boolean }) {
    return (
        <Draggable id={`template-${type}`} type={type} className="group relative flex flex-col items-center justify-center p-2 rounded hover:bg-[#3e3e3e] cursor-grab active:cursor-grabbing transition-all duration-300 border border-transparent hover:border-[#505050]">
            {highlight && (
                <div className="absolute inset-0 bg-blue-500/20 rounded border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse pointer-events-none"></div>
            )}
            <div className={`w-10 h-10 flex items-center justify-center pointer-events-none mb-1 transition-transform duration-300 ${highlight ? 'scale-110' : ''}`}>
                {children}
            </div>
            <span className={`text-[10px] text-center leading-tight truncate w-full transition-colors ${highlight ? 'text-blue-300 font-bold' : 'text-gray-500 group-hover:text-gray-300'}`}>{label}</span>
            {highlight && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full shadow-lg animate-ping"></div>
            )}
        </Draggable>
    )
}