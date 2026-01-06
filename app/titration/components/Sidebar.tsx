import React, { useState } from "react";
import { Stand } from "../../components/lab/stand";
import { Clamp } from "../../components/lab/Clamp";
import { Burette } from "../../components/lab/Burette";
import { Flask } from "../../components/lab/Flask";
import { Tile, Funnel, MeasuringCylinder } from "../../components/lab/Accessories";
// Bottles import if needed, assuming they're used in the workbench or sidebar
import { Pipette } from "../../components/lab/Pipette";
import { Draggable } from "../../Draggable";
import { Tube } from "../../components/lab/Tube";
import { VolumetricFlask } from "../../components/lab/VolumetricFlask";
import { TitrationFlask } from "../../components/lab/TitrationFlask";
import { GuideStep } from "../constants";

interface SidebarProps {
    currentStepIndex: number;
    guideSteps: GuideStep[];
}

export function Sidebar({ currentStepIndex, guideSteps }: SidebarProps) {
    return (
        <aside className="w-60 bg-[#2a2a2a] border-r border-[#3e3e3e] flex flex-col z-20 shadow-xl select-none">
            {/* Header / Search */}
            <div className="p-3 border-b border-[#3e3e3e] bg-[#252526]">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-pink-600 rounded flex items-center justify-center text-white font-bold text-xs">L</div>
                    <h1 className="text-sm font-semibold text-gray-200 tracking-wide">LabSathi</h1>
                </div>
                {/* Search Bar Input */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search shapes..."
                        className="w-full bg-[#3c3c3c] text-xs text-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-[#3e3e3e]"
                    />
                    <div className="absolute right-2 top-1.5 text-gray-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#424242] scrollbar-track-transparent">

                {/* Sidebar Content */}

                <SidebarSection title="General Apparatus" defaultOpen={true}>
                    <div className="grid grid-cols-3 gap-2 p-2">
                        <SidebarItem type="stand" label="Stand" highlight={guideSteps[currentStepIndex]?.id === 1 /* implicitly checking target via step logic */}><div className="scale-[0.08] text-gray-400 origin-center"><Stand /></div></SidebarItem>
                        <SidebarItem type="clamp" label="Clamp" highlight={guideSteps[currentStepIndex]?.id === 2}><div className="scale-[0.3] text-gray-400 origin-center"><Clamp /></div></SidebarItem>
                        <SidebarItem type="tile" label="Tile" highlight={false}><div className="scale-[0.25] text-gray-400 origin-center"><Tile /></div></SidebarItem>
                    </div>
                </SidebarSection>

                <SidebarSection title="Glassware & Flasks" defaultOpen={true}>
                    <div className="grid grid-cols-2 gap-2 p-2">
                        <SidebarItem type="burette" label="Burette" highlight={guideSteps[currentStepIndex]?.id === 3}><div className="scale-[0.3] origin-center h-24 overflow-hidden"><Burette fill={0} color="bg-transparent" /></div></SidebarItem>
                        <SidebarItem type="titration-flask" label="Titration" highlight={guideSteps[currentStepIndex]?.id === 4 /* target logic might need refinement based on exact step */}><div className="scale-[0.3] origin-center"><TitrationFlask fill={0} label="" /></div></SidebarItem>
                        <SidebarItem type="flask" label="Conical" highlight={false}><div className="scale-[0.3] origin-center"><Flask fill={0} /></div></SidebarItem>
                        <SidebarItem type="volumetric-flask" label="Volumetric" highlight={guideSteps[currentStepIndex]?.id === 4}><div className="scale-[0.25] origin-center"><VolumetricFlask fill={0} color="bg-transparent" /></div></SidebarItem>
                        <SidebarItem type="cylinder" label="Cylinder" highlight={false}><div className="scale-[0.35] origin-center"><MeasuringCylinder fill={0} /></div></SidebarItem>
                        <SidebarItem type="funnel" label="Funnel" highlight={false}><div className="scale-[0.4] origin-center"><Funnel /></div></SidebarItem>
                        <SidebarItem type="tube" label="Test Tube" highlight={false}><div className="scale-[0.25] origin-center"><Tube fill={0} /></div></SidebarItem>
                    </div>
                </SidebarSection>

                <SidebarSection title="Misc" defaultOpen={false}>
                    <div className="grid grid-cols-4 gap-2 p-2">
                        <SidebarItem type="pipette" label="Pipette" highlight={false}><div className="scale-[0.3] -rotate-45 origin-center"><Pipette fill={0} color="bg-yellow-500/50" /></div></SidebarItem>
                    </div>
                </SidebarSection>

            </div>
        </aside>
    );
}

function SidebarSection({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-[#3e3e3e]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#2d2d2d] hover:bg-[#383838] transition-colors text-xs font-bold text-gray-400 uppercase tracking-tighter"
            >
                <span>{title}</span>
                <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="bg-[#252526] transition-all duration-300 ease-in-out">
                    {children}
                </div>
            )}
        </div>
    )
}

export function SidebarItem({ type, label, children, highlight = false }: { type: string, label: string, children: React.ReactNode, highlight?: boolean }) {
    return (
        <Draggable id={`template-${type}`} type={type} className="group relative flex flex-col items-center justify-center p-2 rounded hover:bg-[#3e3e3e] cursor-grab active:cursor-grabbing transition-all duration-300 border border-transparent hover:border-[#505050]">
            {highlight && (
                <div className="absolute inset-0 bg-blue-500/20 rounded border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse pointer-events-none"></div>
            )}
            <div className={`w-10 h-10 flex items-center justify-center pointer-events-none mb-1 transition-transform duration-300 ${highlight ? 'scale-110' : ''}`}>
                {children}
            </div>
            <span className={`text-[10px] text-center leading-tight truncate w-full transition-colors ${highlight ? 'text-blue-300 font-bold' : 'text-gray-500 group-hover:text-gray-300'}`}>{label}</span>
            {highlight && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full shadow-lg animate-ping"></div>
            )}
        </Draggable>
    )
}
