"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Workbench } from "./components/Workbench";
import { AIInstructor } from "../components/ai/Allinstructor";
import { ResultsCard } from "./components/ResultsCard";
import { LabItem, ContainerState } from "./types";
import { GUIDE_STEPS } from "./constants";

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
    
    // End Point Detection State
    const [endPointData, setEndPointData] = useState<{
        detected: boolean;
        buretteInitial: number;
        buretteFinal: number;
        volumeUsed: number;
        flaskVolume: number;
        timestamp: Date;
    } | null>(null);
    const [buretteInitialReading, setBuretteInitialReading] = useState<number>(0);

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

    // End Point Detection
    useEffect(() => {
        if (endPointData?.detected) return; // Already detected

        const flask = workbenchItems.find(i => 
            (i.type === 'flask' || i.type === 'titration-flask' || i.type === 'volumetric-flask') && 
            i.snappedToId?.startsWith('base-')
        );
        
        if (!flask?.containerState) return;

        const { molesH, molesOH, totalVolume, hasIndicator } = flask.containerState;
        const isPink = flask.props.color?.includes('pink') ?? false;
        
        // Detect end point: Pink color AND OH- exceeds H+ by small margin (within 2%)
        if (hasIndicator && isPink && molesOH > molesH && molesOH > 0.004) {
            const burette = workbenchItems.find(i => i.type === 'burette');
            if (!burette) return;

            const buretteFinal = 100 - (burette.props.fill ?? 100);
            const volumeUsed = buretteFinal - buretteInitialReading;

            setEndPointData({
                detected: true,
                buretteInitial: buretteInitialReading,
                buretteFinal: buretteFinal,
                volumeUsed: volumeUsed,
                flaskVolume: totalVolume,
                timestamp: new Date()
            });

            // Auto-complete step 9
            if (currentStepIndex === 8 && !completedStepIds.includes(9)) {
                setCompletedStepIds(prev => [...prev, 9]);
            }
        }
    }, [workbenchItems, endPointData, buretteInitialReading, currentStepIndex, completedStepIds]);

    // Track burette initial reading when filled
    useEffect(() => {
        const burette = workbenchItems.find(i => i.type === 'burette' && i.snappedToId?.startsWith('holder-'));
        if (burette && (burette.props.fill ?? 0) > 90 && buretteInitialReading === 0) {
            setBuretteInitialReading(100 - (burette.props.fill ?? 100));
        }
    }, [workbenchItems, buretteInitialReading]);

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


    const handleDrop = (e: React.DragEvent, rect: DOMRect) => {
        const dataStr = e.dataTransfer.getData("application/json");
        if (!dataStr) return;

        try {
            const data = JSON.parse(dataStr);
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
                    // timestamp: new Date()
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
                fill: 0,
                color: 'bg-transparent',
                label: '250ml',
                containerState: {
                    totalVolume: 0,
                    molesH: 0,
                    molesOH: 0,
                    hasIndicator: false
                }
            };
            case 'titration-flask': return { fill: 0, color: 'bg-transparent', label: 'Reaction' };
            case 'bottle-naoh': return { label: 'NaOH', color: 'bg-blue-500' };
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
            const sourceItem = workbenchItems.find(i => i.id === sourceId);
            const buretteTipY = sourceItem ? sourceItem.y + 250 : 0;
            
            const targetItem = workbenchItems.find(item => {
                if (item.id === sourceId) return false;
                if (!['flask', 'volumetric-flask', 'cylinder', 'titration-flask'].includes(item.type)) return false;
                const xDiff = Math.abs((item.x) - (sourceItem?.x || 0));
                const yDiff = item.y - buretteTipY;
                return xDiff < 80 && yDiff > -50 && yDiff < 150;
            });

            if (targetItem && (targetItem.props.fill || 0) > 95) {
                askAI("Watch out! The flask is about to overflow.", true);
            }
        }

        setWorkbenchItems(prevItems => {
            const source = prevItems.find(i => i.id === sourceId);
            if (!source) return prevItems;

            // Burette is ~250px tall, liquid dispenses from the bottom tip
            const buretteTipY = source.y + 250;

            const target = prevItems.find(item => {
                if (item.id === sourceId) return false;
                if (!['flask', 'volumetric-flask', 'cylinder', 'titration-flask'].includes(item.type)) return false;

                // Check if flask is below the burette tip
                const xDiff = Math.abs((item.x) - (source.x));
                const yDiff = item.y - buretteTipY;
                
                // Flask should be within 80px horizontally and 0-150px below tip
                return xDiff < 80 && yDiff > -50 && yDiff < 150;
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

    return (
        <main className="flex h-screen bg-[#1e1e1e] overflow-hidden text-[#d4d4d4] font-sans">
            <Sidebar currentStepIndex={currentStepIndex} guideSteps={GUIDE_STEPS} />
            <Workbench
                items={workbenchItems}
                onDrop={handleDrop}
                onPositionChange={handlePositionChange}
                onDelete={handleDelete}
                onDispense={handleDispense}
                onFlaskAdd={handleFlaskAdd}
                onClear={() => { setWorkbenchItems([]); setEndPointData(null); setBuretteInitialReading(0); setCompletedStepIds([]); setCurrentStepIndex(0); }}
                currentStepIndex={currentStepIndex}
                guideSteps={GUIDE_STEPS}
                completedStepIds={completedStepIds}
            />
            {/* Results Card */}
            <ResultsCard data={endPointData} />
            {/* AI Instructor Panel */}
            <AIInstructor
                messages={messages}
                onSendMessage={(msg: string) => askAI(msg, false)}
                isLoading={isLoading}
            />
        </main>
    );
}

