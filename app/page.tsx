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
import VirtualLabAgent from "./components/ai/VirtualLabAgent";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: { [key: string]: any };
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
        description: "Attach a Burette to the clamp. The burette holds the titrant (known concentration).",
        check: (items) => items.some(i => i.type === 'burette' && i.snappedToId?.startsWith('holder-'))
    },
    {
        id: 4,
        title: "Place Volumetric Flask (Molar Standard)",
        description: "To find the unknown concentration, we first need a standard solution. Place the Volumetric Flask on the base.",
        check: (items) => items.some(i => (i.type === 'flask' || i.type === 'titration-flask' || i.type === 'volumetric-flask') && i.snappedToId?.startsWith('base-'))
    },
    {
        id: 5,
        title: "Perform Titration",
        description: "Open the burette carefully to add titrant to the flask. Watch for the color change (End Point) indicating neutralization.",
        check: (items) => items.some(i => (i.type === 'flask' || i.type === 'titration-flask' || i.type === 'volumetric-flask') && (i.props.fill > 20 || i.props.color !== 'bg-transparent')) // Check if liquid added
    }
];

export default function TitrationLab() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedStepIds, setCompletedStepIds] = useState<number[]>([]);

    // AI State
    const [agentData, setAgentData] = useState<{
        response: string | null;
        issues: any[];
        prediction?: string;
        studentLevel: 'beginner' | 'intermediate' | 'advanced';
    }>({
        response: null,
        issues: [],
        studentLevel: 'intermediate'
    });
    const [messages, setMessages] = useState<any[]>([]);
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
                // Center of w-64 (256px) base is at +128px relative to left
                targets.push({
                    id: `rod-${item.id}`,
                    x: item.x + 128, 
                    y: item.y + 70, // Position on rod
                    radius: 40,
                    validTypes: ['clamp']
                });
                // Stand provides 'base' for Flask
                // Aligned with Burette: Rod X (128) + Clamp Holder Offset (56) = +184
                targets.push({
                    id: `base-${item.id}`,
                    x: item.x + 184, 
                    y: item.y + 500, // Adjusted so flask sits ON base (approx 100px height)
                    radius: 120, // Increased radius for easier snapping
                    validTypes: ['flask', 'cylinder', 'volumetric-flask', 'titration-flask']
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
    const askAI = async (prompt?: string, isError = false) => {
        if (Date.now() - lastErrorTime < 5000 && isError) return; // Debounce errors

        if (isError) setLastErrorTime(Date.now());
        setIsLoading(true);

        try {
            const response = await fetch('/api/lab-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    experimentId: 'kmno4-titration',
                    studentActions,
                    studentQuestion: prompt,
                    conversationHistory: messages,
                    studentLevel: agentData.studentLevel
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setAgentData({
                response: data.response,
                issues: data.issues || [],
                prediction: data.prediction,
                studentLevel: data.studentLevel || 'intermediate'
            });

            // Update conversation history for the agent context
            if (prompt) {
                setMessages(prev => [...prev, { role: 'user', content: prompt }]);
            }
            if (data.response) {
                setMessages(prev => [...prev, { role: 'model', content: data.response }]);
            }

        } catch (error: unknown) {
            console.error("AI Error", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Trigger AI analysis when actions change
    useEffect(() => {
        if (studentActions.length > 0) {
            askAI();
        }
    }, [studentActions]);


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

                // Track action for AI
                setStudentActions(prev => [...prev, {
                    step: currentStepIndex + 1,
                    action: `Setup ${data.type}`,
                    value: 1,
                    unit: 'unit',
                    timestamp: new Date()
                }]);
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
            case 'volumetric-flask': return { 
                fill: 20, // ~50mL
                color: 'bg-transparent', 
                label: 'Standard (HCl)',
                containerState: {
                    totalVolume: 50,
                    molesH: 0.005, // 0.1M * 0.05L
                    molesOH: 0,
                    hasIndicator: true
                }
            };
            case 'titration-flask': return { fill: 0, color: 'bg-transparent', label: 'Reaction' };
            case 'bottle-naoh': return { label: 'NaOH', color: 'bg-blue-500' };
            case 'stand': return { height: 'h-[600px]' };
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
            // We can't setState inside render cycle/if pure function, but this is an event handler so it's fine.
            setStudentActions(prev => [...prev, newAction]);

            // Simple check: Excess filling
            const targetItem = workbenchItems.find(item => {
                if (item.id === sourceId) return false;
                if (!['flask', 'volumetric-flask', 'cylinder'].includes(item.type)) return false;
                const xDiff = Math.abs((item.x) - (workbenchItems.find(i => i.id === sourceId)?.x || 0));
                const yDiff = item.y - (workbenchItems.find(i => i.id === sourceId)?.y || 0);
                return xDiff < 60 && yDiff > 100 && yDiff < 600;
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

                // Simple collision detection for "underneath"
                // Source center X approx = Target center X
                // Source Bottom Y approx = Target Top Y

                const xDiff = Math.abs((item.x) - (source.x));
                const yDiff = item.y - source.y;
                // Increased xDiff tolerance to 60 and yDiff to 600 for taller stand
                return xDiff < 60 && yDiff > 100 && yDiff < 600;
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
            <aside className="w-60 bg-slate-900 border-r border-slate-700 flex flex-col z-20 shadow-2xl">
                <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">LabSathi</h1>
                            <p className="text-xs text-slate-500 font-medium">Virtual Chemistry Lab</p>
                        </div>
                    </div>
                    <div className="mt-4 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <p className="text-[10px] text-slate-400 font-medium">Drag equipment to workbench</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <ShelfCategory title="Apparatus">
                        <ShelfItem highlight={currentStepIndex === 0 && !workbenchItems.some(i => i.type === 'stand')} type="stand" label="Retort Stand"><div className="scale-50 origin-top-left"><Stand /></div></ShelfItem>
                        <ShelfItem highlight={currentStepIndex === 1 && !workbenchItems.some(i => i.type === 'clamp')} type="clamp" label="Clamp"><div className="scale-75 origin-top-left"><Clamp /></div></ShelfItem>
                    </ShelfCategory>
                    <ShelfCategory title="Glassware">
                        <ShelfItem highlight={currentStepIndex === 2 && !workbenchItems.some(i => i.type === 'burette')} type="burette" label="Burette"><div className="scale-75 origin-top-left h-32 overflow-hidden"><Burette fill={80} /></div></ShelfItem>
                        <ShelfItem highlight={currentStepIndex === 4 && !workbenchItems.some(i => i.type === 'titration-flask')} type="titration-flask" label="Titration Flask"><div className="scale-75"><TitrationFlask fill={30} label="Interactive" /></div></ShelfItem>
                        <ShelfItem highlight={currentStepIndex === 4 && !workbenchItems.some(i => i.type === 'flask')} type="flask" label="Conical Flask"><div className="scale-75"><Flask fill={30} /></div></ShelfItem>
                        <ShelfItem highlight={currentStepIndex === 3 && !workbenchItems.some(i => i.type === 'volumetric-flask')} type="volumetric-flask" label="Vol. Flask"><div className="scale-50"><VolumetricFlask fill={100} color="bg-blue-400/20" /></div></ShelfItem>
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
                    <div className="group bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-right-10 duration-700 pointer-events-auto transition-all hover:border-slate-600">
                        <div className="relative p-5 border-b border-slate-700 bg-slate-800/50">
                            <h2 className="font-bold text-slate-100 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-slate-900 text-sm font-black">{currentStepIndex + 1}</span>
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
                    className="flex-1 relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
 bg-gray-900 overflow-hidden touch-none"
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

            {/* Advanced AI Lab Agent */}
            <VirtualLabAgent
                currentStep={currentStepIndex + 1}
                studentActions={studentActions}
                conversationHistory={messages}
                studentLevel={agentData.studentLevel}
                onSendMessage={(msg) => askAI(msg, false)}
                isLoading={isLoading}
                agentResponse={agentData.response}
                issues={agentData.issues}
                prediction={agentData.prediction}
            />
        </main>
    );
}

function ShelfCategory({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 px-2">
                <div className="h-px flex-1 bg-slate-700/50"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h3>
                <div className="h-px flex-1 bg-slate-700/50"></div>
            </div>
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
        <Draggable id={`template-${type}`} type={type} className="flex flex-col items-center group relative">
            {highlight && (
                <div className="absolute -inset-1 bg-cyan-500/20 rounded-2xl animate-pulse pointer-events-none"></div>
            )}
            <div className={`w-full aspect-square bg-slate-800 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 overflow-hidden relative ${highlight
                ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                : 'border-slate-700 group-hover:border-slate-600 group-hover:bg-slate-750'
                }`}>
                <div className="relative z-10 p-2">
                    {children}
                </div>
            </div>
            <span className={`text-[11px] font-semibold mt-2.5 text-center leading-tight transition-colors duration-200 ${highlight
                ? 'text-cyan-400'
                : 'text-slate-400 group-hover:text-slate-300'
                }`}>{label}</span>
        </Draggable>
    )
}