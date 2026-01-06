"use client";

import React, { useState, useRef } from "react";
import { Activity } from "lucide-react";
import { Battery } from "../components/physics/Battery";
import { Resistor } from "../components/physics/Resistor";
import { Ammeter } from "../components/physics/Ammeter";
import { Voltmeter } from "../components/physics/Voltmeter";
import { Galvanometer } from "../components/physics/Galvanometer";
import { Rheostat } from "../components/physics/Rheostat";
import { HighResistanceBox } from "../components/physics/HighResistanceBox";
import { Draggable } from "../Draggable";
import { DraggableLabObject } from "../snapped";
import { VIGraph } from "../components/physics/VIGraph";
import { LineChart } from "lucide-react";
import { PhysicsAssistant } from "../components/physics/PhysicsAssistant";

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



const GUIDE_STEPS = [
    {
        id: 1,
        title: "Experimental Setup",
        description: "Calculate resistance R = (V / Ig) - G for your desired voltmeter range V.",
        check: (items: PhysicsItem[]) => items.length > 0
    },
    {
        id: 2,
        title: "Assemble Circuit",
        description: "Connect Battery, Rheostat, Galvanometer, and Resist. Box in a closed series loop.",
        check: (items: PhysicsItem[], wires: Wire[]) => {
            const types = items.map(i => i.type);
            return types.includes('battery') && types.includes('galvanometer') && types.includes('resistance_box') && wires.length >= 3;
        }
    },
    {
        id: 3,
        title: "Calibration",
        description: "Adjust the High Resistance Box to match your calculated value R.",
        check: (items: PhysicsItem[]) => items.some(i => i.type === 'resistance_box' && i.props.resistance !== 1000)
    },
    {
        id: 4,
        title: "Verification",
        description: "Connect a Voltmeter in parallel across the (G + R) combination to verify.",
        check: (items: PhysicsItem[], wires: Wire[]) => {
            const hasVoltmeter = items.some(i => i.type === 'voltmeter');
            return hasVoltmeter && wires.length >= 5;
        }
    },
    {
        id: 5,
        title: "Take Readings",
        description: "Vary the Rheostat resistance to record different sets of V and I readings. Click 'Show Graph' to visualize.",
        check: (items: PhysicsItem[]) => items.length > 0 // Final state
    }
];

