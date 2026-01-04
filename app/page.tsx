'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Beaker, Zap, GraduationCap, BookOpen, ChevronRight, Atom, FlaskConical, Sparkles, Brain } from 'lucide-react';

export default function Dashboard() {
    const router = useRouter();
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const grades = [
        { id: '11', label: 'Grade 11' },
        { id: '12', label: 'Grade 12' }
    ];

    const subjects = [
        {
            id: 'physics',
            label: 'Physics',
            icon: Zap,
            description: 'Explore the laws of nature, from electricity to mechanics.',
            color: 'from-blue-600 to-cyan-500',
            glow: 'shadow-blue-500/20',
            experiments: [
                { id: 'galvanometer', name: 'Conversion of Galvanometer to Voltmeter', path: '/physics', icon: Zap }
            ]
        },
        {
            id: 'chemistry',
            label: 'Chemistry',
            icon: Beaker,
            description: 'Dive into chemical reactions, titrations, and molecular structures.',
            color: 'from-purple-600 to-pink-500',
            glow: 'shadow-purple-500/20',
            experiments: [
                { id: 'titration', name: 'Acid-Base Titration', path: '/titration', icon: FlaskConical }
            ]
        }
    ];

    const handleExperimentClick = (path: string) => {
        router.push(path);
    };

    const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 overflow-x-hidden relative">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse capitalize" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-cyan-500/5 blur-[80px] rounded-full"></div>

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            </div>

            {/* Navigation / Header */}
            <nav className="relative z-50 border-b border-white/5 bg-slate-950/20 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">LabSathi</span>
                            <div className="h-0.5 w-0 group-hover:w-full bg-blue-500 transition-all duration-300"></div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#" className="hover:text-white transition-colors">Library</a>
                        <a href="#" className="hover:text-white transition-colors">Achievements</a>
                        <a href="#" className="hover:text-white transition-colors">Settings</a>
                        <button className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all">
                            Sign In
                        </button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32">
                {/* Hero Section */}
                <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-6">
                        <Sparkles className="w-3 h-3" />
                        <span>NEXT GENERATION VIRTUAL LABS</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
                        Master Science <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">By Doing.</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-12 font-medium">
                        Immerse yourself in high-fidelity simulations that replicate real-world laboratory physics and chemistry with precision and beauty.
                    </p>
                </div>

                {/* Grade Selection Chips */}
                <div className={`mb-16 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Choose Academic Level</p>
                    <div className="flex gap-4">
                        {grades.map((grade) => (
                            <button
                                key={grade.id}
                                onClick={() => {
                                    setSelectedGrade(grade.id);
                                    setSelectedSubject('');
                                }}
                                className={`px-8 py-4 rounded-2xl border-2 font-bold transition-all duration-300 ${selectedGrade === grade.id
                                    ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                {grade.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subject Selection Grid */}
                {selectedGrade && (
                    <div className="mb-16 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Select Specialization</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {subjects.map((subject) => {
                                const Icon = subject.icon;
                                const isSelected = selectedSubject === subject.id;
                                return (
                                    <button
                                        key={subject.id}
                                        onClick={() => setSelectedSubject(subject.id)}
                                        className={`group relative p-1 rounded-[2rem] transition-all duration-500 overflow-hidden ${isSelected ? 'scale-105' : 'hover:-translate-y-2'
                                            }`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${subject.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                                        <div className={`relative h-full p-8 rounded-[1.9rem] border border-white/5 flex flex-col items-start transition-all duration-500 ${isSelected ? 'bg-slate-900 shadow-2xl scale-[0.98]' : 'bg-slate-900/40 backdrop-blur-xl'
                                            }`}>
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${subject.color} flex items-center justify-center mb-6 shadow-xl ${subject.glow}`}>
                                                <Icon className="w-7 h-7 text-white" />
                                            </div>
                                            <h3 className="text-2xl font-black mb-3">{subject.label}</h3>
                                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                                {subject.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-auto text-xs font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${subject.color}`}></div>
                                                {subject.experiments.length} MODULES
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Experiment List */}
                {selectedSubject && selectedSubjectData && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                            <ChevronRight className="w-4 h-4" />
                            Available Experiments in {selectedSubjectData.label}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedSubjectData.experiments.map((experiment) => {
                                const ExpIcon = experiment.icon;
                                return (
                                    <button
                                        key={experiment.id}
                                        onClick={() => handleExperimentClick(experiment.path)}
                                        className="group flex items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-black"
                                    >
                                        <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${selectedSubjectData.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                            <ExpIcon className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <h4 className="text-lg font-bold group-hover:text-blue-400 transition-colors mb-1">{experiment.name}</h4>
                                            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Core Experiment • 45 Mins</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-110 transition-all">
                                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Initial State / Help Text */}
                {!selectedGrade && (
                    <div className="mt-20 flex flex-col items-center">
                        <div className="p-8 rounded-full bg-white/[0.02] border border-white/5 mb-8 animate-bounce">
                            <GraduationCap className="w-12 h-12 text-slate-700" />
                        </div>
                        <p className="text-slate-500 font-medium">Select your grade level to access curated virtual labs.</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-12 bg-slate-950/20 backdrop-blur-md mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3 opacity-50">
                        <Brain className="w-5 h-5" />
                        <span className="text-sm font-bold">LabSathi &copy; 2026</span>
                    </div>
                    <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <a href="#" className="hover:text-slate-300">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-300">Terms of Service</a>
                        <a href="#" className="hover:text-slate-300">Contact Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}


