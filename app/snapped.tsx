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
    onDelete?: (id: string) => void;
    onHover?: (isHovered: boolean) => void;
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
    onDelete,
    onHover,
    className = "",
    isStatic = false
}: DraggableLabObjectProps) {
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const [potentialSnapTarget, setPotentialSnapTarget] = useState<SnapTarget | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Diff between pointer and top-left corner
    const dragOffset = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (onHover) onHover(isHovered);
    }, [isHovered, onHover]);

    useEffect(() => {
        setPosition({ x: initialX, y: initialY });
    }, [initialX, initialY]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isStatic) return; // Don't drag static items (use a different mechanism for shelf?)

        // Check if we are clicking on an interactive child (marked with 'no-drag')
        if ((e.target as Element).closest('.no-drag')) {
            return;
        }

        // Also check if clicking on input/select/button elements to avoid dragging
        const targetTagName = (e.target as Element).tagName.toLowerCase();
        if (['input', 'select', 'button', 'textarea'].includes(targetTagName)) {
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
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            // style={{ transform: `translate(${position.x}px, ${position.y}px)` }} 
            // ^ Better for performance, but mixing absolute left/top is easier for simple logic
            style={{
                position: "absolute",
                left: position.x,
                top: position.y,
                touchAction: "none", // Critical for pointer events on touch devices
                zIndex: isDragging ? 100 : 10
            }}
            className={`cursor-grab group ${isDragging ? "cursor-grabbing scale-105" : ""} transition-transform ${className}`}
        >
            {/* Visual Snap Indicator */}
            {potentialSnapTarget && isDragging && (
                <div className="absolute -inset-4 border-2 border-green-400 rounded-full animate-pulse pointer-events-none"></div>
            )}

            {/* Delete Button (visible on hover) */}
            {isHovered && onDelete && !isDragging && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDelete(id);
                    }}
                    className="absolute -top-2 -right-2 z-50 w-5 h-5 rounded-full flex items-center justify-center no-drag transition-all bg-gray-600/20 text-white/40 hover:bg-red-500 hover:text-white border border-white/10 hover:border-red-400 backdrop-blur-sm"
                    title="Delete Item"
                >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            )}

            {children}

            {/* Move Handle specifically? No, user wants elements moveable. This wrapper makes them moveable already. */}
        </div>
    );
}
