'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ChevronRight } from 'lucide-react';
import { subjects, grades } from './subjects';

export default function Dashboard() {
    const router = useRouter();
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Filter subjects based on selected grade
    const filteredSubjects = subjects.filter(s => s.gradeId.includes(selectedGrade));
    const activeSubject = subjects.find(s => s.id === selectedSubject);

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-slate-900 selection:bg-rose-500/10 overflow-x-hidden relative font-sans">
               {/* Navigation */}

    <nav className="relative z-50 bg-white/60 backdrop-blur-xl border-b border-slate-100">

        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">

            {/* Left: Solid Black LabSathi Branding */}

            <div className="flex items-center gap-3">

                <div className="w-1.5 h-10 bg-black rounded-full"></div>

                <div className="flex flex-col">

                    <h1 className="text-3xl font-black text-black tracking-tighter leading-none uppercase">

                        LabSathi

                    </h1>

   

                </div>

            </div>



            {/* Right: Navigation Links */}

            <div className="flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">

                <a href="#" className="hover:text-black transition-colors">Library</a>

                <a href="#" className="hover:text-black transition-colors">Achievements</a>

                <button className="bg-black text-white px-6 py-2 rounded-full hover:brightness-125 transition-all">Sign In</button>

            </div>

        </div>

    </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-16 pb-32">
                    {/* HERO SECTION: Hides when a grade is selected */}
    {!selectedGrade && (
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto mb-32 animate-out fade-out slide-out-to-top-8 duration-500">
            <div className="w-full">
                <h1 className="text-7xl md:text-9xl font-black mb-10 tracking-tighter text-black leading-[0.85]">
                    Master Science <br />
                   <span className="text-rose-500">By Doing.</span>
                </h1>
                
                <p className="text-slate-500 text-xl font-medium mb-16 max-w-2xl mx-auto">
                    High-fidelity simulations just like real-world laboratory 
                    physics with precision and beauty.
                </p>

                <div className="space-y-8">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">
                        Choose Academic Level
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {grades.map((grade) => (
                            <button
                                key={grade.id}
                                onClick={() => {
                                    setSelectedGrade(grade.id);
                                    setSelectedSubject(''); 
                                }}
                                className="px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all duration-300 border-2 bg-white text-black border-black hover:bg-black hover:text-white hover:scale-105"
                            >
                                {grade.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )}

{/* SECTION 2 & 3: CONDITIONAL NAVIGATION FLOW */}
{selectedGrade && (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 mb-20">
        
        {/* HIDE SUBJECTS IF ONE IS SELECTED */}
        {!selectedSubject ? (
            <>
                <div className="flex items-center gap-4 mb-10">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] whitespace-nowrap">
                        Select Specialization
                    </h2>
                    <div className="h-[1px] w-full bg-slate-100"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {filteredSubjects.map((subject) => (
                        <button
                            key={subject.id}
                            onClick={() => setSelectedSubject(subject.id)}
                            className="group relative flex h-64 rounded-[2.5rem] transition-all duration-500 text-left overflow-hidden border-2 bg-white border-slate-100 hover:border-black shadow-sm hover:shadow-xl hover:scale-[1.01]"
                        >
                            {/* Image Side */}
                            <div className="w-2/5 h-full overflow-hidden border-r border-slate-50 bg-slate-100">
                                <img 
                                    src={subject.photo} 
                                    alt={subject.label}
                                    className="w-full h-full object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-110"
                                />
                            </div>

                            {/* Content Side */}
                            <div className="w-3/5 p-8 flex flex-col justify-center bg-white">
                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 text-black">
                                    {subject.label}
                                </h3>
                                <p className="text-xs leading-relaxed text-slate-400 font-medium group-hover:text-slate-600 mb-6 line-clamp-2">
                                    {subject.description}
                                </p>
                                <div className="h-1.5 rounded-full bg-slate-100 group-hover:bg-black group-hover:w-16 transition-all duration-500" />
                            </div>
                        </button>
                    ))}
                </div>
            </>
        ) : (
            /* SHOW EXPERIMENTS ONLY AFTER SUBJECT CLICK */
            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4 flex-1">
                        <button 
                            onClick={() => setSelectedSubject('')}
                            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                        >
                            ← Back to Subjects
                        </button>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
                            <ChevronRight size={14} className="text-rose-500" />
                            Available Experiments in {activeSubject?.label}
                        </h2>
                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeSubject?.experiments.map((exp) => (
                        <button
                            key={exp.id}
                            onClick={() => router.push(exp.path)}
                            className="group flex items-center justify-between p-8 bg-white border border-slate-100 rounded-[2rem] hover:border-black hover:shadow-2xl transition-all duration-300 text-left"
                        >
                            <div className="flex items-center gap-6">
                                {/* Icon mimicking the 'im' circle in your upload */}
                                <div className="w-14 h-14 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all duration-500">
                                    <exp.icon size={24} className="text-slate-400 group-hover:text-white" strokeWidth={2.5} />
                                </div>
                                
                                <div className="max-w-[200px]">
                                    <h4 className="text-lg font-black text-black tracking-tight mb-1">
                                        {exp.name}
                                    </h4>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            {exp.difficulty || 'Intermediate'} / Basic
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-black transition-all">
                                
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}
    </div>
)}
            </main>
        </div>
    );
}