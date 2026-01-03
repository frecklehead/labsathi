"use client";

import React, { useState, useRef, useEffect } from "react";

export interface SnapTarget {
    id: string;
    x: number;
    y: number;
    radius: number; // snap distance
    validTypes: string[]; // types that can snap here
}
interface DraggableLabObjectProps {
    id: string;
    type: string;
    initialX: number;
    initialY: number;
    children: React.ReactNode;
    snapTargets: SnapTarget[];
    onPositionChange: (id: string, x: number, y: number, snappedToId: string | null) => void;
    className?: string;
    isStatic?: boolean; // Sidebar items are static until dragged? Or strictly for workbench items?
}



export function DraggableLabObject({
    id,
    type,
    initialX,
    initialY,
    children,
    snapTargets,
    onPositionChange,
    className = "",
    isStatic = false
}: DraggableLabObjectProps) {
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const [potentialSnapTarget, setPotentialSnapTarget] = useState<SnapTarget | null>(null);

    // Diff between pointer and top-left corner
    const dragOffset = useRef({ x: 0, y: 0 });

    useEffect(() => {
        setPosition({ x: initialX, y: initialY });
    }, [initialX, initialY]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isStatic) return; // Don't drag static items (use a different mechanism for shelf?)

        // Check if we are clicking on an interactive child (marked with 'no-drag')
        if ((e.target as Element).closest('.no-drag')) {
            return;
        }

        e.preventDefault(); // Prevent text selection etc.
        e.stopPropagation();

        // Capture pointer
        (e.target as Element).setPointerCapture(e.pointerId);

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        // We need parent's rect to convert to local coords.
        const parent = (e.currentTarget as HTMLElement).offsetParent as HTMLElement;
        if (!parent) return;

        const parentRect = parent.getBoundingClientRect();

        const localPointerX = e.clientX - parentRect.left;
        const localPointerY = e.clientY - parentRect.top;

        dragOffset.current = {
            x: localPointerX - position.x,
            y: localPointerY - position.y
        };

        setIsDragging(true);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();

        const parent = (e.currentTarget as HTMLElement).offsetParent as HTMLElement;
        if (!parent) return;
        const parentRect = parent.getBoundingClientRect();

        const rawX = e.clientX - parentRect.left - dragOffset.current.x;
        const rawY = e.clientY - parentRect.top - dragOffset.current.y;

        let nextX = rawX;
        let nextY = rawY;
        let foundTarget: SnapTarget | null = null;

        // Check Snapping

        for (const target of snapTargets) {
            if (!target.validTypes.includes(type)) continue;

            const dist = Math.sqrt(Math.pow(target.x - rawX, 2) + Math.pow(target.y - rawY, 2));
            if (dist <= target.radius) {
                foundTarget = target;
                // Visual Snap hint? (e.g. ghost opacity)

                if (dist < target.radius * 0.5) { // Strong snap
                    // nextX = target.x;
                    // nextY = target.y;
                }
                break;
            }
        }

        setPotentialSnapTarget(foundTarget);
        setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        (e.target as Element).releasePointerCapture(e.pointerId);

        setIsDragging(false);

        // Apply Snap
        let finalX = position.x;
        let finalY = position.y;
        let snappedId = null;

        if (potentialSnapTarget) {
            finalX = potentialSnapTarget.x;
            finalY = potentialSnapTarget.y;
            snappedId = potentialSnapTarget.id;
        }

        // Notify Parent
        onPositionChange(id, finalX, finalY, snappedId);
        setPotentialSnapTarget(null);
    };

    return (
        <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            // style={{ transform: `translate(${position.x}px, ${position.y}px)` }} 
            // ^ Better for performance, but mixing absolute left/top is easier for simple logic
            style={{
                position: "absolute",
                left: position.x,
                top: position.y,
                touchAction: "none", // Critical for pointer events on touch devices
                zIndex: isDragging ? 100 : 10
            }}
            className={`cursor-grab ${isDragging ? "cursor-grabbing scale-105" : ""} transition-transform ${className}`}
        >
            {/* Visual Snap Indicator */}
            {potentialSnapTarget && isDragging && (
                <div className="absolute -inset-4 border-2 border-green-400 rounded-full animate-pulse pointer-events-none"></div>
            )}

            {children}
        </div>
    );
}
