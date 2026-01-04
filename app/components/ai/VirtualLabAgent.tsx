'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Lightbulb, X, HelpCircle, Beaker, MessageSquare, Send, Loader2, Info, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LabIssue {
    type: 'error' | 'warning' | 'safety' | 'tip';
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    suggestion: string;
    concept?: string;
}

interface VirtualLabAgentProps {
    currentStep: number;
    studentActions: any[];
    conversationHistory: any[];
    studentLevel?: 'beginner' | 'intermediate' | 'advanced';
    onSendMessage: (msg: string) => void;
    isLoading?: boolean;
    prediction?: string;
    issues?: LabIssue[];
    agentResponse?: string | null;
}

const VirtualLabAgent = ({
    currentStep,
    studentActions,
    conversationHistory,
    studentLevel = 'intermediate',
    onSendMessage,
    isLoading = false,
    prediction,
    issues = [],
    agentResponse
}: VirtualLabAgentProps) => {
    const [question, setQuestion] = useState('');
    const [showQuestionBar, setShowQuestionBar] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [agentResponse, isLoading]);

    const handleQuestionSubmit = () => {
        if (!question.trim() || isLoading) return;
        onSendMessage(question);
        setQuestion('');
    };

    const currentIssue = issues.length > 0 ? issues[0] : null;

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 w-96 shadow-2xl relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]"></div>

            {/* Header */}
            <div className="relative z-10 bg-slate-800/80 backdrop-blur-md px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <Beaker className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-100 tracking-tight">LabMate Assistant</h1>
                        <div className="flex items-center gap-1.5">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Monitor</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowQuestionBar(true)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600"
                    title="Ask Question"
                >
                    <HelpCircle className="w-4 h-4 text-slate-300" />
                </button>
            </div>

            {/* Main Content Feed */}
            <div className="relative z-10 flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4" ref={scrollRef}>

                {/* Status Indicators */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Experiment Step</p>
                        <p className="text-xs font-bold text-indigo-400">Step {currentStep} of 4</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Teaching Level</p>
                        <p className="text-xs font-bold text-emerald-400 capitalize">{studentLevel}</p>
                    </div>
                </div>

                <AnimatePresence mode='popLayout'>
                    {/* AI Response Card */}
                    {agentResponse && !isLoading && (
                        <motion.div
                            key="agent-response"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-2xl p-4 shadow-xl border ${currentIssue?.type === 'error' ? 'bg-amber-950/20 border-amber-500/30' : 'bg-indigo-950/20 border-indigo-500/30'}`}
                        >
                            <div className="flex gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${currentIssue?.type === 'error' ? 'bg-amber-500/20' : 'bg-indigo-500/20'}`}>
                                    {currentIssue?.type === 'error' ? <AlertCircle className="w-4 h-4 text-amber-500" /> : <Lightbulb className="w-4 h-4 text-indigo-400" />}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${currentIssue?.type === 'error' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                            {currentIssue?.concept || 'AI Instructor'}
                                        </span>
                                    </div>
                                    <p className="text-slate-200 text-xs leading-relaxed font-medium">
                                        {agentResponse}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Loader */}
                    {isLoading && (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30"
                        >
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                            <p className="text-xs text-slate-400 font-medium">LabMate is analyzing...</p>
                        </motion.div>
                    )}

                    {/* Critical Prediction / Next Step */}
                    {(prediction || (currentIssue && currentIssue.suggestion)) && (
                        <motion.div
                            key="prediction"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/50 shadow-inner"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                                    <Info className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Adaptive Insight</h4>
                                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium italic">
                                        "{prediction || currentIssue?.suggestion}"
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Log Snapshot */}
                {studentActions.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-700/30">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Recent Actions</h3>
                        </div>
                        <div className="space-y-2">
                            {studentActions.slice(-3).reverse().map((action, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/30">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                            S{action.step}
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-300 capitalize">{action.action.replace('_', ' ')}</span>
                                    </div>
                                    <span className="text-[11px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded group-hover:bg-indigo-500/20 transition-colors">
                                        {action.value}{action.unit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="relative z-10 p-4 bg-slate-800/80 border-t border-slate-700 backdrop-blur-xl">
                <div className="relative group">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuestionSubmit()}
                        placeholder="Ask LabMate a question..."
                        disabled={isLoading}
                        className="w-full bg-slate-900 border border-slate-700 rounded-full py-2.5 pl-4 pr-12 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <button
                        onClick={handleQuestionSubmit}
                        disabled={!question.trim() || isLoading}
                        className="absolute right-1.5 top-1.5 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 transition-all active:scale-90 shadow-lg shadow-indigo-600/20"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </button>
                </div>
            </div>

            {/* Floating Question Sidebar Overlay */}
            <AnimatePresence>
                {showQuestionBar && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10"
                        >
                            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
                                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                                    Guide Library
                                </h3>
                                <button onClick={() => setShowQuestionBar(false)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Suggested Questions</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        "Why use H₂SO₄ instead of HCl?",
                                        "What is a self-indicator?",
                                        "How to calculate Molarity?",
                                        "Why heat to 60°C precisely?"
                                    ].map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => { setQuestion(q); setShowQuestionBar(false); onSendMessage(q); }}
                                            className="w-full text-left p-3 text-xs font-semibold text-slate-300 bg-slate-700/50 border border-slate-700 rounded-xl hover:border-indigo-500 hover:text-indigo-400 transition-all hover:bg-indigo-500/5"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
        </div>
    );
};

export default VirtualLabAgent;
