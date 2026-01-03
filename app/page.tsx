"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
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
import { AIInstructor } from "./components/ai/AIInstructor";

interface LabItem {
    id: string;
    type: string;
    x: number;
    y: number;
    snappedToId?: string | null;
    props?: any;
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
        title: "Prepare Tile",
        description: "Place a White Tile on the base of the stand to see color changes clearly.",
        check: (items) => items.some(i => i.type === 'tile')
    },
    {
        id: 3,
        title: "Mount Burette",
        description: "Attach a Burette to the stand clamp. Drag it near the top of the stand.",
        check: (items) => items.some(i => i.type === 'burette' && i.snappedToId?.startsWith('clamp-'))
    },
    {
        id: 4,
        title: "Place Flask",
        description: "Place a Conical Flask on the white tile under the burette.",
        check: (items) => items.some(i => i.type === 'flask' && i.snappedToId?.startsWith('base-'))
    },
    {
        id: 5,
        title: "Start Titration",
        description: "Open the burette tap to release the titrant into the flask. Observe the color change.",
        check: (items) => items.some(i => i.type === 'flask' && (i.props.fill > 20 || i.props.color !== 'bg-transparent')) // Check if liquid added
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

    // --- AI Logic ---
    const addToChat = (role: "user" | "model" | "system", content: string) => {
        setMessages(prev => [...prev, { role, content }]);
    };

    const askAI = async (prompt: string, isError = false) => {
        // if (!apiKey) return; // Optional now since we have server key
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

            // Handle mistakes if returned
            if (data.mistakes && data.mistakes.length > 0) {
                // We could highlight UI, for now just chat response covers it
            }

        } catch (error: any) {
            console.error("AI Error", error);
            addToChat("model", `Error: ${error.message || "Network issue"}`);
        } finally {
            setIsLoading(false);
        }
    };

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
            case 'burette': return { fill: 100, open: false, color: 'bg-blue-400/50' };
            case 'flask': return { fill: 20, color: 'bg-transparent', label: 'Analyte', contents: ['analyte'] };
            case 'titration-flask': return { fill: 0, color: 'bg-transparent', label: 'Interactive', contents: [] };
            case 'volumetric-flask': return { fill: 0, color: 'bg-transparent', label: '250ml', contents: [] };
            case 'bottle-naoh': return { label: 'NaOH', color: 'bg-blue-500' };
            case 'stand': return { height: 'h-96' };
            default: return {};
        }
    };

    const handleValveChange = (id: string, angle: number) => {
        // Find the item to check its fill level
        const item = workbenchItems.find(i => i.id === id);
        if (item) {
            const fill = item.props.fill || 0;
            if (angle > 45 && fill < 10 && fill > 0) {
                askAI("Warning: You are opening the valve too fast (>45°) when the burette is nearly empty (<10%). This can lead to air bubbles.", true);
            }
        }
    };

    const handleDispense = (sourceId: string, amount: number, color: string, type: string = 'Water') => {
        setWorkbenchItems(prevItems => {
            const source = prevItems.find(i => i.id === sourceId);
            if (!source) return prevItems;

            const target = prevItems.find(item => {
                if (item.id === sourceId) return false;
                if (!['flask', 'volumetric-flask', 'cylinder', 'titration-flask'].includes(item.type)) return false;

                const xDiff = Math.abs((item.x) - (source.x));
                const yDiff = item.y - source.y;
                return xDiff < 40 && yDiff > 100 && yDiff < 400; // isUnder
            });

            if (target) {
                // Return new state
                return prevItems.map(item => {
                    if (item.id === target.id) {
                        const currentFill = item.props.fill || 0;
                        const newFill = Math.min(100, currentFill + amount);
                        const newColor = currentFill < 5 ? color : item.props.color;

                        // Side Effect: AI Checks (Done here for simplicity, debounced by askAI)
                        if ((target.type === 'flask' || target.type === 'titration-flask') && type !== 'Water') {
                            const hasIndicator = (target.props.contents || []).includes('indicator');
                            if (!hasIndicator && amount > 0.1) {
                                // We need to call this asynchronously to avoid render issues?
                                // Actually it's an event handler update, so calling askAI (which sets state) is fine in React 18 
                                // BUT this is inside the functional update of setState. State updates inside setState reducer is a NO-NO.
                                // We must move this check out.
                            }
                        }

                        // We will handle AI checks in a useEffect or separate handler wrapper.
                        // For now, let's just update state.

                        return {
                            ...item,
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

        // --- AI CHECKS (Safe here) ---
        // Duplicate finding logic slightly or use the closure's workbenchItems?
        // workbenchItems is from the render cycle.
        const source = workbenchItems.find(i => i.id === sourceId);
        if (source) {
            const target = workbenchItems.find(item => {
                if (item.id === sourceId) return false;
                if (!['flask', 'volumetric-flask', 'cylinder', 'titration-flask'].includes(item.type)) return false;
                const xDiff = Math.abs((item.x) - (source.x));
                const yDiff = item.y - source.y;
                return xDiff < 40 && yDiff > 100 && yDiff < 400;
            });

            if (target) {
                const isTitration = target.type === 'flask' || target.type === 'titration-flask';
                const hasIndicator = (target.props.contents || []).includes('indicator');

                // Record Action
                const newAction = {
                    step: type === 'Water' ? 0 : (type === 'NaOH' ? 4 : 2), // Approximate mapping to our knowledge base steps
                    action: type,
                    value: amount,
                    unit: 'ml'
                };
                // Only add if meaningful amount
                if (amount > 0.1) {
                    setStudentActions(prev => [...prev, newAction]);

                    // Trigger agent check for this action
                    // We use a small timeout to let state update or just fire with current+new
                    // For simplicity, we just fire the check if it looks like a mistake or every X moves
                }

                if (isTitration && !hasIndicator && type !== 'Water' && amount > 0.1) {
                    // Still keep immediate client-side check if needed, or rely on agent
                    askAI("You are starting titration without adding an indicator!", true);
                }
                if ((target.props.fill || 0) > 95) {
                    askAI("Watch out! The flask is about to overflow.", true);
                }
            }
        }
    };





    // ... existing code ...

    const handleFlaskAdd = (id: string, amount: number, color: string, type: string) => {
        setWorkbenchItems(items => items.map(item => {
            if (item.id === id) {
                const currentFill = item.props.fill || 0;
                // Assume 250mL capacity. 100% = 250mL => 1mL = 0.4%
                const addPercent = amount * 0.4;
                const newFill = Math.min(100, currentFill + addPercent);

                // Color logic: manual addition overrides color if dominant?
                // For now, if adding "Water" (solvent), keep existing color but dilute? 
                // Let's stick to simple replacement if empty, or mixing if logic exists.
                // Simplified: New color takes over if it was empty-ish.
                const newColor = currentFill < 5 ? color : item.props.color;

                return {
                    ...item,
                    props: { ...item.props, fill: newFill, color: newColor }
                };
            }
            return item;
        }));
    };

    // --- 3. RENDER PIECE ---
    const renderItem = (item: LabItem) => {
        let Component;
        switch (item.type) {
            case 'stand': Component = <Stand {...item.props} />; break;
            case 'burette':
                Component = <Burette {...item.props} onDispense={(a, c, t) => handleDispense(item.id, a, c, t)} onValveChange={(angle) => handleValveChange(item.id, angle)} />;
                break;
            case 'flask': Component = <Flask {...item.props} />; break;
            case 'titration-flask':
                Component = <TitrationFlask {...item.props} onAddContent={(a, c, t) => handleFlaskAdd(item.id, a, c, t)} />;
                break;
            case 'volumetric-flask': Component = <VolumetricFlask {...item.props} />; break;
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
            >
                {Component}
            </DraggableLabObject>
        );
    };

    return (
        <main className="flex h-screen bg-gray-900 overflow-hidden text-white selection:bg-pink-500/30">
            {/* Sidebar */}
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
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-800/80 px-4 py-1.5 rounded-full border border-gray-700/50 shadow-sm">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Lab Guide</span>
                            <div className="h-3 w-px bg-gray-700"></div>
                            <span className="text-xs font-medium text-pink-400">Step {currentStepIndex + 1}/{GUIDE_STEPS.length}</span>
                        </div>
                        <button onClick={() => setWorkbenchItems([])} className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded hover:bg-red-500/20 transition-colors">Clear All</button>
                    </div>
                </div>

                {/* Guide Overlay */}
                <div className="absolute top-20 right-6 z-30 w-80 pointer-events-none">
                    <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-right-10 duration-500 pointer-events-auto">
                        <div className="bg-gradient-to-r from-blue-600/20 to-pink-600/20 p-4 border-b border-gray-700/50">
                            <h2 className="font-bold text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-500 text-xs">{currentStepIndex + 1}</span>
                                {GUIDE_STEPS[currentStepIndex]?.title || "Lab Complete"}
                            </h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {GUIDE_STEPS[currentStepIndex]?.description || "Congratulations! You have completed the titration setup."}
                            </p>

                            {/* Progress indicator */}
                            <div className="space-y-2 pt-2 border-t border-gray-700/50">
                                {GUIDE_STEPS.map((step, idx) => (
                                    <div key={step.id} className={`flex items-center gap-3 text-xs ${idx === currentStepIndex ? 'text-white font-medium' : idx < currentStepIndex ? 'text-green-400' : 'text-gray-500'}`}>
                                        {idx < currentStepIndex ?
                                            <CheckCircle2 size={12} className="text-green-400" /> :
                                            <Circle size={12} className={idx === currentStepIndex ? "text-pink-500 fill-pink-500/20" : "text-gray-600"} />
                                        }
                                        <span className={idx === currentStepIndex ? "text-pink-100" : ""}>{step.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

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

            {/* AI Instructor Panel */}
            <AIInstructor
                messages={messages}
                onSendMessage={(msg) => askAI(msg, false)}
                isLoading={isLoading}
            />
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