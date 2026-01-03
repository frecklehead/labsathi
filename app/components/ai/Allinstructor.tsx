"use client";
// AI Instructor Component - v2 (Server-side Auth)

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, AlertCircle, User } from "lucide-react";


interface Message {
    role: "user" | "model" | "system";
    content: string;
    timestamp?: number;
}

interface AIInstructorProps {
    messages: Message[];
    onSendMessage: (message: string) => void;
    isLoading?: boolean;
}

export function AIInstructor({ messages, onSendMessage, isLoading = false }: AIInstructorProps) {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input);
        setInput("");
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700 w-80 shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-gradient-to-tr from-blue-500 to-pink-500 rounded-lg">
                        <Bot size={18} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-100">Lab Instructor AI</h3>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Online • Gemini Pro
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center mt-10 opacity-50">
                        <Bot size={32} className="mx-auto text-gray-600 mb-2" />
                        <p className="text-xs text-gray-500">I'm watching your experiment.<br />I'll let you know if I see any issues.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-gradient-to-tr from-blue-600 to-pink-600'
                            }`}>
                            {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                        </div>

                        <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-3 py-2 rounded-lg text-xs leading-relaxed ${msg.role === 'user'
                                ? 'bg-gray-800 text-gray-200 rounded-tr-none'
                                : 'bg-blue-500/10 border border-blue-500/20 text-blue-100 rounded-tl-none'
                                }`}>
                                {msg.content}
                            </div>
                            {msg.role === 'model' && (
                                <span className="text-[9px] text-gray-600 mt-1 ml-1">AI Instructor</span>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-pink-600 flex items-center justify-center shrink-0">
                            <Bot size={12} />
                        </div>
                        <div className="flex items-center gap-1 h-8 px-3 bg-blue-500/10 rounded-lg rounded-tl-none">
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-gray-800 border-t border-gray-700">
                <form onSubmit={handleSubmit} className="relative flex items-center">
                    <input
                        type="text"
                        placeholder="Ask a question..."
                        disabled={isLoading}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-full py-2 pl-4 pr-10 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
                    >
                        <Send size={12} className="text-white ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}