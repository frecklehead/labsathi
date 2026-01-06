'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Beaker, Zap, GraduationCap, BookOpen, ChevronRight, Atom, FlaskConical, Sparkles, Brain } from 'lucide-react';
import { subjects,grades } from './subjects';

export default function Dashboard() {
    const router = useRouter();
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    

 
    const handleExperimentClick = (path: string) => {
        router.push(path);
    };

    const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

    return (
       <div className="min-h-screen bg-[#FDFCFB] text-slate-900 selection:bg-rose-500/10 overflow-x-hidden relative font-sans">
    {/* Soft Decorative Background Blurs */}
    <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-50/40 blur-[120px] rounded-full"></div>
    </div>

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
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Physics Studio</p>
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
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            {/* Left Side: Content */}
            <div className="w-full lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest mb-8">
                    <Sparkles className="w-3 h-3" />
                    <span>Next Gen Simulations</span>
                </div>
                
                <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter text-black leading-[0.9]">
                    Master Science <br />
                    <span className="text-rose-500">By Doing.</span>
                </h1>
                
                <p className="text-slate-500 text-xl max-w-lg leading-relaxed font-medium mb-12">
                    High-fidelity simulations that replicate real-world laboratory physics with precision and beauty.
                </p>

                {/* Grade Selection with Black Borders */}
                <div className="space-y-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Choose Academic Level</p>
                    <div className="flex flex-wrap gap-3">
                        {grades.map((grade) => (
                            <button
                                key={grade.id}
                                onClick={() => setSelectedGrade(grade.id)}
                                className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 border-2
                                    ${selectedGrade === grade.id
                                        ? 'bg-black text-white border-black shadow-xl shadow-black/20'
                                        : 'bg-white text-black border-black hover:bg-black hover:text-white'
                                    }`}
                            >
                                {grade.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side: Large Hero Image (phot.png) */}
            <div className="w-full lg:w-1/2 relative">
                <div className="relative z-10 w-full aspect-square rounded-[3rem] overflow-hidden border-[12px] border-white shadow-2xl">
                    <img 
                        src="/photo.png" 
                        alt="Laboratory Experience" 
                        className="w-full h-full object-cover"
                    />
                </div>
                {/* Decorative Element behind image */}
                <div className="absolute -bottom-6 -right-6 w-full h-full bg-rose-500/10 rounded-[3rem] -z-10"></div>
            </div>
        </div>
    </main>
</div>
    );
}


