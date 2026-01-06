import { PhysicsItem, Wire, Terminal } from '../types/circuit.types';
import { getTerminals, isTerminalConnected, findConnectedComponent, findDirectlyConnectedItems } from './circuitHelpers';

export function checkCircuitRisks(items: PhysicsItem[], wires: Wire[]): string[] {
    const risks: string[] = [];
    const voltmeters = items.filter(item => item.type === 'voltmeter');

    voltmeters.forEach(voltmeter => {
        const voltmeterTerminals = getTerminals(voltmeter);
        const isInSeries = checkIfInSeries(voltmeter, voltmeterTerminals, items, wires);

        if (isInSeries) {
            risks.push('⚠️ RISK: Voltmeter connected in series! This will block current flow and may damage the voltmeter. Voltmeters must be connected in parallel.');
        }
    });

    return risks;
}

function checkIfInSeries(
    voltmeter: PhysicsItem,
    voltmeterTerminals: Terminal[],
    allItems: PhysicsItem[],
    wires: Wire[]
): boolean {
    const positiveTerminal = voltmeterTerminals.find(t => t.name === 'positive');
    const negativeTerminal = voltmeterTerminals.find(t => t.name === 'negative');

    if (!positiveTerminal || !negativeTerminal) return false;

    const positiveWire = wires.find(w => isTerminalConnected(w, positiveTerminal));
    const negativeWire = wires.find(w => isTerminalConnected(w, negativeTerminal));

    if (!positiveWire || !negativeWire) return false;

    const positiveConnectsTo = findConnectedComponent(positiveWire, voltmeter, allItems);
    const negativeConnectsTo = findConnectedComponent(negativeWire, voltmeter, allItems);

    if (positiveConnectsTo && negativeConnectsTo) {
        const isParallel = checkIfParallelConnection(
            voltmeter,
            positiveConnectsTo,
            negativeConnectsTo,
            wires,
            allItems
        );

        return !isParallel;
    }

    return false;
}

function checkIfParallelConnection(
    voltmeter: PhysicsItem,
    component1: PhysicsItem,
    component2: PhysicsItem,
    wires: Wire[],
    allItems: PhysicsItem[]
): boolean {
    if (component1.id === component2.id) return true;
    return checkAlternatePath(component1, component2, voltmeter, wires, allItems);
}

function checkAlternatePath(
    comp1: PhysicsItem,
    comp2: PhysicsItem,
    voltmeter: PhysicsItem,
    wires: Wire[],
    allItems: PhysicsItem[]
): boolean {
    const visited = new Set<string>();
    const queue: PhysicsItem[] = [comp1];
    visited.add(comp1.id);

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.id === comp2.id) return true;

        const connected = findDirectlyConnectedItems(current, wires, voltmeter, allItems);
        for (const item of connected) {
            if (!visited.has(item.id)) {
                visited.add(item.id);
                queue.push(item);
            }
        }
    }
    return false;
}
