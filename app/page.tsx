"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
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
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <SidebarSection title="Apparatus">
                        <SidebarItem highlight={currentStepIndex === 0 && !workbenchItems.some(i => i.type === 'stand')} type="stand" label="Retort Stand"><div className="scale-50 origin-top-left flex items-center justify-center w-full h-full"><Stand /></div></SidebarItem>
                        <SidebarItem highlight={currentStepIndex === 1 && !workbenchItems.some(i => i.type === 'clamp')} type="clamp" label="Clamp"><div className="scale-75 origin-top-left flex items-center justify-center w-full h-full"><Clamp /></div></SidebarItem>
                    </SidebarSection>

                    <SidebarSection title="Glassware">
                        <SidebarItem highlight={currentStepIndex === 2 && !workbenchItems.some(i => i.type === 'burette')} type="burette" label="Burette"><div className="scale-50 origin-top-left h-24 overflow-hidden flex items-center justify-center w-full"><Burette fill={80} /></div></SidebarItem>
                        <SidebarItem highlight={currentStepIndex === 4 && !workbenchItems.some(i => i.type === 'titration-flask')} type="titration-flask" label="Titration Flask"><div className="scale-50 flex items-center justify-center w-full h-full"><TitrationFlask fill={30} label="Interactive" /></div></SidebarItem>
                        <SidebarItem highlight={currentStepIndex === 4 && !workbenchItems.some(i => i.type === 'flask')} type="flask" label="Conical Flask"><div className="scale-50 flex items-center justify-center w-full h-full"><Flask fill={30} /></div></SidebarItem>
                        <SidebarItem highlight={currentStepIndex === 3 && !workbenchItems.some(i => i.type === 'volumetric-flask')} type="volumetric-flask" label="Vol. Flask"><div className="scale-35 flex items-center justify-center w-full h-full"><VolumetricFlask fill={100} color="bg-blue-400/20" /></div></SidebarItem>
                        <SidebarItem type="cylinder" label="Meas. Cylinder"><div className="scale-50 flex items-center justify-center w-full h-full"><MeasuringCylinder fill={50} /></div></SidebarItem>
                        <SidebarItem type="funnel" label="Funnel"><div className="scale-50 flex items-center justify-center w-full h-full"><Funnel /></div></SidebarItem>
                    </SidebarSection>

                    <SidebarSection title="Reagents">
                        <SidebarItem type="bottle-naoh" label="NaOH"><div className="scale-40 origin-center flex items-center justify-center w-full h-full"><Bottle label="NaOH" color="bg-blue-500" /></div></SidebarItem>
                        <SidebarItem type="bottle-hcl" label="HCl"><div className="scale-40 origin-center flex items-center justify-center w-full h-full"><Bottle label="HCl" color="bg-transparent" /></div></SidebarItem>
                        <SidebarItem type="bottle-phenol" label="Phenol."><div className="scale-40 origin-center flex items-center justify-center w-full h-full"><Bottle label="Phenol." color="bg-pink-500" type="reagent" /></div></SidebarItem>
                        <SidebarItem type="pipette" label="Pipette"><div className="scale-40 origin-center -rotate-45 flex items-center justify-center w-full h-full"><Pipette fill={50} /></div></SidebarItem>
                    </SidebarSection>
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

                {/* Guide Overlay - Top Right */}
                <div className="absolute top-24 right-8 z-30 w-80 pointer-events-none">
                    <div className="group bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-right-10 duration-700 pointer-events-auto transition-all hover:border-slate-600">
                        <div className="relative p-5 border-b border-slate-700 bg-slate-800/50">
                            <h2 className="font-bold text-slate-100 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500 text-slate-900 text-sm font-black">{currentStepIndex + 1}</span>
                                {GUIDE_STEPS[currentStepIndex]?.title || "Lab Complete"}
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
                                <p className="text-slate-600 font-medium">Drag apparatus from the dock below to begin setup</p>
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

// Draw.io Style Sidebar Components

function SidebarSection({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 py-2 px-1 hover:bg-slate-800/50 rounded-lg transition-colors group text-left"
            >
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}>
                    <svg className="w-3 h-3 text-slate-500 group-hover:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex-1">{title}</h3>
                <span className="text-[9px] text-slate-600 font-medium bg-slate-800 px-1.5 py-0.5 rounded-md">
                    {React.Children.count(children)}
                </span>
            </button>
            {isOpen && (
                <div className="grid grid-cols-2 gap-3 mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    )
}




// SidebarItem Component with Highlighting
function SidebarItem({ type, label, children, highlight = false }: { type: string, label: string, children: React.ReactNode, highlight?: boolean }) {
    return (
        <Draggable id={`template-${type}`} type={type} className="flex flex-col items-center group relative cursor-grab active:cursor-grabbing">
            <div className={`w-full aspect-square bg-[#0f172a] rounded-xl border flex items-center justify-center transition-all duration-300 overflow-hidden relative shadow-lg ${highlight
                ? 'border-cyan-500/50 bg-cyan-500/5 ring-4 ring-cyan-500/10'
                : 'border-slate-800 group-hover:border-slate-700 group-hover:bg-slate-800/80 group-hover:-translate-y-0.5 shadow-slate-950/20'
                }`}>

                {/* Visual Polish */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none"></div>

                {highlight && (
                    <>
                        <div className="absolute inset-0 bg-cyan-500/5 animate-pulse pointer-events-none"></div>
                        <div className="absolute top-0 right-0 p-1">
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                        </div>
                    </>
                )}

                <div className="relative z-10 w-full h-full flex items-center justify-center p-2 transition-transform duration-300 group-hover:scale-110">
                    {children}
                </div>
            </div>
            <div className="w-full text-center mt-2 px-1">
                <span className={`text-[10px] font-bold tracking-tight leading-tight transition-colors duration-200 block truncate ${highlight
                    ? 'text-cyan-400'
                    : 'text-slate-500 group-hover:text-slate-300'
                    }`}>{label}</span>
            </div>
        </Draggable>
    );
}