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
             <aside className="w-50 bg-white border-r border-slate-200 flex flex-col z-20">
              <div className="p-8 border-b border-slate-100 bg-white">
    <div className="flex items-center group cursor-default">
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
              
                <h1 className="text-3xl font-black uppercase tracking-tighter transition-all duration-300 
    bg-gradient-to-b from-zinc-400 via-zinc-900 to-black bg-clip-text text-transparent
    filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]
    group-hover:from-rose-400 group-hover:to-rose-600 transition-all">
                    LabSathi
                </h1>
            </div>
            
            {/* Cleaner subtitle alignment */}
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] pl-5 mt-1">
                Physics Studio
            </p>
        </div>
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
