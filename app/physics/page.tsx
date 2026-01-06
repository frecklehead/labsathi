"use client";

import React, { useRef, useEffect } from "react";
import { useCircuitState } from "@/app/hooks/useCircuitState";
import { useCircuitSolver } from "@/app/hooks/useCircuitSolver";
import { checkCircuitRisks } from "@/app/utils/circuitValidation";
import { fixVoltmeterConnection } from "@/app/utils/aiCircuitFixer";
import { getAllTerminals, isCircuitProperlyWired } from "@/app/utils/circuitHelpers";
import { GUIDE_STEPS } from "@/app/constants/experimentGuide";

// UI Components
import Sidebar from "@/app/components/sidebar/Sidebar";
import Toolbar from "@/app/components/toolbar/Toolbar";
import RiskAlert from "@/app/components/dashboard/RiskAlert";
import CircuitAnalytics from "@/app/components/dashboard/CircuitAnalytics";
import ObservationTable from "@/app/components/dashboard/ObservationTable";
import GuideOverlay from "@/app/components/guide/GuideOverlay";
import Workbench from "@/app/components/circuit/Workbench";
import { VIGraph } from "@/app/components/physics/VIGraph";
import { PhysicsAssistant } from "@/app/components/physics/PhysicsAssistant";
import { main } from "framer-motion/client";

export default function OhmsLawLab() {
    const workbenchRef = useRef<HTMLDivElement>(null);

    const {
        workbenchItems,
        wires,
        connectingFrom,
        dataPoints,
        currentStepIndex,
        showGraph,
        circuitRisks,
        setWorkbenchItems,
        setWires,
        setConnectingFrom,
        setCurrentStepIndex,
        setShowGraph,
        setCircuitRisks,
        addItem,
        updateItemPosition,
        deleteItem,
        updateItemProperty,
        handleTerminalClick,
        clearWires,
        deleteWire,
        resetWorkbench,
        addDataPoint,
        clearDataPoints,
    } = useCircuitState();

    // Circuit solver hook
    useCircuitSolver(workbenchItems, wires, setWorkbenchItems);

    // Get all terminals for rendering
    const allTerminals = getAllTerminals(workbenchItems);

    // Derived values
    const batteryItem = workbenchItems.find(item => item.type === 'battery');
    const galva = workbenchItems.find(item => item.type === 'galvanometer');
    const resBox = workbenchItems.find(item => item.type === 'resistance_box');

    const vSource = batteryItem?.props.voltage || 0;
    const G_RES = galva?.props.internalResistance || 100;
    const IG_MAX = (galva?.props.fullScaleCurrent || 1) / 1000;
    const R_SERIES = resBox?.props.resistance || 0;
    const convertedVoltmeterRange = IG_MAX * (G_RES + R_SERIES);

    // Handle drop on workbench
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
                addItem(data.type, x, y);
            }
        } catch (err) {
            console.error("Drop Error", err);
        }
    };

    // AI Fix handler
    const handleFixWithAI = () => {
        const voltmeter = workbenchItems.find(i => i.type === "voltmeter");
        if (!voltmeter) return;

        const fixedWires = fixVoltmeterConnection(voltmeter, workbenchItems, wires);
        setWires(fixedWires);
    };

    // Check circuit risks
    useEffect(() => {
        const risks = checkCircuitRisks(workbenchItems, wires);
        setCircuitRisks(risks);
    }, [workbenchItems, wires, setCircuitRisks]);

    // Track step progress
    useEffect(() => {
        const currentStep = GUIDE_STEPS[currentStepIndex];
        if (currentStep && currentStep.check(workbenchItems, wires)) {
            if (currentStepIndex < GUIDE_STEPS.length - 1) {
                const timer = setTimeout(() => setCurrentStepIndex(prev => prev + 1), 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [workbenchItems, wires, currentStepIndex, setCurrentStepIndex]);

    // Record data points
    useEffect(() => {
        if (!isCircuitProperlyWired(workbenchItems, wires)) return;

        const instrument = workbenchItems.find(
            item => item.type === 'galvanometer' || item.type === 'ammeter'
        );
        if (!instrument) return;

        const currentReading = instrument.props.current || 0;
        const currentV = resBox
            ? (currentReading / 1000) * (G_RES + R_SERIES)
            : vSource;

        if (Math.abs(currentReading) > 0.001) {
            addDataPoint({
                voltage: currentV,
                current: currentReading,
                resistance: R_SERIES,
                timestamp: Date.now()
            });
        }
    }, [workbenchItems, wires, resBox, G_RES, R_SERIES, vSource, addDataPoint]);

    const isProperlyWired = isCircuitProperlyWired(workbenchItems, wires);

    return (
        <main className="flex h-screen bg-white overflow-hidden text-slate-900">
            <Sidebar />

            <div className="flex-1 flex flex-col relative bg-slate-50">
                <Toolbar
                    connectingFrom={connectingFrom}
                    onCancelWire={() => setConnectingFrom(null)}
                    onClearWires={clearWires}
                    onReset={resetWorkbench}
                />

                <RiskAlert risks={circuitRisks} onFix={handleFixWithAI} />

                {isProperlyWired && (
                    <div className="absolute top-16 left-6 z-30 w-[340px]
  flex flex-col gap-4
  h-[calc(100vh-120px)]   // 🔑 FIXED HEIGHT
  overflow-hidden
  pointer-events-auto
  transition-all duration-500
  animate-in fade-in slide-in-from-left-4
">

                        <CircuitAnalytics
                            vSource={vSource}
                            current={galva?.props.current || 0}
                            gRes={G_RES}
                            rSeries={R_SERIES}
                            convertedRange={convertedVoltmeterRange}
                            igMax={IG_MAX}
                            onShowGraph={() => setShowGraph(true)}
                        />
                        <ObservationTable
                            dataPoints={dataPoints}
                            onClear={clearDataPoints}
                        />
                    </div>
                )}

                <GuideOverlay
                    currentStep={GUIDE_STEPS[currentStepIndex]}
                    currentIndex={currentStepIndex}
                    totalSteps={GUIDE_STEPS.length}
                />

                <Workbench
                    ref={workbenchRef}
                    items={workbenchItems}
                    wires={wires}
                    terminals={allTerminals}
                    connectingFrom={connectingFrom}
                    onDrop={handleDrop}
                    onPositionChange={updateItemPosition}
                    onDelete={deleteItem}
                    onPropertyChange={updateItemProperty}
                    onTerminalClick={handleTerminalClick}
                    onDeleteWire={deleteWire}
                />

                {showGraph && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowGraph(false)}
                        />
                        <div className="relative z-10 w-full max-w-2xl transform transition-all animate-in zoom-in-95 duration-300">
                            <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
                                <VIGraph data={dataPoints} onClear={clearDataPoints} />
                                <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end">
                                    <button
                                        onClick={() => setShowGraph(false)}
                                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                                    >
                                        Close Analysis
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <PhysicsAssistant
                currentStep={currentStepIndex}
                workbenchItems={workbenchItems}
                wires={wires}
                circuitRisks={circuitRisks}
                experimentData={{
                    vSource,
                    gRes: G_RES,
                    rSeries: R_SERIES,
                    current: galva?.props.current || 0,
                    convertedRange: convertedVoltmeterRange
                }}
            />

        </main>
    );
}