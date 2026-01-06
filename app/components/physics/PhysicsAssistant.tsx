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
}

interface PhysicsAssistantProps {
    currentStep?: number;
    workbenchItems?: Array<{ type: string; id: string; props: any }>;
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
                { role: "assistant", content: data.reply },
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

    return (
        <>
            {messages.length > 0 && (
                <div className="fixed top-24 right-8 z-40 w-[420px] max-h-[calc(100vh-280px)] overflow-y-auto pointer-events-none space-y-4 pb-4">
                    <style jsx global>{`
                        .assistant-messages::-webkit-scrollbar { width: 6px; }
                        .assistant-messages::-webkit-scrollbar-track { background: transparent; }
                        .assistant-messages::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 3px; }
                    `}</style>
                    <div className="assistant-messages space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-500 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed shadow-xl ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-md' : 'bg-white/95 text-slate-800 border-2 border-slate-200 rounded-tl-md'}`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm max-w-none prose-headings:text-blue-900 prose-p:text-slate-700">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                                components={{
                                                    h2: ({ node, ...props }) => <h2 className="text-xs font-black uppercase tracking-widest text-blue-600 mt-2 mb-2 border-b border-slate-200 pb-1" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-slate-700 leading-relaxed" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 mb-2 text-slate-700 marker:text-blue-500" {...props} />,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="font-medium">{msg.content}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start pointer-events-auto">
                                <div className="bg-white/95 border-2 border-slate-200 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            <div className="fixed bottom-6 right-8 z-50 w-[500px]">
                <div className="relative">


                    {messages.length === 0 && (
                        <div className="absolute -top-20 left-0 right-0 flex gap-2 justify-center">
                            {getQuickActions().map((action, idx) => (
                                <button key={idx} onClick={() => setQuery(action)} className="px-3 py-1.5 bg-white/95 border border-blue-200 rounded-full text-xs text-blue-700 font-medium">
                                    {action}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask about circuits, formulas, or concepts..."
                            className="w-full bg-white/95 text-slate-900 text-sm rounded-2xl pl-5 pr-14 py-4 border-2 border-slate-200 focus:outline-none focus:border-blue-500 shadow-xl"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !query.trim()} className="absolute right-2 top-2 p-2.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl text-white shadow-lg">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>

                    {messages.length > 0 && (
                        <button onClick={() => setMessages([])} className="absolute -top-12 right-0 p-2 bg-red-500 text-white rounded-full shadow-lg">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}