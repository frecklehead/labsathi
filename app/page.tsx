import React from "react";
import Link from "next/link";
import { Beaker } from "lucide-react";

export default function Dashboard() {
    return (
        <main className="min-h-screen bg-[#1e1e1e] text-gray-200 font-sans p-8">
            <header className="mb-12 border-b border-[#3e3e3e] pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">L</div>
                    <h1 className="text-3xl font-bold tracking-tight">LabSathi Dashboard</h1>
                </div>
                <p className="mt-2 text-gray-400">Select an experiment to begin.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Titration Card */}
                <div className="bg-[#2a2a2a] border border-[#3e3e3e] rounded-xl p-6 hover:border-pink-500/50 transition-all duration-300 shadow-xl group cursor-pointer hover:-translate-y-1">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mb-4 text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                        <Beaker size={24} />
                    </div>
                    <h2 className="text-xl font-bold mb-2 group-hover:text-pink-400 transition-colors">Titration Lab</h2>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        Perform Acid-Base titration. Use indicators, burettes, and flasks to determine unknown concentrations. Includes AI assistant guidance.
                    </p>
                    <Link
                        href="/titration"
                        className="inline-block w-full py-2.5 text-center bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-pink-900/20"
                    >
                        Launch Experiment
                    </Link>
                </div>

                {/* Placeholder Card */}
                <div className="bg-[#2a2a2a] border border-[#3e3e3e] rounded-xl p-6 opacity-50 cursor-not-allowed grayscale">
                    <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mb-4 text-gray-500">
                        <span className="text-xl font-bold">?</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-gray-500">Coming Soon</h2>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        More experiments like Organic Synthesis and salt analysis are under development.
                    </p>
                    <button disabled className="w-full py-2.5 bg-[#3e3e3e] text-gray-500 rounded-lg font-medium cursor-not-allowed">
                        Locked
                    </button>
                </div>
            </div>
        </main>
    );
}