import React from 'react';

interface RiskAlertProps {
    risks: string[];
    onFix: () => void;
}

export default function RiskAlert({ risks, onFix }: RiskAlertProps) {
    if (risks.length === 0) return null;

    return (
               <div
  className="
    fixed top-20 left-1/2 -translate-x-1/2
    z-[999]
    max-w-[90vw]
    pointer-events-none
    animate-in slide-in-from-top-4 fade-in duration-300
  "
>
  <div className="
    bg-red-50/90           /* very soft red background, slightly transparent */
    border border-red-700   /* strong, visible dark red border */
    text-red-800            /* dark red text for contrast */
    px-6 py-4
    rounded-3xl
    shadow-xl
    flex flex-col items-center gap-3
    pointer-events-auto
    min-w-[280px]
  ">
    {/* Header */}
    <div className="flex items-center gap-3">
      <div className="p-2 bg-red-200 rounded-full flex items-center justify-center shadow-sm">
        <svg
          className="w-6 h-6 text-red-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div className="font-bold text-lg text-center">
        {risks[0]}
      </div>
    </div>

    {/* Button */}
    <button
      onClick={onFix}
      className="
        bg-gradient-to-r from-purple-600 to-blue-600
        hover:from-purple-500 hover:to-blue-500
        text-white font-semibold py-2 px-6 rounded-2xl
        shadow-lg transform active:scale-95 transition-all flex items-center gap-2
      "
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      Fix this with AI
    </button>
  </div>
</div>

    );
}
