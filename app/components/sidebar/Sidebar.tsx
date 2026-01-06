import React from 'react';
import { SidebarItem } from './SidebarItem';
import { Battery } from "../physics/Battery";
import { Resistor } from "../physics/Resistor";
import { Ammeter } from "../physics/Ammeter";
import { Voltmeter } from "../physics/Voltmeter";
import { Galvanometer } from "../physics/Galvanometer";
import { Rheostat } from "../physics/Rheostat";
import { HighResistanceBox } from "../physics/HighResistanceBox";

export default function Sidebar() {
    return (
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
    );
}
