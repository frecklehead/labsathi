"use client";

import React, { useState, useRef } from "react";
import { Battery } from "../components/physics/Battery";
import { Resistor } from "../components/physics/Resistor";
import { Ammeter } from "../components/physics/Ammeter";
import { Voltmeter } from "../components/physics/Voltmeter";
import { Galvanometer } from "../components/physics/Galvanometer";
import { Rheostat } from "../components/physics/Rheostat";
import { HighResistanceBox } from "../components/physics/HighResistanceBox";
import { Draggable } from "../Draggable";
import { DraggableLabObject } from "../snapped";

interface PhysicsItem {
    id: string;
    type: string;
    x: number;
    y: number;
    props: { [key: string]: any };
}

interface Wire {
    id: string;
    from: { itemId: string; terminal: string };
    to: { itemId: string; terminal: string };
}

interface Terminal {
    id: string;
    itemId: string;
    name: string;
    x: number;
    y: number;
}

interface DataPoint {
    voltage: number;
    current: number;
    resistance: number;
    timestamp: number;
}

export default function OhmsLawLab() {
    const [workbenchItems, setWorkbenchItems] = useState<PhysicsItem[]>([]);
    const [wires, setWires] = useState<Wire[]>([]);
    const [connectingFrom, setConnectingFrom] = useState<{ itemId: string; terminal: string } | null>(null);
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
    const workbenchRef = useRef<HTMLDivElement>(null);

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
                const newItem: PhysicsItem = {
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

    // Get terminals for an item based on its type and position
    const getTerminals = (item: PhysicsItem): Terminal[] => {
        const baseOffsets: { [key: string]: { name: string; dx: number; dy: number }[] } = {
            battery: [
                { name: 'positive', dx: 64, dy: 7 },    // Center of 128px (w-32) box
                { name: 'negative', dx: 64, dy: 93 }    // Center of 128px (w-32) box
            ],
            resistor: [
                { name: 'left', dx: 0, dy: 25 },        // Center vertical of h-50 (12.5rem = 50px?) No h-50 is 200px.
                { name: 'right', dx: 140, dy: 25 }      // Wait style={{height: '50px'}} is literal. dy: 25 is center.
            ],
            ammeter: [
                { name: 'in', dx: 8, dy: 72 },          // w-32=128, left:-2, w-5=20. -2+10=8. top:1/2=72.
                { name: 'out', dx: 120, dy: 72 }        // 128+2-10=120.
            ],
            voltmeter: [
                { name: 'positive', dx: 120, dy: 72 },
                { name: 'negative', dx: 8, dy: 72 }
            ],
            galvanometer: [
                { name: "positive", dx: 8, dy: 96 },
                { name: "negative", dx: 168, dy: 96 },
            ],
            rheostat: [
                { name: "A", dx: 67, dy: 169 },
                { name: "B", dx: 453, dy: 169 },
                { name: "C", dx: 453, dy: 86 },
            ],
            resistance_box: [
                { name: "left", dx: 14, dy: 96 },
                { name: "right", dx: 346, dy: 96 },
            ],
        };

        const offsets = baseOffsets[item.type] || [];
        return offsets.map(offset => ({
            id: `${item.id}-${offset.name}`,
            itemId: item.id,
            name: offset.name,
            x: item.x + offset.dx,
            y: item.y + offset.dy
        }));
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

    // Check if circuit is complete and properly wired for the specific experiment
    const isCircuitProperlyWired = (): boolean => {
        const battery = workbenchItems.find(item => item.type === 'battery');
        const galvanometer = workbenchItems.find(item => item.type === 'galvanometer');
        const resistanceBox = workbenchItems.find(item => item.type === 'resistance_box');

        // Basic requirement for the conversion experiment
        if (!battery || !galvanometer || !resistanceBox) return false;

        // Ensure we have a series connection (at least 3 wires for a loop)
        return wires.length >= 3;
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

            // check if anything actually changed to avoid infinite loop
            const hasChanged = JSON.stringify(newWorkbenchItems) !== JSON.stringify(workbenchItems);
            if (hasChanged) {
                setWorkbenchItems(newWorkbenchItems);
            }
        } catch (e) {
            console.error("Solver Error", e);
        }
    };

    // Update simulation on circuit changes
    React.useEffect(() => {
        solveCircuit();
    }, [wires, workbenchItems]); // Re-solve whenever a wire or any component property changes

    // We still want data points but we'll get them from the solved state
    const batteryItem = workbenchItems.find(item => item.type === 'battery');
    const galva = workbenchItems.find(item => item.type === 'galvanometer');
    const vSource = batteryItem?.props.voltage || 0;

    // For the info panel:
    const G_RES = galva?.props.internalResistance || 100;
    const IG_MAX = (galva?.props.fullScaleCurrent || 1) / 1000; // to A
    const resBox = workbenchItems.find(item => item.type === 'resistance_box');
    const R_SERIES = resBox?.props.resistance || 0;
    const convertedVoltmeterRange = IG_MAX * (G_RES + R_SERIES);


    const renderItem = (item: PhysicsItem) => {
        let Component;
        switch (item.type) {
            case 'battery':
                Component = <Battery
                    voltage={item.props.voltage}
                    onVoltageChange={(v) => handlePropertyChange(item.id, 'voltage', v)}
                />;
                break;
            case 'resistor':
                Component = <Resistor
                    resistance={item.props.resistance}
                    onResistanceChange={(r) => handlePropertyChange(item.id, 'resistance', r)}
                />;
                break;
            case 'ammeter':
                Component = <Ammeter current={item.props.current || 0} />;
                break;
            case "galvanometer":
                Component = (
                    <Galvanometer
                        current={item.props.current || 0}
                        internalResistance={item.props.internalResistance || 100}
                        fullScaleCurrent={item.props.fullScaleCurrent || 1}
                        onPropertyChange={(p: string, v: number) =>
                            handlePropertyChange(item.id, p, v)
                        }
                    />
                );
                break;
            case "rheostat":
                Component = (
                    <Rheostat
                        resistance={item.props.resistance || 50}
                        maxResistance={item.props.maxResistance || 100}
                        onResistanceChange={(r: number) =>
                            handlePropertyChange(item.id, "resistance", r)
                        }
                    />
                );
                break;
            case "voltmeter":
                Component = (
                    <Voltmeter
                        voltage={item.props.voltage || 0}
                        resistance={item.props.internalResistance || 1000000}
                        onPropertyChange={(p: string, v: number) =>
                            handlePropertyChange(item.id, p, v)
                        }
                    />
                );
                break;
            case 'resistance_box':
                Component = <HighResistanceBox
                    resistance={item.props.resistance || 0}
                    onResistanceChange={(r) => handlePropertyChange(item.id, 'resistance', r)}
                />;
                break;
            default:
                Component = <div className="p-4 bg-red-500">?</div>;
        }

        return (
            <DraggableLabObject
                key={item.id}
                id={item.id}
                type={item.type}
                initialX={item.x}
                initialY={item.y}
                snapTargets={[]}
                onPositionChange={(id, x, y) => handlePositionChange(id, x, y)}
                onDelete={handleDelete}
                onHover={() => { }}
            >
                {Component}
            </DraggableLabObject>
        );
    };

    // Get all terminals for rendering
    const allTerminals: Terminal[] = workbenchItems.flatMap(item => getTerminals(item));

    return (
        <main className="flex h-screen bg-gray-900 overflow-hidden text-white">
            {/* Sidebar */}
            <aside className="w-60 bg-slate-900 border-r border-slate-700 flex flex-col z-20 shadow-2xl">
                <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                            <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">LabSathi</h1>
                            <p className="text-xs text-slate-500 font-medium">Physics Lab</p>
                        </div>
                    </div>
                    <div className="mt-4 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <p className="text-[10px] text-slate-400 font-medium">Conversion: V = Ig(G + R)</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="mb-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Components</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <SidebarItem type="battery" label="Battery">
                                <div className="scale-50 origin-center">
                                    <Battery voltage={5} />
                                </div>
                            </SidebarItem>

                            <SidebarItem type="resistor" label="Resistor">
                                <div className="scale-50 origin-center">
                                    <Resistor resistance={10} />
                                </div>
                            </SidebarItem>

                            <SidebarItem type="ammeter" label="Ammeter">
                                <div className="scale-40 origin-center">
                                    <Ammeter current={0} />
                                </div>
                            </SidebarItem>

                            <SidebarItem type="voltmeter" label="Voltmeter">
                                <div className="scale-40 origin-center">
                                    <Voltmeter voltage={0} />
                                </div>
                            </SidebarItem>

                            <SidebarItem type="galvanometer" label="Galvanometer">
                                <div className="scale-40 origin-center">
                                    <Galvanometer current={0} />
                                </div>
                            </SidebarItem>

                            <SidebarItem type="rheostat" label="Rheostat">
                                <div className="scale-40 origin-center">
                                    <Rheostat resistance={50} maxResistance={100} />
                                </div>
                            </SidebarItem>

                            <SidebarItem type="resistance_box" label="Resist. Box">
                                <div className="scale-40 origin-center">
                                    <HighResistanceBox resistance={1000} />
                                </div>
                            </SidebarItem>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
                {/* Top Toolbar */}
                <div className="h-10 bg-[#2d2d2d] border-b border-[#3e3e3e] flex items-center justify-between px-4">
                    <div className="flex items-center gap-4 text-[#cccccc] text-xs">
                        <span className="text-yellow-400 font-mono">Conversion of Galvanometer to Voltmeter</span>
                        {connectingFrom && (
                            <span className="text-green-400 animate-pulse">Connecting wire... Click a terminal</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {connectingFrom && (
                            <button
                                onClick={() => setConnectingFrom(null)}
                                className="bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 px-3 py-1 rounded text-xs border border-yellow-900/50 transition-colors"
                            >
                                Cancel Wire
                            </button>
                        )}
                        <button
                            onClick={() => setWires([])}
                            className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 px-3 py-1 rounded text-xs border border-orange-900/50 transition-colors"
                        >
                            Clear Wires
                        </button>
                        <button
                            onClick={() => { setWorkbenchItems([]); setWires([]); setDataPoints([]); }}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded text-xs border border-red-900/50 transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                {/* Results Panel */}
                {isCircuitProperlyWired() && (
                    <div className="absolute top-20 right-8 z-30 w-80 pointer-events-auto">
                        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="p-5 border-b border-slate-700 bg-slate-800/50">
                                <h2 className="font-bold text-slate-100 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-slate-900 text-sm font-black">✓</span>
                                    Circuit Simulation Active
                                </h2>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="bg-slate-800 p-3 rounded-lg">
                                    <div className="text-xs text-gray-400 mb-1">Source EMF {"($E$)"}</div>
                                    <div className="text-2xl font-bold text-blue-400">{vSource.toFixed(2)} V</div>
                                </div>
                                <div className="bg-slate-800 p-3 rounded-lg">
                                    <div className="text-xs text-gray-400 mb-1">Galvanometer Resistance {"($G$)"}</div>
                                    <div className="text-xl font-bold text-amber-400">{G_RES} Ω</div>
                                </div>
                                <div className="bg-slate-800 p-3 rounded-lg">
                                    <div className="text-xs text-gray-400 mb-1">Series Resistance {"($R$)"}</div>
                                    <div className="text-xl font-bold text-amber-400">{R_SERIES} Ω</div>
                                </div>
                                <div className="bg-slate-800 p-3 rounded-lg">
                                    <div className="text-xs text-gray-400 mb-1">Current in Galvanometer {"($I$)"}</div>
                                    <div className="text-2xl font-bold text-green-400">{(galva?.props.current || 0).toFixed(3)} mA</div>
                                </div>
                                <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 p-3 rounded-lg border border-blue-700/50">
                                    <div className="text-xs text-blue-300 mb-1">Converted Voltmeter Range</div>
                                    <div className="text-xl font-bold text-white">0 to {convertedVoltmeterRange.toFixed(2)} V</div>
                                    <div className="text-[10px] text-blue-200 mt-1 italic">
                                        {"$V = I_g(G + R)$"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions Panel */}
                <div className="absolute top-20 left-8 z-30 w-80 pointer-events-auto">
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                            <h2 className="font-bold text-slate-100 uppercase tracking-wider text-sm">Experimental Procedure</h2>
                        </div>
                        <div className="p-4 text-xs text-gray-300 space-y-3">
                            <div className="flex items-start gap-2">
                                <span className="bg-yellow-500/20 text-yellow-500 w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">1</span>
                                <span>Note down Galvanometer resistance <strong>G</strong> and full-scale current <strong>I<sub>g</sub></strong>.</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="bg-yellow-500/20 text-yellow-500 w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">2</span>
                                <span>Calculate series resistance: <strong>R = (V / I<sub>g</sub>) - G</strong> for desired range <strong>V</strong>.</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="bg-yellow-500/20 text-yellow-500 w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">3</span>
                                <span>Connect <strong>Battery</strong>, <strong>Rheostat</strong>, <strong>Galvanometer</strong> and <strong>High Resistance Box</strong> in series.</span>
                            </div>
                            <div className="flex items-start gap-2 border-t border-slate-700 pt-2 mt-2">
                                <span className="text-yellow-400 font-bold mr-1">💡 Tip:</span>
                                <span>Adjust the High Resistance Box to your calculated <strong>R</strong> value.</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-blue-400 font-bold mr-1">🔍 Verification:</span>
                                <span>Place a standard <strong>Voltmeter</strong> in parallel across the (G+R) combination to verify the conversion.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Workbench */}
                <div
                    ref={workbenchRef}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex-1 relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden"
                >
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-60"></div>


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

                            return (
                                <g key={wire.id}>
                                    {/* Broad, soft shadow for depth */}
                                    <path
                                        d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                                        stroke="rgba(0,0,0,0.4)"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        fill="none"
                                        className="transition-all duration-300"
                                        style={{ transform: 'translateY(3px)' }}
                                    />
                                    {/* Main Insulation (Red) */}
                                    <path
                                        d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                                        stroke="url(#wireGradient)"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        fill="none"
                                        className="transition-all duration-300"
                                    />
                                    {/* Specular Highlight for 3D effect */}
                                    <path
                                        d={`M ${fromTerminal.x} ${fromTerminal.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toTerminal.x} ${toTerminal.y}`}
                                        stroke="rgba(255,255,255,0.3)"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                        fill="none"
                                        className="transition-all duration-300"
                                        style={{ transform: 'translateY(-0.5px) translateX(-0.5px)' }}
                                    />
                                    {/* Wire Connectors (Ends) */}
                                    <circle cx={fromTerminal.x} cy={fromTerminal.y} r="3" fill="#4a5568" />
                                    <circle cx={toTerminal.x} cy={toTerminal.y} r="3" fill="#4a5568" />
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
                </div>
            </div>
        </main>
    );
}

function SidebarItem({ type, label, children }: { type: string, label: string, children: React.ReactNode }) {
    return (
        <Draggable id={`template-${type}`} type={type} className="flex flex-col items-center group relative cursor-grab active:cursor-grabbing">
            <div className="w-full aspect-square bg-[#0f172a] rounded-xl border border-slate-800 flex items-center justify-center transition-all duration-300 overflow-hidden relative shadow-lg group-hover:border-slate-700 group-hover:bg-slate-800/80 group-hover:-translate-y-0.5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none"></div>
                <div className="relative z-10 w-full h-full flex items-center justify-center p-2 transition-transform duration-300 group-hover:scale-110">
                    {children}
                </div>
            </div>
            <div className="w-full text-center mt-2 px-1">
                <span className="text-[10px] font-bold tracking-tight leading-tight text-slate-500 group-hover:text-slate-300 block truncate">{label}</span>
            </div>
        </Draggable>
    );
}
