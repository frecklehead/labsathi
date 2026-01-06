import { useEffect } from 'react';
import { PhysicsItem, Wire } from '../types/circuit.types';
import { solveCircuitNodal } from '../utils/circuitSolver';

export function useCircuitSolver(
    workbenchItems: PhysicsItem[],
    wires: Wire[],
    setWorkbenchItems: (items: PhysicsItem[]) => void
) {
    useEffect(() => {
        if (workbenchItems.length === 0) return;

        try {
            const updatedItems = solveCircuitNodal(workbenchItems, wires);

            const hasChanged = JSON.stringify(updatedItems) !== JSON.stringify(workbenchItems);
            if (hasChanged) {
                setWorkbenchItems(updatedItems);
            }
        } catch (error) {
            console.error("Circuit solver error:", error);
        }
    }, [wires, workbenchItems, setWorkbenchItems]);
}
