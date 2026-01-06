import { PhysicsItem, Wire, Terminal } from '../types/circuit.types';

export const getTerminals = (item: PhysicsItem): Terminal[] => {
    const baseOffsets: { [key: string]: { name: string; dx: number; dy: number }[] } = {
        battery: [
            { name: 'positive', dx: 64, dy: 7 },
            { name: 'negative', dx: 64, dy: 93 }
        ],
        resistor: [
            { name: 'left', dx: 0, dy: 25 },
            { name: 'right', dx: 140, dy: 25 }
        ],
        ammeter: [
            { name: 'in', dx: 6, dy: 64 },
            { name: 'out', dx: 106, dy: 64 }
        ],
        voltmeter: [
            { name: 'positive', dx: 106, dy: 64 },
            { name: 'negative', dx: 6, dy: 64 }
        ],
        galvanometer: [
            { name: "positive", dx: 6, dy: 72 },
            { name: "negative", dx: 122, dy: 72 },
        ],
        rheostat: [
            { name: "A", dx: 35, dy: 84 },
            { name: "B", dx: 205, dy: 84 },
            { name: "C", dx: 185, dy: 26 },
        ],
        resistance_box: [
            { name: "left", dx: 12, dy: 80 },
            { name: "right", dx: 288, dy: 80 },
        ],
    };

    const offsets = baseOffsets[item.type] || [];
    return offsets.map(offset => ({
        id: `${item.id}-${offset.name}`,
        itemId: item.id,
        name: offset.name,
        x: item.x + offset.dx,
        y: item.y + offset.dy
    }));
};

export const getAllTerminals = (items: PhysicsItem[]): Terminal[] => {
    return items.flatMap(item => getTerminals(item));
};

export const isCircuitProperlyWired = (items: PhysicsItem[], wires: Wire[]): boolean => {
    const battery = items.find(item => item.type === 'battery');
    const galvanometer = items.find(item => item.type === 'galvanometer');
    const ammeter = items.find(item => item.type === 'ammeter');

    if (!battery || (!galvanometer && !ammeter)) return false;
    return wires.length >= 2;
};

export const isTerminalConnected = (wire: Wire, terminal: Terminal): boolean => {
    return (wire.from.itemId === terminal.itemId && wire.from.terminal === terminal.name) ||
        (wire.to.itemId === terminal.itemId && wire.to.terminal === terminal.name);
};

export const findConnectedComponent = (
    wire: Wire,
    excludeItem: PhysicsItem,
    allItems: PhysicsItem[]
): PhysicsItem | null => {
    let targetItemId: string | null = null;
    if (wire.from.itemId === excludeItem.id) targetItemId = wire.to.itemId;
    else if (wire.to.itemId === excludeItem.id) targetItemId = wire.from.itemId;

    if (targetItemId) {
        return allItems.find(i => i.id === targetItemId) || null;
    }
    return null;
};

export const findDirectlyConnectedItems = (
    item: PhysicsItem,
    wires: Wire[],
    exclude: PhysicsItem,
    allItems: PhysicsItem[]
): PhysicsItem[] => {
    const connectedItems: PhysicsItem[] = [];
    wires.forEach(wire => {
        let partnerId: string | null = null;
        if (wire.from.itemId === item.id) partnerId = wire.to.itemId;
        else if (wire.to.itemId === item.id) partnerId = wire.from.itemId;

        if (partnerId && partnerId !== exclude.id) {
            const partner = allItems.find(i => i.id === partnerId);
            if (partner && !connectedItems.includes(partner)) {
                connectedItems.push(partner);
            }
        }
    });
    return connectedItems;
};
// Helper: Detect if components are in series
export const isSeriesConnection = (items: PhysicsItem[], wires: Wire[]): boolean => {
    if (wires.length < 3) return false;
    
    // Count connections per item
    const connectionCount = new Map<string, number>();
    wires.forEach(w => {
        connectionCount.set(w.from.itemId, (connectionCount.get(w.from.itemId) || 0) + 1);
        connectionCount.set(w.to.itemId, (connectionCount.get(w.to.itemId) || 0) + 1);
    });
    
    // In series, most items should have exactly 2 connections
    const seriesCount = Array.from(connectionCount.values()).filter(count => count === 2).length;
    return seriesCount >= Math.max(2, items.length - 2);
};

