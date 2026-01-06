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
            { name: 'in', dx: 8, dy: 72 },
            { name: 'out', dx: 120, dy: 72 }
        ],
        voltmeter: [
            { name: 'positive', dx: 120, dy: 72 },
            { name: 'negative', dx: 8, dy: 72 }
        ],
        galvanometer: [
            { name: "positive", dx: 8, dy: 96 },
            { name: "negative", dx: 168, dy: 96 },
        ],
        rheostat: [
            { name: "A", dx: 47, dy: 91 },
            { name: "B", dx: 273, dy: 91 },
            { name: "C", dx: 253, dy: 34 },
        ],
        resistance_box: [
            { name: "left", dx: 14, dy: 96 },
            { name: "right", dx: 346, dy: 96 },
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
