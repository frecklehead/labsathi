"use client"

import React from "react"

interface DraggableProps {
    id: string;
    type: string;
    children: React.ReactNode;
    className?: string;
    onDragStart?: (e: React.DragEvent, id: string, type: string) => void;
}


export function Draggable({ id, type, children, className = "", onDragStart }: DraggableProps) {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("application/json", JSON.stringify({ id, type }));
        e.dataTransfer.effectAllowed = "copyMove";
        if (onDragStart) onDragStart(e, id, type);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className={`cursor-grab active:cursor-grabbing ${className}`}
        >
            {children}
        </div>
    );
}