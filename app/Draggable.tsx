"use client";

import React, { useRef } from "react";

interface DraggableProps {
    id: string;
    type: string;
    children: React.ReactNode;
    className?: string;
    onDragStart?: (e: React.DragEvent, id: string, type: string) => void;
}

export function Draggable({
    id,
    type,
    children,
    className = "",
    onDragStart
}: DraggableProps) {
    const previewRef = useRef<HTMLDivElement>(null);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData(
            "application/json",
            JSON.stringify({ id, type })
        );
        e.dataTransfer.effectAllowed = "copy";

        // 🔥 Use hidden preview node as drag image
        if (previewRef.current) {
            const rect = previewRef.current.getBoundingClientRect();
            e.dataTransfer.setDragImage(
                previewRef.current,
                rect.width / 2,
                rect.height / 2
            );
        }

        onDragStart?.(e, id, type);
    };

    return (
        <>
            {/* Hidden drag preview */}
            <div
                ref={previewRef}
                className="fixed -top-[1000px] -left-[1000px] pointer-events-none"
            >
                {children}
            </div>

            {/* Visible shelf item */}
            <div
                draggable
                onDragStart={handleDragStart}
                className={`cursor-grab active:cursor-grabbing transition-transform hover:scale-105 ${className}`}
            >
                {children}
            </div>
        </>
    );
}
