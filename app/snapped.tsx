"use client";

import React, { useState } from "react";
import { motion, useDragControls, AnimatePresence, PanInfo } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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
    isStatic?: boolean;
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
    const [isDragging, setIsDragging] = useState(false);
    const [snapIndicator, setSnapIndicator] = useState<SnapTarget | null>(null);
    const controls = useDragControls();

    // Calculate snap on drag end
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false);
        setSnapIndicator(null);

        // Calculate final position based on drag delta
        const currentX = initialX + info.offset.x;
        const currentY = initialY + info.offset.y;

        let bestTarget: SnapTarget | null = null;
        let minDist = Infinity;

        // Check for snap targets
        for (const target of snapTargets) {
            if (!target.validTypes.includes(type)) continue;

            const dist = Math.sqrt(
                Math.pow(target.x - currentX, 2) + 
                Math.pow(target.y - currentY, 2)
            );

            if (dist <= target.radius && dist < minDist) {
                minDist = dist;
                bestTarget = target;
            }
        }

        if (bestTarget) {
            onPositionChange(id, bestTarget.x, bestTarget.y, bestTarget.id);
        } else {
            onPositionChange(id, currentX, currentY, null);
        }
    };

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const currentX = initialX + info.offset.x;
        const currentY = initialY + info.offset.y;

        let bestTarget: SnapTarget | null = null;
        let minDist = Infinity;

        for (const target of snapTargets) {
            if (!target.validTypes.includes(type)) continue;
            const dist = Math.sqrt(Math.pow(target.x - currentX, 2) + Math.pow(target.y - currentY, 2));
            if (dist <= target.radius && dist < minDist) {
                minDist = dist;
                bestTarget = target;
            }
        }
        setSnapIndicator(bestTarget);
    };

    return (
        <>
            {/* Ghost / Snap Indicator when dragging */}
            <AnimatePresence>
                {isDragging && snapIndicator && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            x: snapIndicator.x, 
                            y: snapIndicator.y 
                        }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-4 border-cyan-400 bg-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.5)] pointer-events-none z-0"
                    />
                )}
            </AnimatePresence>

            <motion.div
                drag={!isStatic}
                dragControls={controls}
                dragMomentum={false} // Disable momentum for precise lab placement
                dragElastic={0.1} // Slight elasticity
                onDragStart={() => setIsDragging(true)}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                layout // Animate layout changes (snapping)
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                initial={{ x: initialX, y: initialY }}
                animate={{ x: initialX, y: initialY, scale: isDragging ? 1.05 : 1, zIndex: isDragging ? 50 : 10 }}
                whileHover={{ scale: isDragging ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "absolute touch-none cursor-grab active:cursor-grabbing",
                    className
                )}
                // We use animate x/y instead of style left/top for smoother performance
                // But since we track "initialX" as the state-of-truth from parent, we need to sync.
                // Framer's `drag` uses transform. When we update parent state, `initialX` changes.
                // `animate` prop will handle the transition to the new `initialX`.
                // However, `drag` keeps its own offset state. We need to reset it?
                // Actually, relying on `layout` + `animate` is tricky with `drag`.
                // Better approach: Let `drag` be uncontrolled visually, then snap back or to new pos via `animate`.
                // When `initialX` changes, `animate` takes over.
            >
                {children}
            </motion.div>
        </>
    );
}
