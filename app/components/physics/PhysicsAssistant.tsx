"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

interface Message {
    role: "user" | "assistant";
    content: string;
    focusComponent?: string;
}

interface PhysicsAssistantProps {
    currentStep?: number;
    workbenchItems?: Array<{ type: string; id: string; x: number; y: number; props: any }>;
    wires?: Array<any>;
    circuitRisks?: string[];
    experimentData?: {
        vSource: number;
        gRes: number;
        rSeries: number;
        current: number;
        convertedRange: number;
    };
}

export function PhysicsAssistant({
    currentStep = 0,
    workbenchItems = [],
    wires = [],
    circuitRisks = [],
    experimentData
}: PhysicsAssistantProps) {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const buildContext = () => {
        const hasComponents = workbenchItems.length > 0;
        const components = workbenchItems.map(item => item.type);

        const hasBattery = components.includes('battery');
        const hasGalvanometer = components.includes('galvanometer');
        const hasResistanceBox = components.includes('resistance_box');
        const hasRheostat = components.includes('rheostat');
        const hasVoltmeter = components.includes('voltmeter');

        let context = `\n\nCURRENT LAB STATE:\n`;
        context += `Step: ${currentStep + 1} of 5\n`;

        if (hasComponents) {
            context += `Components on workbench: ${components.join(', ')}\n`;
            context += `Wired connections: ${wires.length}\n`;
        } else {
            context += `Workbench is empty\n`;
        }

        if (circuitRisks.length > 0) {
            context += `⚠️ Circuit Issues: ${circuitRisks[0]}\n`;
        }

        if (experimentData) {
            context += `\nCircuit Values:\n`;
            context += `- Battery: ${experimentData.vSource}V\n`;
            context += `- Galvanometer resistance (G): ${experimentData.gRes}Ω\n`;
            context += `- Series resistance (R): ${experimentData.rSeries}Ω\n`;
            context += `- Current: ${experimentData.current.toFixed(2)}mA\n`;
            context += `- Converted range: ${experimentData.convertedRange.toFixed(2)}V\n`;
        }

        if (!hasComponents) {
            context += `\nNEXT ACTION: Drag components from sidebar to workbench\n`;
        } else if (!hasBattery || !hasGalvanometer || !hasResistanceBox || !hasRheostat) {
            context += `\nNEXT ACTION: Add missing components (need Battery, Galvanometer, Resistance Box, Rheostat)\n`;
        } else if (wires.length < 3) {
            context += `\nNEXT ACTION: Wire components in series (click terminals to connect)\n`;
        } else if (!hasVoltmeter) {
            context += `\nNEXT ACTION: Add Voltmeter for verification\n`;
        } else if (hasVoltmeter && circuitRisks.length > 0) {
            context += `\nNEXT ACTION: Fix circuit issue - Voltmeter should be in PARALLEL\n`;
        } else {
            context += `\nNEXT ACTION: Vary Rheostat and record readings\n`;
        }

        return context;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        const userMessage = query.trim();
        setQuery("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);
        // Hide history when asking new question to make room for contextual answer
        setShowHistory(false);

        try {
            const res = await fetch("/api/physics-assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    context: buildContext()
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: data.reply,
                    focusComponent: data.focusComponent
                },
            ]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I encountered an error connecting to the Physics Assistant." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const getQuickActions = () => {
        if (workbenchItems.length === 0) {
            return ["How do I start?", "What components do I need?"];
        }
        if (circuitRisks.length > 0) {
            return ["What's wrong with my circuit?", "How do I fix this?"];
        }
        if (wires.length < 3) {
            return ["How do I wire the circuit?", "What connects where?"];
        }
        return ["What should I do next?", "Explain the formula"];
    };

    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();

    // Contextual bubble logic
    const renderContextualBubble = () => {
        if (!lastAssistantMessage || !lastAssistantMessage.focusComponent || lastAssistantMessage.focusComponent === 'none' || showHistory) return null;

        const target = workbenchItems.find(item => item.type === lastAssistantMessage.focusComponent);
        if (!target) return null;

        return (
            <div
                className="absolute z-[100] animate-in zoom-in-95 fade-in duration-300 pointer-events-auto"
                style={{
                    left: `${target.x + 50}px`,
                    top: `${target.y - 120}px`,
                    transform: 'translateX(-50%)'
                }}
            >
                <div className="bg-white/95 text-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-200/50 max-w-[300px] backdrop-blur-sm relative">
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45 border-r border-b border-slate-200/50" />
                    <div className="prose prose-sm max-w-none prose-headings:text-black prose-p:text-slate-700">
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                                h2: ({ node, ...props }) => <h2 className="text-[10px] font-black uppercase tracking-widest text-black mt-2 mb-2 border-b border-slate-100 pb-1" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-1 last:mb-0 text-slate-700 leading-relaxed text-xs" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-0.5 mb-1 text-slate-700 marker:text-black text-xs" {...props} />,
                            }}
                        >
                            {lastAssistantMessage.content}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Contextual Bubbles area */}
            <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                <div className="relative w-full h-full">
                    {renderContextualBubble()}
                </div>
            </div>

            <div className="absolute bottom-6 right-8 z-50 w-[500px] flex flex-col gap-4 pointer-events-none">
                {/* Messages Area (History) */}
                {showHistory && messages.length > 0 && (
                    <div className="flex flex-col gap-3 assistant-messages max-h-[calc(100vh-250px)] overflow-y-auto pr-2 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <style jsx global>{`
                            .assistant-messages::-webkit-scrollbar { width: 4px; }
                            .assistant-messages::-webkit-scrollbar-track { background: transparent; }
                            .assistant-messages::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 2px; }
                        `}</style>

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'user' ? (
                                    <div className="bg-black text-white text-[10px] font-medium px-3 py-1.5 rounded-full shadow-md border border-white/10 max-w-[80%]">
                                        {msg.content}
                                    </div>
                                ) : (
                                    <div className="bg-white/95 text-slate-800 p-4 rounded-2xl shadow-xl border border-slate-200/50 max-w-[90%] backdrop-blur-sm">
                                        <div className="prose prose-sm max-w-none prose-headings:text-black prose-p:text-slate-700">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                                components={{
                                                    h2: ({ node, ...props }) => <h2 className="text-xs font-black uppercase tracking-widest text-black mt-2 mb-2 border-b border-slate-100 pb-1" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-slate-700 leading-relaxed" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 mb-2 text-slate-700 marker:text-black" {...props} />,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                <div className="relative pointer-events-auto">
                    {/* Latest User Question Box */}
                    {!showHistory && lastUserMessage && (
                        <div className="flex justify-end mb-2">
                            <div className="bg-black text-white text-[10px] font-medium px-4 py-2 rounded-full shadow-lg border border-white/10 animate-in slide-in-from-right-2 duration-300">
                                {lastUserMessage.content}
                            </div>
                        </div>
                    )}

                    {/* Latest General Assistant Message (if not contextual or history is off) */}
                    {!showHistory && lastAssistantMessage && (!lastAssistantMessage.focusComponent || lastAssistantMessage.focusComponent === 'none') && (
                        <div className="flex justify-start mb-2">
                            <div className="bg-white/95 text-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-200/50 max-w-[90%] backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        p: ({ node, ...props }) => <p className="text-xs text-slate-700 leading-relaxed" {...props} />,
                                    }}
                                >
                                    {lastAssistantMessage.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {messages.length === 0 && (
                        <div className="absolute -top-12 left-0 right-0 flex gap-2 justify-center">
                            {getQuickActions().map((action, idx) => (
                                <button key={idx} onClick={() => setQuery(action)} className="px-3 py-1.5 bg-white/95 border border-slate-200 rounded-full text-[10px] text-slate-600 font-semibold hover:border-black hover:text-black transition-colors shadow-sm">
                                    {action}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="relative mt-2">
                        <input
                            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask about circuits, formulas, or concepts..."
                            className="w-full bg-white/95 text-slate-900 text-sm rounded-2xl pl-5 pr-14 py-4 border-2 border-slate-200 focus:outline-none focus:border-black shadow-xl transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="absolute right-2 top-2 p-2.5 bg-black rounded-xl text-white hover:bg-slate-800 disabled:bg-slate-300 transition-colors shadow-lg"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>

                    {messages.length > 0 && (
                        <div className="absolute -top-3 -right-2 flex gap-1">
                            {!showHistory && (
                                <button
                                    onClick={() => setShowHistory(true)}
                                    className="p-1.5 bg-white text-black text-[10px] font-bold rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors z-10 whitespace-nowrap px-3"
                                >
                                    View History
                                </button>
                            )}
                            <button onClick={() => { setMessages([]); setShowHistory(false); }} className="p-1.5 bg-black text-white rounded-full shadow-lg border-2 border-white hover:bg-red-500 transition-colors z-10" title="Clear Chat">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