// Helper: Detect if two specific components are in parallel
export const isParallelConnection = (items: PhysicsItem[], wires: Wire[], type1: string, type2: string): boolean => {
    const item1 = items.find(i => i.type === type1);
    const item2 = items.find(i => i.type === type2);
    if (!item1 || !item2) return false;
    
    const item1Wires = wires.filter(w => w.from.itemId === item1.id || w.to.itemId === item1.id);
    const item2Wires = wires.filter(w => w.from.itemId === item2.id || w.to.itemId === item2.id);

    if (item1Wires.length < 2 || item2Wires.length < 2) return false;

    // A more robust check: do they share at least two electrical nodes?
    // We'll simplify: items are in parallel if their terminals are connected to each other's terminals
    const sharedNodes = item1Wires.filter(w1 => {
        const otherEnd = w1.from.itemId === item1.id ? w1.to : w1.from;
        return item2Wires.some(w2 => {
            const end2 = w2.from.itemId === item2.id ? w2.to : w2.from;
            return end2.itemId === otherEnd.itemId && end2.terminal === otherEnd.terminal;
        }) || (otherEnd.itemId === item2.id);
    });

    return sharedNodes.length >= 2;
};

// Specific check for Step 7: Voltmeter across G + R
export const isVoltmeterCorrectlyPlaced = (items: PhysicsItem[], wires: Wire[]): boolean => {
    const volt = items.find(i => i.type === 'voltmeter');
    const galva = items.find(i => i.type === 'galvanometer');
    const resBox = items.find(i => i.type === 'resistance_box');

    if (!volt || !galva || !resBox) return false;

    // Voltmeter positive should be at Galvanometer positive
    const posCorrect = wires.some(w => 
        (w.from.itemId === volt.id && w.from.terminal === 'positive' && w.to.itemId === galva.id && w.to.terminal === 'positive') ||
        (w.to.itemId === volt.id && w.to.terminal === 'positive' && w.from.itemId === galva.id && w.from.terminal === 'positive')
    );

    // Voltmeter negative should be at ResistanceBox right
    const negCorrect = wires.some(w => 
        (w.from.itemId === volt.id && w.from.terminal === 'negative' && w.to.itemId === resBox.id && w.to.terminal === 'right') ||
        (w.to.itemId === volt.id && w.to.terminal === 'negative' && w.from.itemId === resBox.id && w.from.terminal === 'right')
    );

    return posCorrect && negCorrect;
};

// Helper: Check if resistance box is accidentally in parallel with galvanometer
export const detectParallelResistorError = (items: PhysicsItem[], wires: Wire[]): boolean => {
    const galva = items.find(i => i.type === 'galvanometer');
    const resBox = items.find(i => i.type === 'resistance_box');
    if (!galva || !resBox) return false;
    
    // If voltmeter is not here, checking for simple parallel
    const galvaWires = wires.filter(w => w.from.itemId === galva.id || w.to.itemId === galva.id);
    const resBoxWires = wires.filter(w => w.from.itemId === resBox.id || w.to.itemId === resBox.id);
    
    // Sharing terminals on both sides
    const sharing1 = wires.some(w => 
        (w.from.itemId === galva.id && w.from.terminal === 'positive' && w.to.itemId === resBox.id && w.to.terminal === 'left') ||
        (w.to.itemId === galva.id && w.to.terminal === 'positive' && w.from.itemId === resBox.id && w.from.terminal === 'left')
    );
    const sharing2 = wires.some(w => 
        (w.from.itemId === galva.id && w.from.terminal === 'negative' && w.to.itemId === resBox.id && w.to.terminal === 'right') ||
        (w.to.itemId === galva.id && w.to.terminal === 'negative' && w.from.itemId === resBox.id && w.from.terminal === 'right')
    );

    return sharing1 && sharing2;
};
