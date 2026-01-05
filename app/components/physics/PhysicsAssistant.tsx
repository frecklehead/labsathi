"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, ChevronUp, ChevronDown, RefreshCw, MessageSquare } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function PhysicsAssistant() {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // Default closed
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

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
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

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

    return (
        <>
            {/* Toggle Button - Bottom Left */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-[60] w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]
                    ${isOpen
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 rotate-180'
                        : 'bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 hover:scale-105'
                    } border border-white/20`}
            >
                {isOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </button>

            {/* Floating Window */}
            <div
                className={`fixed z-[50] transition-all duration-500 ease-spring ${isOpen
                    ? 'bottom-20 right-6 opacity-100 translate-y-0 scale-100'
                    : 'bottom-6 right-6 opacity-0 translate-y-10 scale-95 pointer-events-none'
                    }`}
            >
                <div className="w-[400px] h-[600px] bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                <Sparkles className="w-4 h-4 text-purple-300" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-wide">Physics Assistant</h3>
                                <p className="text-[10px] text-white/50 font-medium tracking-wider uppercase">AI Power • Gemini 1.5</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-50">
                                <div className="p-4 rounded-full bg-white/5 mb-4">
                                    <MessageSquare className="w-8 h-8 text-white/40" />
                                </div>
                                <h4 className="text-white font-medium mb-1">How can I help you?</h4>
                                <p className="text-xs text-white/40 leading-relaxed max-w-[200px]">
                                    Ask about formulas, concepts, or experiments using natural language.
                                </p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-purple-600 text-white rounded-br-none'
                                    : 'bg-white/10 text-slate-100 backdrop-blur-md border border-white/10 rounded-bl-none'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                                components={{
                                                    h2: ({ node, ...props }) => <h2 className="text-xs font-black uppercase tracking-widest text-purple-300 mt-4 mb-2" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-slate-200" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 mb-2 text-slate-300" {...props} />,
                                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                    code: ({ node, className, children, ...props }) => {
                                                        const match = /language-(\w+)/.exec(className || '')
                                                        return !Number(match) ? (
                                                            <code className="bg-black/30 px-1 py-0.5 rounded text-purple-200 font-mono text-xs" {...props}>
                                                                {children}
                                                            </code>
                                                        ) : (
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    }
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-bl-none border border-white/10 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-black/20 backdrop-blur-md border-t border-white/5">
                        <form onSubmit={handleSubmit} className="relative group">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask a physics question..."
                                className="w-full bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl pl-4 pr-12 py-3.5 border border-white/10 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all placeholder:text-white/30 backdrop-blur-sm"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !query.trim()}
                                className="absolute right-2 top-2 p-1.5 bg-purple-500 hover:bg-purple-600 rounded-lg text-white disabled:opacity-50 disabled:bg-transparent transition-all shadow-lg shadow-purple-900/20"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
