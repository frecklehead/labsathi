import { Draggable } from "../Draggable";
export function SidebarItem({ type, label, children }: { type: string, label: string, children: React.ReactNode }) {
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