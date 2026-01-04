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
            case 'ammeter': return { current: 0 };
            case 'voltmeter': return { voltage: 0 };
            case 'galvanometer': return { current: 0 };
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
                { name: 'positive', dx: 136, dy: 80 },  // w-36=144, right:-2, w-5=20. 144+2-10=136. h-40=160, 1/2=80.
                { name: 'negative', dx: 8, dy: 80 }     // -2+10=8.
            ],
            rheostat: [
                { name: 'left', dx: 6, dy: 8 },
                { name: 'right_top', dx: 186, dy: 8 },
                { name: 'right_bottom', dx: 186, dy: 88 }
            ],
            resistance_box: [
                { name: 'left', dx: 6, dy: 116 },
                { name: 'right', dx: 154, dy: 116 }
            ]
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

    // Calculate Physics for the Conversion Experiment
    const batteryItem = workbenchItems.find(item => item.type === 'battery');
    const galvanometerItem = workbenchItems.find(item => item.type === 'galvanometer');
    const resistanceBoxItem = workbenchItems.find(item => item.type === 'resistance_box');
    const rheostatItem = workbenchItems.find(item => item.type === 'rheostat');

    const G_RESISTANCE = 100; // 100 Ohms internal resistance for Galvanometer
    const IG_MAX = 0.001;    // 1mA full scale current

    const vSource = batteryItem?.props.voltage || 0;
    const rSeries = resistanceBoxItem?.props.resistance || 0;
    const rRheo = rheostatItem?.props.resistance || 0;
    const rTotal = G_RESISTANCE + rSeries + rRheo;

    // Calculate actual current in circuit (A)
    const circuitCurrent = vSource / (rTotal || 1);
    const galvanometerCurrentMA = circuitCurrent * 1000;

    // Range of the converted Voltmeter = Ig * (G + R)
    const convertedVoltmeterRange = IG_MAX * (G_RESISTANCE + rSeries);

    // Update component states based on simulation
    React.useEffect(() => {
        if (isCircuitProperlyWired()) {
            if (galvanometerItem) {
                handlePropertyChange(galvanometerItem.id, 'current', galvanometerCurrentMA);

                // Record data point
                const newDataPoint: DataPoint = {
                    voltage: vSource,
                    current: circuitCurrent,
                    resistance: rTotal,
                    timestamp: Date.now()
                };

                setDataPoints(prev => {
                    const updated = [...prev, newDataPoint];
                    return updated.slice(-20);
                });
            }
        } else {
            // Reset galvanometer if circuit broken
            if (galvanometerItem) {
                handlePropertyChange(galvanometerItem.id, 'current', 0);
            }
        }
    }, [vSource, rSeries, rRheo, wires.length]);

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
            case 'voltmeter':
                Component = <Voltmeter voltage={item.props.voltage || 0} />;
                break;
            case 'galvanometer':
                Component = <Galvanometer current={item.props.current || 0} />;
                break;
            case 'rheostat':
                Component = <Rheostat
                    resistance={item.props.resistance || 50}
                    maxResistance={item.props.maxResistance || 100}
                    onResistanceChange={(r) => handlePropertyChange(item.id, 'resistance', r)}
                />;
                break;
            case 'resistance_box':
                Component = <HighResistanceBox
                    resistance={item.props.resistance || 1000}
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
                                    Circuit Complete
                                </h2>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="bg-slate-800 p-3 rounded-lg">
                                    <div className="text-xs text-gray-400 mb-1">Source Voltage {"($V$)"}</div>
                                    <div className="text-2xl font-bold text-blue-400">{vSource.toFixed(2)} V</div>
                                </div>
                                <div className="bg-slate-800 p-3 rounded-lg">
                                    <div className="text-xs text-gray-400 mb-1">Total Resistance {"($G + R$)"}</div>
                                    <div className="text-2xl font-bold text-amber-400">{rTotal.toFixed(0)} Ω</div>
                                </div>
                                <div className="bg-slate-800 p-3 rounded-lg">
                                    <div className="text-xs text-gray-400 mb-1">Current {"($I$)"}</div>
                                    <div className="text-2xl font-bold text-green-400">{(circuitCurrent * 1000).toFixed(2)} mA</div>
                                </div>
                                <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 p-3 rounded-lg border border-blue-700/50">
                                    <div className="text-xs text-blue-300 mb-1">Converted Range</div>
                                    <div className="text-xl font-bold text-white">0 to {convertedVoltmeterRange.toFixed(2)} V</div>
                                    <div className="text-[10px] text-blue-200 mt-1 italic">
                                        {"$V_{range} = I_g(G + R)$"}
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-3 rounded-lg border border-purple-700/50">
                                    <div className="text-xs text-purple-300 mb-1">Verification</div>
                                    <div className="text-[10px] font-mono text-white">
                                        {"$I = V / (G + R)$"}
                                    </div>
                                    <div className="text-[10px] font-mono text-purple-200 mt-1">
                                        {(circuitCurrent * 1000).toFixed(2)} mA = {vSource.toFixed(1)} / {rTotal.toFixed(0)}
                                    </div>
                                    <div className="text-[10px] font-mono text-green-400 mt-1">
                                        Verification Successful ✓
                                    </div>
                                </div>

                                {/* V-I Graph */}
                                {dataPoints.length > 0 && (
                                    <div className="bg-slate-800 p-3 rounded-lg">
                                        <div className="text-xs text-gray-400 mb-2 font-bold">V-I Relationship Graph</div>
                                        <div className="relative w-full h-48 bg-slate-900 rounded border border-slate-700">
                                            <svg className="w-full h-full" viewBox="0 0 280 180">
                                                {/* Grid lines */}
                                                <defs>
                                                    <pattern id="grid" width="28" height="18" patternUnits="userSpaceOnUse">
                                                        <path d="M 28 0 L 0 0 0 18" fill="none" stroke="#334155" strokeWidth="0.5" opacity="0.3" />
                                                    </pattern>
                                                </defs>
                                                <rect width="280" height="180" fill="url(#grid)" />

                                                {/* Axes */}
                                                <line x1="30" y1="150" x2="270" y2="150" stroke="#64748b" strokeWidth="2" />
                                                <line x1="30" y1="10" x2="30" y2="150" stroke="#64748b" strokeWidth="2" />

                                                {/* Axis labels */}
                                                <text x="150" y="172" fill="#94a3b8" fontSize="10" textAnchor="middle">Voltage (V)</text>
                                                <text x="10" y="80" fill="#94a3b8" fontSize="10" textAnchor="middle" transform="rotate(-90, 10, 80)">Current (A)</text>

                                                {/* Range conversion line (theoretical) */}
                                                {rTotal > 0 && (
                                                    <line
                                                        x1="30"
                                                        y1="150"
                                                        x2="270"
                                                        y2={150 - (12 / rTotal) * 100}
                                                        stroke="#8b5cf6"
                                                        strokeWidth="2"
                                                        strokeDasharray="4 2"
                                                        opacity="0.5"
                                                    />
                                                )}

                                                {/* Data points */}
                                                {dataPoints.map((point, i) => {
                                                    const x = 30 + (point.voltage / 12) * 240;
                                                    const y = 150 - (point.current / 0.05) * 140; // Scaled for mA range
                                                    return (
                                                        <g key={i}>
                                                            <circle
                                                                cx={x}
                                                                cy={y}
                                                                r="3"
                                                                fill="#22c55e"
                                                                stroke="#16a34a"
                                                                strokeWidth="1.5"
                                                                opacity={0.6 + (i / dataPoints.length) * 0.4}
                                                            />
                                                        </g>
                                                    );
                                                })}

                                                {/* Current point highlighted */}
                                                {dataPoints.length > 0 && (() => {
                                                    const lastPoint = dataPoints[dataPoints.length - 1];
                                                    const x = 30 + (lastPoint.voltage / 12) * 240;
                                                    const y = 150 - (lastPoint.current / 2) * 140;
                                                    return (
                                                        <circle
                                                            cx={x}
                                                            cy={y}
                                                            r="5"
                                                            fill="#22c55e"
                                                            stroke="#fff"
                                                            strokeWidth="2"
                                                            className="animate-pulse"
                                                        />
                                                    );
                                                })()}

                                                {/* Scale markers */}
                                                <text x="30" y="165" fill="#64748b" fontSize="8" textAnchor="middle">0</text>
                                                <text x="150" y="165" fill="#64748b" fontSize="8" textAnchor="middle">6</text>
                                                <text x="270" y="165" fill="#64748b" fontSize="8" textAnchor="middle">12</text>
                                                <text x="20" y="153" fill="#64748b" fontSize="8" textAnchor="end">0</text>
                                                <text x="20" y="80" fill="#64748b" fontSize="8" textAnchor="end">1</text>
                                                <text x="20" y="13" fill="#64748b" fontSize="8" textAnchor="end">2</text>
                                            </svg>
                                        </div>
                                        <div className="text-[9px] text-gray-500 mt-1 flex items-center justify-between">
                                            <span>● Data Points</span>
                                            <span className="text-purple-400">- - Theoretical (V=IR)</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions Panel */}
                <div className="absolute top-20 left-8 z-30 w-72 pointer-events-auto">
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                            <h2 className="font-bold text-slate-100">Instructions</h2>
                        </div>
                        <div className="p-4 text-xs text-gray-300 space-y-2">
                            <div className="flex items-start gap-2">
                                <span className="text-yellow-400 font-bold">1.</span>
                                <span>Drag components to the workbench</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-yellow-400 font-bold">2.</span>
                                <span><strong>Click terminals</strong> (colored dots) to connect wires</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-yellow-400 font-bold">3.</span>
                                <span>Connect: <strong>Battery → Rheostat → Galvanometer → Resist. Box → Battery</strong></span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-yellow-400 font-bold">4.</span>
                                <span>Add <strong>Voltmeter</strong> across the (Galvanometer + Series Resistance)</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-yellow-400 font-bold">5.</span>
                                <span>Verify: V / Divisions should be constant</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-yellow-400 font-bold">6.</span>
                                <span>Galvanometer converted to Voltmeter!</span>
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
                                onClick={() => handleTerminalClick(terminal.itemId, terminal.name)}
                                className={`absolute w-5 h-5 flex items-center justify-center cursor-pointer transition-all z-10 group/terminal ${isConnecting ? 'scale-125' : ''}`}
                                style={{
                                    left: terminal.x - 10,
                                    top: terminal.y - 10
                                }}
                                title={`${terminal.itemId.split('-')[0]} - ${terminal.name}`}
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
