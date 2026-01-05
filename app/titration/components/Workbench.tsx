import React, { useRef, useState, useMemo } from "react";
import { Stand } from "../../components/lab/stand";
import { Clamp } from "../../components/lab/Clamp";
import { Burette } from "../../components/lab/Burette";
import { Flask } from "../../components/lab/Flask";
import { Tile, Funnel, MeasuringCylinder } from "../../components/lab/Accessories";
import { Bottle } from "../../components/lab/Bottles";
import { Pipette } from "../../components/lab/Pipette";
import { Tube } from "../../components/lab/Tube";
import { VolumetricFlask } from "../../components/lab/VolumetricFlask";
import { TitrationFlask } from "../../components/lab/TitrationFlask";
import { DraggableLabObject, SnapTarget } from "../../snapped";
import { LabItem } from "../types";
import { GuideStep } from "../constants";

interface WorkbenchProps {
    items: LabItem[];
    onDrop: (e: React.DragEvent, rect: DOMRect) => void;
    onPositionChange: (id: string, x: number, y: number, snappedToId: string | null) => void;
    onDelete: (id: string) => void;
    onDispense: (sourceId: string, amount: number, color: string) => void;
    onFlaskAdd: (id: string, amount: number, color: string, type: string) => void;
    onClear: () => void;
    currentStepIndex: number;
    guideSteps: GuideStep[];
}

export function Workbench({
    items,
    onDrop,
    onPositionChange,
    onDelete,
    onDispense,
    onFlaskAdd,
    onClear,
    currentStepIndex,
    guideSteps
}: WorkbenchProps) {
    const workbenchRef = useRef<HTMLDivElement>(null);
    const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

    const snapTargets = useMemo(() => {
        const targets: SnapTarget[] = [];
        items.forEach(item => {
            if (item.type === 'stand') {
                targets.push({
                    id: `rod-${item.id}`,
                    x: item.x + 96,
                    y: item.y + 70,
                    radius: 40,
                    validTypes: ['clamp']
                });
                targets.push({
                    id: `base-${item.id}`,
                    x: item.x + 96,
                    y: item.y + 330,
                    radius: 60,
                    validTypes: ['flask', 'cylinder', 'volumetric-flask', 'titration-flask']
                });
            } else if (item.type === 'clamp') {
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
    }, [items]);

    const handleDropInternal = (e: React.DragEvent) => {
        e.preventDefault();
        if (!workbenchRef.current) return;
        const rect = workbenchRef.current.getBoundingClientRect();
        onDrop(e, rect);
    };

    const hoveredItemData = items.find(i => i.id === hoveredItemId);

    const renderItem = (item: LabItem) => {
        let Component;
        switch (item.type) {
            case 'stand': Component = <Stand {...item.props} />; break;
            case 'clamp': Component = <Clamp {...item.props} />; break;
            case 'burette':
                Component = <Burette
                    {...item.props}
                    onDispense={(a: number, c: string) => onDispense(item.id, a, c)}
                />;
                break;
            case 'flask':
                Component = <Flask {...item.props} onAddContent={(a: number, c: string, t: string) => onFlaskAdd(item.id, a, c, t)} />;
                break;
            case 'titration-flask':
                Component = <TitrationFlask {...item.props} onAddContent={(a: number, c: string, t: string) => onFlaskAdd(item.id, a, c, t)} />;
                break;
            case 'volumetric-flask':
                Component = <VolumetricFlask 
                    {...item.props} 
                    onAddContent={(a: number, c: string, t: string) => onFlaskAdd(item.id, a, c, t)} 
                    currentStep={currentStepIndex + 1}  // Guide steps are 1-indexed
                    containerState={item.containerState}
                />;
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
                onPositionChange={onPositionChange}
                onDelete={onDelete}
                onHover={(isHovered) => setHoveredItemId(isHovered ? item.id : null)}
            >
                {Component}
            </DraggableLabObject>
        );
    };

    return (
        <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
            {/* Top Toolbar */}
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
                        <span>{guideSteps.length}</span>
                    </div>
                    <button
                        onClick={onClear}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded text-xs border border-red-900/50 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Guide Overlay - Top Right */}
            <div className="absolute top-16 right-6 z-30 w-72 pointer-events-none">
                <div className="bg-[#252526]/90 backdrop-blur border border-[#3e3e3e] shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden pointer-events-auto transition-transform hover:scale-[1.01]">
                    <div className="px-4 py-3 bg-gradient-to-r from-[#2d2d2d] to-[#363636] border-b border-[#3e3e3e] flex items-center justify-between">
                        <h2 className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Guide: {guideSteps[currentStepIndex]?.title}
                        </h2>
                    </div>
                    <div className="p-4 text-xs text-gray-300 leading-relaxed font-medium">
                        {guideSteps[currentStepIndex]?.description || "Setup Complete."}
                        <div className="mt-4 pt-3 border-t border-[#3e3e3e] space-y-2 opacity-90">
                            {guideSteps.map((step, idx) => (
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
                        <div className="space-y-1">
                            <div className="flex justify-between"><span>ID:</span> <span className="text-sky-400">{hoveredItemData.id.slice(-6)}</span></div>
                            <div className="flex justify-between"><span>Type:</span> <span className="text-white">{hoveredItemData.type}</span></div>
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
                onDrop={handleDropInternal}
                onDragOver={(e) => e.preventDefault()}
                className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-gray-900 overflow-hidden touch-none"
            >
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-60"></div>

                {items.map(renderItem)}

                {items.length === 0 && (
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
    );
}