export default function OhmsLawLab() {
    const [workbenchItems, setWorkbenchItems] = useState<PhysicsItem[]>([]);
    const [wires, setWires] = useState<Wire[]>([]);
    const [connectingFrom, setConnectingFrom] = useState<{ itemId: string; terminal: string } | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
    const [showGraph, setShowGraph] = useState(false);
    const [circuitRisks, setCircuitRisks] = useState<string[]>([]);
    const workbenchRef = useRef<HTMLDivElement>(null);

    // Derived values for experiment
    const batteryItem = workbenchItems.find(item => item.type === 'battery');
    const galva = workbenchItems.find(item => item.type === 'galvanometer');
    const resBox = workbenchItems.find(item => item.type === 'resistance_box');

    const vSource = batteryItem?.props.voltage || 0;
    const G_RES = galva?.props.internalResistance || 100;
    const IG_MAX = (galva?.props.fullScaleCurrent || 1) / 1000;
    const R_SERIES = resBox?.props.resistance || 0;
    const convertedVoltmeterRange = IG_MAX * (G_RES + R_SERIES);

    // Get terminals for an item based on its type and position
    const getTerminals = (item: PhysicsItem): Terminal[] => {
        const baseOffsets: { [key: string]: { name: string; dx: number; dy: number }[] } = {
            battery: [
                { name: 'positive', dx: 64, dy: 7 },
                { name: 'negative', dx: 64, dy: 93 }
            ],
            resistor: [
                { name: 'left', dx: 0, dy: 25 },
                { name: 'right', dx: 140, dy: 25 }
            ],
            ammeter: [
                { name: 'in', dx: 8, dy: 72 },
                { name: 'out', dx: 120, dy: 72 }
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
                { name: "A", dx: 47, dy: 91 },
                { name: "B", dx: 273, dy: 91 },
                { name: "C", dx: 253, dy: 34 },
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

    // Get all terminals for rendering
    const allTerminals: Terminal[] = workbenchItems.flatMap(item => getTerminals(item));


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
        const risks = checkCircuitRisks(workbenchItems, wires);
        setCircuitRisks(risks);
    }, [wires, workbenchItems]); // Re-solve whenever a wire or any component property changes
    // Step Progress tracking
    React.useEffect(() => {
        const currentStep = GUIDE_STEPS[currentStepIndex];
        if (currentStep && currentStep.check(workbenchItems, wires)) {
            if (currentStepIndex < GUIDE_STEPS.length - 1) {
                const timer = setTimeout(() => setCurrentStepIndex(prev => prev + 1), 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [workbenchItems, wires, currentStepIndex]);

    // Graph Data Recording
    React.useEffect(() => {
        if (!isCircuitProperlyWired()) return;

        // Get readings from either instrument
        const instrument = workbenchItems.find(item => item.type === 'galvanometer' || item.type === 'ammeter');
        if (!instrument) return;

        const currentReading = instrument.props.current || 0;

        // Calculate effective V for the conversion experiment or use source V for Ohm's Law
        const currentV = resBox
            ? (currentReading / 1000) * (G_RES + R_SERIES)
            : vSource;

        if (Math.abs(currentReading) > 0.001) { // More sensitive threshold
            setDataPoints(prev => {
                const last = prev[prev.length - 1];
                // Throttling: only add if value changed significantly
                if (last && Math.abs(last.voltage - currentV) < 0.01 && Math.abs(last.current - currentReading) < 0.005) {
                    return prev;
                }
                return [...prev, {
                    voltage: currentV,
                    current: currentReading,
                    resistance: R_SERIES,
                    timestamp: Date.now()
                }].slice(-100);
            });
        }
    }, [workbenchItems, wires]);

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


    // --- Risk Detection Logic ---

    function checkCircuitRisks(items: PhysicsItem[], wires: Wire[]): string[] {
        const risks: string[] = [];

        // Find all voltmeters
        const voltmeters = items.filter(item => item.type === 'voltmeter');

        voltmeters.forEach(voltmeter => {
            const voltmeterTerminals = getTerminals(voltmeter);

            // Check if voltmeter is in series
            const isInSeries = checkIfInSeries(voltmeter, voltmeterTerminals, items, wires);

            if (isInSeries) {
                risks.push('⚠️ RISK: Voltmeter connected in series! This will block current flow and may damage the voltmeter. Voltmeters must be connected in parallel.');
            }
        });

        return risks;
    }



    function checkIfInSeries(
        voltmeter: PhysicsItem,
        voltmeterTerminals: Terminal[],
        allItems: PhysicsItem[],
        wires: Wire[]
    ): boolean {
        const positiveTerminal = voltmeterTerminals.find(t => t.name === 'positive');
        const negativeTerminal = voltmeterTerminals.find(t => t.name === 'negative');

        if (!positiveTerminal || !negativeTerminal) return false;

        const positiveWire = wires.find(w => isTerminalConnected(w, positiveTerminal));
        const negativeWire = wires.find(w => isTerminalConnected(w, negativeTerminal));

        // If not connected at all, not in series (just open)
        if (!positiveWire || !negativeWire) return false;

        // In series: Voltmeter sits between two different components (or same component but different loop, but typically different components in a simple loop)
        const positiveConnectsTo = findConnectedComponent(positiveWire, voltmeter, allItems);
        const negativeConnectsTo = findConnectedComponent(negativeWire, voltmeter, allItems);

        // If both terminals connect to something
        if (positiveConnectsTo && negativeConnectsTo) {
            // If they connect to DIFFERENT components, it MIGHT be series.
            // But it could be parallel across a gap.
            // Series means the voltmeter IS the bridge.
            // Parallel means there IS another bridge (the component being measured).

            // Check if there is a parallel path (i.e., the component we are measuring)
            const isParallel = checkIfParallelConnection(
                voltmeter,
                positiveConnectsTo,
                negativeConnectsTo,
                wires
            );

            return !isParallel;
        }

        return false;
    }

    function findConnectedComponent(
        wire: Wire,
        excludeItem: PhysicsItem,
        allItems: PhysicsItem[]
    ): PhysicsItem | null {
        // Wire connects A and B. One is excludeItem. Return the other's Item.
        let targetItemId: string | null = null;
        if (wire.from.itemId === excludeItem.id) targetItemId = wire.to.itemId;
        else if (wire.to.itemId === excludeItem.id) targetItemId = wire.from.itemId;

        if (targetItemId) {
            return allItems.find(i => i.id === targetItemId) || null;
        }
        return null;
    }

    function checkIfParallelConnection(
        voltmeter: PhysicsItem,
        component1: PhysicsItem,
        component2: PhysicsItem,
        wires: Wire[]
    ): boolean {
        // If start and end are the same component, it's parallel across that component
        if (component1.id === component2.id) return true;

        // Otherwise, check if there is a path between component1 and component2 that does NOT go through voltmeter
        // This indicates the voltmeter is 'across' that path.
        return checkAlternatePath(component1, component2, voltmeter, wires);
    }

    function checkAlternatePath(
        comp1: PhysicsItem,
        comp2: PhysicsItem,
        voltmeter: PhysicsItem,
        wires: Wire[]
    ): boolean {
        const visited = new Set<string>();
        const queue: PhysicsItem[] = [comp1];
        visited.add(comp1.id);

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.id === comp2.id) return true;

            const connected = findDirectlyConnectedItems(current, wires, voltmeter);
            for (const item of connected) {
                if (!visited.has(item.id)) {
                    visited.add(item.id);
                    queue.push(item);
                }
            }
        }
        return false;
    }

    function isTerminalConnected(wire: Wire, terminal: Terminal): boolean {
        // Robust check using IDs
        return (wire.from.itemId === terminal.itemId && wire.from.terminal === terminal.name) ||
            (wire.to.itemId === terminal.itemId && wire.to.terminal === terminal.name);
    }

    function findDirectlyConnectedItems(
        item: PhysicsItem,
        wires: Wire[],
        exclude: PhysicsItem
    ): PhysicsItem[] {
        const connectedItems: PhysicsItem[] = [];
        // Find all wires connected to 'item'
        wires.forEach(wire => {
            let partnerId: string | null = null;
            if (wire.from.itemId === item.id) partnerId = wire.to.itemId;
            else if (wire.to.itemId === item.id) partnerId = wire.from.itemId;

            if (partnerId && partnerId !== exclude.id) {
                const partner = workbenchItems.find(i => i.id === partnerId);
                if (partner && !connectedItems.includes(partner)) {
                    connectedItems.push(partner);
                }
            }
        });
        return connectedItems;
    }

    // --- AI Fix Logic ---
    const fixWithAI = () => {
        const voltmeter = workbenchItems.find(i => i.type === "voltmeter");
        const galvanometer = workbenchItems.find(i => i.type === "galvanometer");
        const resBox = workbenchItems.find(i => i.type === "resistance_box");
        const rheostat = workbenchItems.find(i => i.type === "rheostat");

        if (!voltmeter) return;

        // Remove existing voltmeter wires
        const baseWires = wires.filter(
            w => w.from.itemId !== voltmeter.id && w.to.itemId !== voltmeter.id
        );

        // Helpers
        const isBetween = (w: Wire, aId: string, aTerm: string, bId: string, bTerm: string) =>
            (w.from.itemId === aId && w.from.terminal === aTerm && w.to.itemId === bId && w.to.terminal === bTerm) ||
            (w.to.itemId === aId && w.to.terminal === aTerm && w.from.itemId === bId && w.from.terminal === bTerm);

        const hasConnection = (aId: string, aTerm: string, bId: string, bTerm: string) =>
            wires.some(w => isBetween(w, aId, aTerm, bId, bTerm));

        const uid = (suffix: string) => `wire-fix-${Date.now()}-${Math.random().toString(16).slice(2)}-${suffix}`;

        // 1) BEST CASE: Fix across (Galvanometer + Resistance Box) outer terminals
        if (galvanometer && resBox) {
            const gTerms = ["positive", "negative"];
            const rTerms = ["left", "right"];

            // Find which terminals are actually connected between G and R
            let gInner: string | null = null;
            let rInner: string | null = null;

            for (const gt of gTerms) {
                for (const rt of rTerms) {
                    if (hasConnection(galvanometer.id, gt, resBox.id, rt)) {
                        gInner = gt;
                        rInner = rt;
                        break;
                    }
                }
                if (gInner) break;
            }

            // If we found the inner junction, choose the outer terminals
            if (gInner && rInner) {
                const gOuter = gInner === "positive" ? "negative" : "positive";
                const rOuter = rInner === "left" ? "right" : "left";

                const fixed = [
                    ...baseWires,
                    {
                        id: uid("1"),
                        from: { itemId: voltmeter.id, terminal: "positive" },
                        to: { itemId: galvanometer.id, terminal: gOuter },
                    },
                    {
                        id: uid("2"),
                        from: { itemId: voltmeter.id, terminal: "negative" },
                        to: { itemId: resBox.id, terminal: rOuter },
                    },
                ];

                setWires(fixed);
                return; // done
            }
            // If G and R exist but not connected, fall through to fallback
        }

        // 2) NEXT BEST: Fix across (Galvanometer + Rheostat) outer terminals
        if (galvanometer && rheostat) {
            // Use A/B as ends (common for rheostat) unless user wired via C; we’ll choose the two that are not tied to the same node later.
            // Simple safe-ish: connect across G terminals if possible, else G+ to Rheostat A, G- to Rheostat B
            const fixed = [
                ...baseWires,
                {
                    id: uid("3"),
                    from: { itemId: voltmeter.id, terminal: "positive" },
                    to: { itemId: galvanometer.id, terminal: "positive" },
                },
                {
                    id: uid("4"),
                    from: { itemId: voltmeter.id, terminal: "negative" },
                    to: { itemId: rheostat.id, terminal: "B" },
                },
            ];

            setWires(fixed);
            return;
        }

        // 3) FALLBACK: just put voltmeter across galvanometer terminals (always parallel to *something*)
        if (galvanometer) {
            const fixed = [
                ...baseWires,
                {
                    id: uid("5"),
                    from: { itemId: voltmeter.id, terminal: "positive" },
                    to: { itemId: galvanometer.id, terminal: "positive" },
                },
                {
                    id: uid("6"),
                    from: { itemId: voltmeter.id, terminal: "negative" },
                    to: { itemId: galvanometer.id, terminal: "negative" },
                },
            ];
            setWires(fixed);
            return;
        }

        // If we got here, we couldn't fix meaningfully
    };


    return (
        <main className="flex h-screen bg-white overflow-hidden text-slate-900">
            {/* Sidebar */}
            <aside className="w-60 bg-white border-r border-slate-200 flex flex-col z-20">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-blue-900 tracking-tight leading-none">LabSathi</h1>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Physics Studio</p>
                        </div>
                    </div>
                    <div className="mt-6 px-4 py-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <p className="text-[9px] text-blue-900/40 font-bold uppercase tracking-widest mb-1">Experiment</p>
                        <p className="text-xs text-blue-900 font-bold leading-tight">Galvanometer to Voltmeter Conversion</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Apparatus</h3>
                        <div className="grid grid-cols-2 gap-3 px-1">
                            <SidebarItem type="battery" label="DC Battery">
                                <div className="scale-50 origin-center drop-shadow-sm">
                                    <Battery voltage={5} />
                                </div>
                            </SidebarItem>

                            <SidebarItem type="resistor" label="Resistor">
                                <div className="scale-60 origin-center drop-shadow-sm">
                                    <Resistor resistance={10} />
                                </div>
                            </SidebarItem>

                            <SidebarItem type="ammeter" label="Ammeter">
                                <div className="scale-45 origin-center drop-shadow-sm">
                                    <Ammeter current={0} />
                                </div>
                            </SidebarItem>

                            <SidebarItem type="voltmeter" label="Voltmeter">
                                <div className="scale-45 origin-center drop-shadow-sm">
                                    <Voltmeter voltage={0} />
                                </div>
                            </SidebarItem>

                            <SidebarItem type="galvanometer" label="Galvanometer">
                                <div className="scale-45 origin-center drop-shadow-sm">
                                    <Galvanometer current={0} />
                                </div>
                            </SidebarItem>

                            <SidebarItem type="rheostat" label="Rheostat">
                                <div className="scale-45 origin-center drop-shadow-sm">
                                    <Rheostat resistance={50} maxResistance={100} />
                                </div>
                            </SidebarItem>

                            <SidebarItem type="resistance_box" label="High Res. Box">
                                <div className="scale-45 origin-center drop-shadow-sm">
                                    <HighResistanceBox resistance={1000} />
                                </div>
                            </SidebarItem>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col relative bg-slate-50">
                {/* Top Toolbar */}
                <div className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-bold text-blue-900">Experiment Environment</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Session</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {connectingFrom && (
                            <button
                                onClick={() => setConnectingFrom(null)}
                                className="bg-amber-50 text-amber-600 hover:bg-amber-100 px-4 py-1.5 rounded-lg text-xs font-bold border border-amber-100 transition-all active:scale-95"
                            >
                                Cancel Wire
                            </button>
                        )}
                        <button
                            onClick={() => setWires([])}
                            className="bg-slate-50 text-slate-600 hover:bg-slate-100 px-4 py-1.5 rounded-lg text-xs font-bold border border-slate-100 transition-all active:scale-95"
                        >
                            Clear Wires
                        </button>
                        <button
                            onClick={() => { setWorkbenchItems([]); setWires([]); }}
                            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                        >
                            Reset Workbench
                        </button>
                    </div>
                </div>

                {/* Risk Alert Popup */}
                {circuitRisks.length > 0 && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="bg-red-500/10 backdrop-blur-md border border-red-500/50 text-red-100 px-6 py-4 rounded-2xl shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] flex flex-col items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500 rounded-lg animate-pulse">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="font-bold text-lg">{circuitRisks[0]}</div>
                            </div>
                            <button
                                onClick={fixWithAI}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-2 px-6 rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Fix this with AI
                            </button>
                        </div>
                    </div>
                )}

                {/* Consolidated Dashboard - Top Left */}
                {isCircuitProperlyWired() && (
                    <div className="absolute top-16 left-6 z-30 w-[340px] pointer-events-auto transition-all duration-500 animate-in fade-in slide-in-from-left-4 flex flex-col gap-4 max-h-[calc(100vh-120px)] overflow-hidden">
                        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col border-b-4 border-b-blue-600/20">
                            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-bold text-blue-900 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                                    Circuit Analytics
                                </h2>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-2">
                                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[8px] text-slate-400 mb-1 uppercase font-black tracking-tighter">EMF {"($E$)"}</div>
                                    <div className="text-xl font-black text-blue-600 tabular-nums">{vSource.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-60">V</span></div>
                                </div>
                                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[8px] text-slate-400 mb-1 uppercase font-black tracking-tighter">Current {"($I$)"}</div>
                                    <div className="text-xl font-black text-green-600 tabular-nums">{(galva?.props.current || 0).toFixed(2)}<span className="text-[10px] ml-0.5 opacity-60">mA</span></div>
                                </div>
                                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[8px] text-slate-400 mb-1 uppercase font-black tracking-tighter">Resist. {"($G$)"}</div>
                                    <div className="text-lg font-bold text-amber-600 tabular-nums">{G_RES}<span className="text-[10px] ml-0.5 opacity-60">Ω</span></div>
                                </div>
                                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[8px] text-slate-400 mb-1 uppercase font-black tracking-tighter">Series {"($R$)"}</div>
                                    <div className="text-lg font-bold text-amber-600 tabular-nums">{R_SERIES}<span className="text-[10px] ml-0.5 opacity-60">Ω</span></div>
                                </div>
                                <div className="bg-blue-600 p-4 rounded-xl shadow-lg shadow-blue-600/10 col-span-2 flex items-center justify-between">
                                    <div>
                                        <div className="text-[8px] text-white/60 uppercase font-black tracking-tighter">Max Range {"($V$)"}</div>
                                        <div className="text-lg font-black text-white">{convertedVoltmeterRange.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-60">V</span></div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] text-white/60 uppercase font-black tracking-tighter">Merit {"($k$)"}</div>
                                        <div className="text-sm font-bold text-white/90">{(IG_MAX * 1000 / 30).toFixed(4)}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowGraph(true)}
                                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black p-3 rounded-xl transition-all text-white text-[10px] font-bold col-span-2 group"
                                >
                                    <LineChart className="w-3.5 h-3.5 text-blue-400" />
                                    Visualize V-I Curve
                                </button>
                            </div>
                        </div>

                        {/* Observation Table */}
                        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col flex-1 border-b-4 border-b-cyan-600/20">
                            <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-bold text-blue-900 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                                    <LineChart className="w-3.5 h-3.5 text-cyan-600" />
                                    Observation Table
                                </h2>
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{dataPoints.length} pts</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                                        <tr className="border-b border-slate-100">
                                            <th className="px-4 py-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center">S.N.</th>
                                            <th className="px-4 py-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter">Voltage (V)</th>
                                            <th className="px-4 py-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter">Current (mA)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {dataPoints.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-12 text-center text-[10px] font-medium text-slate-400 italic">
                                                    No readings recorded. Vary the rheostat to capture data.
                                                </td>
                                            </tr>
                                        ) : (
                                            dataPoints.slice().reverse().slice(0, 10).map((dp, idx) => (
                                                <tr key={dp.timestamp} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-4 py-2.5 text-[10px] font-mono text-slate-400 text-center">{dataPoints.length - idx}</td>
                                                    <td className="px-4 py-2.5 text-[11px] font-extrabold text-blue-600 tabular-nums">{dp.voltage.toFixed(3)}</td>
                                                    <td className="px-4 py-2.5 text-[11px] font-extrabold text-green-600 tabular-nums">{dp.current.toFixed(3)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {dataPoints.length > 0 && (
                                <div className="p-3 border-t border-slate-100 flex justify-center bg-slate-50/30">
                                    <button
                                        onClick={() => setDataPoints([])}
                                        className="text-[9px] font-black text-red-500/60 hover:text-red-600 uppercase tracking-widest transition-colors py-1 px-4"
                                    >
                                        Clear History
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Guide Overlay - Sequential Step View */}
                <div className="absolute top-20 right-8 z-30 w-80 pointer-events-auto">
                    <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-3xl overflow-hidden transition-all duration-500">
                        <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                                Current Step
                            </h2>
                            <div className="px-3 py-1 bg-blue-600/10 rounded-full border border-blue-600/20">
                                <span className="text-[10px] font-black text-blue-600">{currentStepIndex + 1} / {GUIDE_STEPS.length}</span>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-blue-900 font-black text-sm mb-2 tracking-tight">
                                {GUIDE_STEPS[currentStepIndex]?.title}
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-bold">
                                {GUIDE_STEPS[currentStepIndex]?.description || "Experiment Complete."}
                            </p>
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
        </main >
    );











}

function SidebarItem({ type, label, children }: { type: string, label: string, children: React.ReactNode }) {
    return (
        <Draggable id={`template-${type}`} type={type} className="flex flex-col items-center group relative cursor-grab active:cursor-grabbing">
            <div className="w-full aspect-square bg-[#f1f5f9]/50 rounded-2xl border border-slate-100 flex items-center justify-center transition-all duration-300 overflow-hidden relative group-hover:border-blue-100 group-hover:bg-blue-50/20 group-hover:shadow-lg group-hover:shadow-blue-500/5 group-hover:-translate-y-1">
                <div className="relative z-10 w-full h-full flex items-center justify-center p-2 transition-transform duration-500 group-hover:scale-105">
                    {children}
                </div>
            </div>
            <div className="w-full text-center mt-2.5 px-0.5">
                <span className="text-[9px] font-black tracking-tight leading-tight text-slate-500 uppercase group-hover:text-blue-600 transition-colors block truncate">{label}</span>
            </div>
        </Draggable>
    );
}