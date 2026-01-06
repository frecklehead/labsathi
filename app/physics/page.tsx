"use client";

import React, { useRef, useEffect } from "react";
import { useCircuitState } from "@/app/hooks/useCircuitState";
import { useCircuitSolver } from "@/app/hooks/useCircuitSolver";
import { checkCircuitRisks } from "@/app/utils/circuitValidation";
import { fixVoltmeterConnection } from "@/app/utils/aiCircuitFixer";
import { getAllTerminals, isCircuitProperlyWired, isParallelConnection, isSeriesConnection, isVoltmeterCorrectlyPlaced } from "@/app/utils/circuitHelpers";
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
import { ErrorFeedbackPanel } from "@/app/components/physics/ErrorFeedbackPanel";
import { PhysicsResultsCard } from "@/app/components/physics/PhysicsResultsCard";
import { Info, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export default function OhmsLawLab() {
    const workbenchRef = useRef<HTMLDivElement>(null);
    const [showResults, setShowResults] = React.useState(false);
    const [reportGenerated, setReportGenerated] = React.useState(false);
    const [showDashboard, setShowDashboard] = React.useState(true);

    const {
        workbenchItems,
        wires,
        connectingFrom,
        dataPoints,
        currentStepIndex,
        showGraph,
        circuitRisks,
        actionError,
        suggestedConnection,
        setWorkbenchItems,
        setWires,
        setConnectingFrom,
        setCurrentStepIndex,
        setShowGraph,
        setCircuitRisks,
        setActionError,
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

    const currentStep = GUIDE_STEPS[currentStepIndex];

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
        if (currentStep && currentStep.check(workbenchItems, wires)) {
            if (currentStepIndex < GUIDE_STEPS.length - 1) {
                const timer = setTimeout(() => setCurrentStepIndex(prev => prev + 1), 1200);
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
    const validationError = currentStep?.errorCheck?.(workbenchItems, wires) || null;

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

                {/* Progress Indicators */}
                <div className="absolute top-20 right-8 z-30 flex flex-col gap-3">
                    {currentStep?.id === 1 && (
                        <button
                            onClick={() => setCurrentStepIndex(prev => prev + 1)}
                            className="flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-[24px] font-black text-xl transition-all shadow-[0_10px_30px_rgba(5,150,105,0.3)] hover:shadow-[0_15px_40px_rgba(5,150,105,0.4)] active:scale-95 animate-in fade-in slide-in-from-right-8 duration-700 group"
                        >
                            <span>Start Building Circuit</span>
                            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                        </button>
                    )}

                    {dataPoints.length > 5 && !showResults && (
                        <button
                            onClick={() => { setShowResults(true); setReportGenerated(true); }}
                            className="flex items-center gap-3 px-6 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold transition-all shadow-xl hover:shadow-purple-500/20 active:scale-95 animate-bounce-subtle border border-white/10"
                        >
                            <Info className="w-5 h-5 text-purple-400" />
                            <span>{reportGenerated ? "View Lab Report" : "Prepare Lab Report"}</span>
                        </button>
                    )}

                    {currentStepIndex === 6 && isVoltmeterCorrectlyPlaced(workbenchItems, wires) && (
                        <div className="bg-emerald-500/10 border-2 border-emerald-500 rounded-[28px] p-6 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-700 shadow-lg backdrop-blur-md">
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-0.5">Verification Success</div>
                                <div className="text-sm font-bold text-slate-900">Conversion Calibrated Correctly!</div>
                            </div>
                        </div>
                    )}

                    {reportGenerated && (
                        <button
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl font-black transition-all shadow-[0_10px_25px_rgba(5,150,105,0.2)] active:scale-95 animate-in slide-in-from-right-8 duration-700 border border-white/10"
                        >
                            <Sparkles className="w-5 h-5 text-emerald-200" />
                            <span>Proceed to Practice Mode</span>
                        </button>
                    )}
                </div>

                {/* Lab Dashboard Drawer */}
                {isProperlyWired && !showResults && (
                    <div className={`absolute top-20 left-0 bottom-0 z-40 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${showDashboard ? 'translate-x-0' : '-translate-x-[calc(100%-40px)]'}`}>
                        <div className="h-full w-[380px] bg-white/80 backdrop-blur-3xl border-r border-slate-200 shadow-[20px_0_50px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-6 relative">
                            {/* Toggle Button */}
                            <button 
                                onClick={() => setShowDashboard(!showDashboard)}
                                className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-16 bg-white border border-slate-200 rounded-r-xl shadow-md flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors z-50 group hover:scale-105"
                            >
                                {showDashboard ? <div className="group-hover:-translate-x-0.5 transition-transform">←</div> : <div className="group-hover:translate-x-0.5 transition-transform">→</div>}
                            </button>

                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                                    <div className="w-5 h-5 text-white">📊</div>
                                </div>
                                <h2 className="text-lg font-black tracking-tight text-slate-900">Lab Data Panel</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
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
                        </div>
                    </div>
                )}

                {/* Guidance Toast */}
                {suggestedConnection && !reportGenerated && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-top-4 duration-500">
                        <div className="px-6 py-3 bg-slate-900/90 backdrop-blur-xl border-2 border-yellow-400/50 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5),0_0_10px_rgba(250,204,21,0.2)] flex items-center gap-4">
                            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                                <Info className="w-4 h-4 text-slate-900" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider font-black text-yellow-500/80 leading-tight">Next Action Required</span>
                                <span className="text-sm font-black text-white">{suggestedConnection.label}</span>
                            </div>
                        </div>
                    </div>
                )}


                {!reportGenerated && (
                    <ErrorFeedbackPanel 
                        currentStep={currentStepIndex}
                        error={actionError || validationError}
                        hint={currentStep?.hint || null}
                    />
                )}

                {!reportGenerated && (
                    <GuideOverlay
                        currentStep={currentStep}
                        currentIndex={currentStepIndex}
                        totalSteps={GUIDE_STEPS.length}
                    />
                )}

                <Workbench
                    ref={workbenchRef}
                    items={workbenchItems}
                    wires={wires}
                    terminals={allTerminals}
                    connectingFrom={connectingFrom}
                    suggestedConnection={suggestedConnection}
                    onDrop={handleDrop}
                    onPositionChange={updateItemPosition}
                    onDelete={deleteItem}
                    onPropertyChange={updateItemProperty}
                    onTerminalClick={handleTerminalClick}
                    onDeleteWire={deleteWire}
                />

                {/* Results Card Modal */}
                {showResults && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowResults(false)} />
                        <div className="relative z-10 animate-in zoom-in-95 duration-300">
                            <PhysicsResultsCard
                                galvanometerResistance={G_RES}
                                fullScaleCurrent={IG_MAX * 1000}
                                seriesResistance={R_SERIES}
                                dataPoints={dataPoints}
                                onClose={() => setShowResults(false)}
                            />
                        </div>
                    </div>
                )}

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

            <style jsx global>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
            `}</style>
        </main>
    );
}