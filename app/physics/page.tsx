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

    const getDefaultProps = (type: string) => {
        switch (type) {
            case 'battery': return { voltage: 5 };
            case 'resistor': return { resistance: 10 };
            case 'ammeter': return { current: 0, internalResistance: 0.01 };
            case 'voltmeter': return { voltage: 0, internalResistance: 1000000 };
            case 'galvanometer': return { current: 0, internalResistance: 100, fullScaleCurrent: 1 };
            case 'rheostat': return { resistance: 50, maxResistance: 100 };
            case 'resistance_box': return { resistance: 1000 };
            default: return {};
        }
    };

    const handlePositionChange = (id: string, x: number, y: number) => {
        setWorkbenchItems(items => items.map(item =>
            item.id === id ? { ...item, x, y } : item
        ));
    };

    const handleDelete = (id: string) => {
        setWorkbenchItems(items => items.filter(item => item.id !== id));
        // Also remove any wires connected to this item
        setWires(wires => wires.filter(wire =>
            wire.from.itemId !== id && wire.to.itemId !== id
        ));
    };

    const handlePropertyChange = (id: string, property: string, value: any) => {
        setWorkbenchItems(items => items.map(item =>
            item.id === id ? { ...item, props: { ...item.props, [property]: value } } : item
        ));
    };

    const handleTerminalClick = (itemId: string, terminalName: string) => {
        if (!connectingFrom) {
            // Start connecting
            setConnectingFrom({ itemId, terminal: terminalName });
        } else {
            // Complete connection
            if (connectingFrom.itemId !== itemId) {
                const newWire: Wire = {
                    id: `wire-${Date.now()}`,
                    from: connectingFrom,
                    to: { itemId, terminal: terminalName }
                };
                setWires(prev => [...prev, newWire]);
            }
            setConnectingFrom(null);
        }
    };
    const handleWireClick = (wireId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWires(wires => wires.filter(wire => wire.id !== wireId));
};

    // Check if circuit is complete and properly wired
    const isCircuitProperlyWired = (): boolean => {
        const battery = workbenchItems.find(item => item.type === 'battery');
        const galvanometer = workbenchItems.find(item => item.type === 'galvanometer');
        const ammeter = workbenchItems.find(item => item.type === 'ammeter');

        // At least a power source and an instrument to measure something
        if (!battery || (!galvanometer && !ammeter)) return false;

        // Ensure we have some connections
        return wires.length >= 2;
    };

    // --- CIRCUIT SOLVER (Nodal Analysis) ---
    const solveCircuit = () => {
        if (workbenchItems.length === 0) return;

        // 1. Identify Nodes
        // Each terminal is a potential node. Wires unify terminals into the same node.
        const terminalToNodeMap = new Map<string, number>();
        let nodeCount = 0;

        allTerminals.forEach(t => {
            if (!terminalToNodeMap.has(t.id)) {
                // Find all connected terminals via wires (transitive closure)
                const cluster = new Set<string>([t.id]);
                const stack = [t.id];
                while (stack.length > 0) {
                    const currentId = stack.pop()!;
                    wires.forEach(w => {
                        const fromId = `${w.from.itemId}-${w.from.terminal}`;
                        const toId = `${w.to.itemId}-${w.to.terminal}`;
                        if (fromId === currentId && !cluster.has(toId)) {
                            cluster.add(toId);
                            stack.push(toId);
                        } else if (toId === currentId && !cluster.has(fromId)) {
                            cluster.add(fromId);
                            stack.push(fromId);
                        }
                    });
                }
                cluster.forEach(id => terminalToNodeMap.set(id, nodeCount));
                nodeCount++;
            }
        });

        if (nodeCount < 2) return;

        // 2. Build MNA Matrices
        // Modified Nodal Analysis: [G B; B.T D][v; j] = [i; e]
        // G: Conductance matrix (nodeCount x nodeCount)
        // B: Voltage source connections (nodeCount x sourceCount)
        // D: Voltage source interactions (sourceCount x sourceCount, usually 0)
        // v: Node voltages
        // j: Current through voltage sources
        // i: Current sources (usually 0 here)
        // e: Voltages of independent sources

        const voltageSources = workbenchItems.filter(item => item.type === 'battery');
        const m = voltageSources.length;
        const matrixSize = nodeCount + m;

        const matrix = Array.from({ length: matrixSize }, () => new Float64Array(matrixSize).fill(0));
        const bVector = new Float64Array(matrixSize).fill(0);

        // Add Conductances
        workbenchItems.forEach(item => {
            const terminals = getTerminals(item);
            const nodes = terminals.map((t) => terminalToNodeMap.get(t.id)!);

            if (item.type === "rheostat") {
                const nA = terminalToNodeMap.get(`${item.id}-A`);
                const nB = terminalToNodeMap.get(`${item.id}-B`);
                const nC = terminalToNodeMap.get(`${item.id}-C`);

                const rTotal = item.props.maxResistance || 100;
                const rVal = item.props.resistance || 0.1;

                // Resistance between A and C is rVal
                if (nA !== undefined && nC !== undefined) {
                    const g = 1 / Math.max(rVal, 0.001);
                    matrix[nA][nA] += g;
                    matrix[nC][nC] += g;
                    matrix[nA][nC] -= g;
                    matrix[nC][nA] -= g;
                }
                // Resistance between C and B is rTotal - rVal
                if (nC !== undefined && nB !== undefined) {
                    const g = 1 / Math.max(rTotal - rVal, 0.001);
                    matrix[nC][nC] += g;
                    matrix[nB][nB] += g;
                    matrix[nC][nB] -= g;
                    matrix[nB][nC] -= g;
                }
            } else if (nodes.length >= 2) {
                let r = 0;
                if (item.type === "resistor") r = item.props.resistance || 0.1;
                else if (item.type === "resistance_box")
                    r = item.props.resistance || 0.1;
                else if (item.type === "galvanometer")
                    r = item.props.internalResistance || 100;
                else if (item.type === "ammeter")
                    r = item.props.internalResistance || 0.01;
                else if (item.type === "voltmeter")
                    r = item.props.internalResistance || 1000000;

                if (r > 0) {
                    const n1 = nodes[0];
                    const n2 = nodes[1];
                    const g = 1 / r;
                    matrix[n1][n1] += g;
                    matrix[n2][n2] += g;
                    matrix[n1][n2] -= g;
                    matrix[n2][n1] -= g;
                }
            }
        });

        // Add GMIN (tiny conductance to ground) for matrix stability
        // This prevents singular matrices if a component is disconnected
        for (let i = 0; i < nodeCount; i++) {
            matrix[i][i] += 1e-12;
        }

        // Add Voltage Sources
        voltageSources.forEach((source, idx) => {
            const terminals = getTerminals(source);
            const nPos = terminalToNodeMap.get(`${source.id}-positive`)!;
            const nNeg = terminalToNodeMap.get(`${source.id}-negative`)!;
            const v = source.props.voltage || 0;

            const row = nodeCount + idx;
            matrix[row][nPos] = 1;
            matrix[row][nNeg] = -1;
            matrix[nPos][row] = 1;
            matrix[nNeg][row] = -1;
            bVector[row] = v;
        });

        // Set Reference Node (Node 0 is GND)
        // Replace node 0 equation with v0 = 0
        matrix[0].fill(0);
        matrix[0][0] = 1;
        bVector[0] = 0;
        // Also clear column 0 from other equations? No, MNA handles it if node 0 is just one node.
        // Actually, better: just eliminate node 0.

        // Gaussian Elimination to solve AX = B
        const solve = (A: number[][], B: number[]) => {
            const n = B.length;
            for (let i = 0; i < n; i++) {
                let max = i;
                for (let j = i + 1; j < n; j++) {
                    if (Math.abs(A[j][i]) > Math.abs(A[max][i])) max = j;
                }
                [A[i], A[max]] = [A[max], A[i]];
                [B[i], B[max]] = [B[max], B[i]];

                if (Math.abs(A[i][i]) < 1e-12) continue;

                for (let j = i + 1; j < n; j++) {
                    const factor = A[j][i] / A[i][i];
                    B[j] -= factor * B[i];
                    for (let k = i; k < n; k++) A[j][k] -= factor * A[i][k];
                }
            }

            const x = new Array(n).fill(0);
            for (let i = n - 1; i >= 0; i--) {
                let sum = 0;
                for (let j = i + 1; j < n; j++) sum += A[i][j] * x[j];
                x[i] = (B[i] - sum) / A[i][i];
            }
            return x;
        };

        try {
            // Conveting Float64 to number[][] for the solver
            const sol = solve(matrix.map(row => Array.from(row)), Array.from(bVector));

            // 3. Extract results and update props
            const newWorkbenchItems = workbenchItems.map(item => {
                const terminals = getTerminals(item);
                const nodes = terminals.map(t => terminalToNodeMap.get(t.id)!);
                const v1 = sol[nodes[0]] || 0;
                const v2 = sol[nodes[1]] || 0;
                const voltage = Math.abs(v1 - v2);

                if (item.type === 'galvanometer') {
                    const current = (v1 - v2) / (item.props.internalResistance || 100);
                    return { ...item, props: { ...item.props, current: current * 1000 } }; // to mA
                }
                if (item.type === 'ammeter') {
                    const current = (v1 - v2) / (item.props.internalResistance || 0.01);
                    return { ...item, props: { ...item.props, current: Math.abs(current) } };
                }
                if (item.type === 'voltmeter') {
                    return { ...item, props: { ...item.props, voltage } };
                }
                return item;
            });

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
                    <div className="absolute top-16 left-6 z-30 w-[340px] pointer-events-auto transition-all duration-500 animate-in fade-in slide-in-from-left-4 flex flex-col gap-4 max-h-[calc(100vh-120px)] overflow-hidden">
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
                </div>
                <div
                    ref={workbenchRef}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex-1 relative bg-[#f8fafc] overflow-hidden"
                >
                    {/* Engineering Grid - Major Lines */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                    {/* Engineering Grid - Minor Lines */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#e2e8f040_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f040_1px,transparent_1px)] bg-[size:8px_8px]"></div>


                    {/* Render Wires with Curves and Enhanced Visuals */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                        <defs>
                            {/* Wire shadow */}
                            <filter id="wireShadow">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                                <feOffset dx="2" dy="2" result="offsetblur" />
                                <feComponentTransfer>
                                    <feFuncA type="linear" slope="0.3" />
                                </feComponentTransfer>
                                <feMerge>
                                    <feMergeNode />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>

                            {/* Wire gradient */}
                            <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#dc2626" />
                                <stop offset="50%" stopColor="#ef4444" />
                                <stop offset="100%" stopColor="#dc2626" />
                            </linearGradient>
                        </defs>
                        {wires.map(wire => {
    const fromTerminal = allTerminals.find(t =>
        t.itemId === wire.from.itemId && t.name === wire.from.terminal
    );
    const toTerminal = allTerminals.find(t =>
        t.itemId === wire.to.itemId && t.name === wire.to.terminal
    );

    if (!fromTerminal || !toTerminal) return null;

    // Calculate control points for smooth natural "hanging" curve
    const dx = toTerminal.x - fromTerminal.x;
    const dy = toTerminal.y - fromTerminal.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Hanging factor: Wires hang more if they are longer but closer together horizontally
    const hang = Math.max(30, distance * 0.2);

    // Control points for Cubic Bezier to get a better "U" shape
    const cp1x = fromTerminal.x + dx * 0.2;
    const cp1y = fromTerminal.y + hang;
    const cp2x = toTerminal.x - dx * 0.2;
    const cp2y = toTerminal.y + hang;

    // Calculate actual midpoint on the bezier curve (t=0.5)
    const t = 0.5;
    const midX = Math.pow(1-t, 3) * fromTerminal.x + 
                 3 * Math.pow(1-t, 2) * t * cp1x + 
                 3 * (1-t) * Math.pow(t, 2) * cp2x + 
                 Math.pow(t, 3) * toTerminal.x;
    const midY = Math.pow(1-t, 3) * fromTerminal.y + 
                 3 * Math.pow(1-t, 2) * t * cp1y + 
                 3 * (1-t) * Math.pow(t, 2) * cp2y + 
                 Math.pow(t, 3) * toTerminal.y;

    return (
        <g key={wire.id} className="group/wire">
            {/* Invisible wide hover area along the wire */}
            <path
                d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                stroke="transparent"
                strokeWidth="20"
                fill="none"
                className="pointer-events-auto"
            />
            
            {/* Broad, soft shadow for depth */}
            <path
                d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-300 pointer-events-none"
                style={{ transform: 'translateY(3px)' }}
            />
            {/* Main Insulation (Red) */}
            <path
                d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                stroke="url(#wireGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-300 group-hover/wire:stroke-red-400 group-hover/wire:drop-shadow-[0_0_8px_rgba(248,113,113,0.8)] pointer-events-none"
            />
            {/* Specular Highlight for 3D effect */}
            <path
                d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-300 pointer-events-none"
                style={{ transform: 'translateY(-0.5px) translateX(-0.5px)' }}
            />
            {/* Wire Connectors (Ends) */}
            <circle cx={fromTerminal.x} cy={fromTerminal.y} r="3" fill="#4a5568" className="pointer-events-none" />
            <circle cx={toTerminal.x} cy={toTerminal.y} r="3" fill="#4a5568" className="pointer-events-none" />
            
            {/* Delete button - shows on wire hover, only clickable on button */}
            <g 
                className="opacity-0 group-hover/wire:opacity-100 transition-opacity cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    handleWireClick(wire.id, e);
                }}
                style={{ pointerEvents: 'auto' }}
            >
                {/* Background circle */}
                <circle 
                    cx={midX} 
                    cy={midY} 
                    r="14" 
                    fill="rgb(239, 68, 68)" 
                    className="drop-shadow-lg"
                />
                {/* X icon */}
                <path 
                    d={`M ${midX - 5} ${midY - 5} L ${midX + 5} ${midY + 5} M ${midX + 5} ${midY - 5} L ${midX - 5} ${midY + 5}`}
                    stroke="white" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    className="pointer-events-none"
                />
            </g>
        </g>
    );
})}
                    </svg>


                    {/* Render Components */}
                    {workbenchItems.map(renderItem)}

                    {/* Render Terminals */}
                    {allTerminals.map(terminal => {
                        const isConnecting = connectingFrom?.itemId === terminal.itemId &&
                            connectingFrom?.terminal === terminal.name;
                        const isConnected = wires.some(w =>
                            (w.from.itemId === terminal.itemId && w.from.terminal === terminal.name) ||
                            (w.to.itemId === terminal.itemId && w.to.terminal === terminal.name)
                        );

                        return (
                            <div
                                key={terminal.id}
                                onClick={() =>
                                    handleTerminalClick(
                                        terminal.itemId,
                                        terminal.name
                                    )
                                }
                                className={`absolute w-7 h-7 flex items-center justify-center cursor-pointer transition-all z-[60] group/terminal ${isConnecting ? "scale-125" : ""
                                    }`}
                                style={{
                                    left: terminal.x - 14,
                                    top: terminal.y - 14,
                                }}
                                title={`${terminal.itemId.split("-")[0]} - ${terminal.name
                                    }`}
                            >
                                {/* Interaction Zone - Transparent until hovered, aligning with device terminals */}
                                <div className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${isConnecting
                                    ? 'bg-green-500/30 ring-4 ring-green-500/20 scale-110'
                                    : isConnected
                                        ? 'bg-transparent'
                                        : 'bg-transparent'
                                    }`}>
                                    {/* Subtle highlight ring on hover to help user find the interaction point */}
                                    <div className={`w-full h-full rounded-full border border-yellow-400/0 group-hover/terminal:border-yellow-400/50 group-hover/terminal:scale-110 transition-all duration-300`}></div>

                                    {/* Active/Connecting indicator */}
                                    {isConnecting && (
                                        <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-20"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {workbenchItems.length === 0 && (
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

                    {/* V-I Graph Popup Modal */}
                    {showGraph && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                                onClick={() => setShowGraph(false)}
                            />
                            <div className="relative z-10 w-full max-w-2xl transform transition-all animate-in zoom-in-95 duration-300">
                                <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
                                    <VIGraph
                                        data={dataPoints}
                                        onClear={() => setDataPoints([])}
                                    />
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
            </div>
            <PhysicsAssistant />
        </main>
    );
}