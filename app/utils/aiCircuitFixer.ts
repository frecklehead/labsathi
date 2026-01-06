import { PhysicsItem, Wire } from '../types/circuit.types';

export function fixVoltmeterConnection(
    voltmeter: PhysicsItem,
    workbenchItems: PhysicsItem[],
    wires: Wire[]
): Wire[] {
    const galvanometer = workbenchItems.find(i => i.type === "galvanometer");
    const resBox = workbenchItems.find(i => i.type === "resistance_box");
    const rheostat = workbenchItems.find(i => i.type === "rheostat");

    // Remove existing voltmeter wires
    const baseWires = wires.filter(
        w => w.from.itemId !== voltmeter.id && w.to.itemId !== voltmeter.id
    );

    const uid = (suffix: string) =>
        `wire-fix-${Date.now()}-${Math.random().toString(16).slice(2)}-${suffix}`;

    // CASE 1: Galvanometer + Resistance Box (BEST CASE)
    // Connect voltmeter in parallel across the G+R series combination
    if (galvanometer && resBox) {
        const gTerminals = ["positive", "negative"];
        const rTerminals = ["left", "right"];

        // Find which terminals are connected between G and R
        let gConnectedTerm: string | null = null;
        let rConnectedTerm: string | null = null;

        for (const gTerm of gTerminals) {
            for (const rTerm of rTerminals) {
                const isConnected = baseWires.some(w =>
                    (w.from.itemId === galvanometer.id && w.from.terminal === gTerm &&
                        w.to.itemId === resBox.id && w.to.terminal === rTerm) ||
                    (w.to.itemId === galvanometer.id && w.to.terminal === gTerm &&
                        w.from.itemId === resBox.id && w.from.terminal === rTerm)
                );

                if (isConnected) {
                    gConnectedTerm = gTerm;
                    rConnectedTerm = rTerm;
                    break;
                }
            }
            if (gConnectedTerm) break;
        }

        if (gConnectedTerm && rConnectedTerm) {
            // Get the OUTER terminals (opposite to the connected ones)
            const gOuterTerm = gConnectedTerm === "positive" ? "negative" : "positive";
            const rOuterTerm = rConnectedTerm === "left" ? "right" : "left";

            // Connect voltmeter across the outer terminals
            return [
                ...baseWires,
                {
                    id: uid("1"),
                    from: { itemId: voltmeter.id, terminal: "positive" },
                    to: { itemId: galvanometer.id, terminal: gOuterTerm },
                },
                {
                    id: uid("2"),
                    from: { itemId: voltmeter.id, terminal: "negative" },
                    to: { itemId: resBox.id, terminal: rOuterTerm },
                },
            ];
        }

        // FALLBACK: If G and R are not directly connected, find free terminals
        const findFreeTerminal = (itemId: string, terminals: string[], partnerId: string) => {
            for (const term of terminals) {
                const isConnectedToPartner = baseWires.some(w =>
                ((w.from.itemId === itemId && w.from.terminal === term && w.to.itemId === partnerId) ||
                    (w.to.itemId === itemId && w.to.terminal === term && w.from.itemId === partnerId))
                );
                if (!isConnectedToPartner) return term;
            }
            return terminals[0]; // default
        };

        const gTerm = findFreeTerminal(galvanometer.id, gTerminals, resBox.id);
        const rTerm = findFreeTerminal(resBox.id, rTerminals, galvanometer.id);

        return [
            ...baseWires,
            {
                id: uid("3"),
                from: { itemId: voltmeter.id, terminal: "positive" },
                to: { itemId: galvanometer.id, terminal: gTerm },
            },
            {
                id: uid("4"),
                from: { itemId: voltmeter.id, terminal: "negative" },
                to: { itemId: resBox.id, terminal: rTerm },
            },
        ];
    }

    // CASE 2: Only Galvanometer (no resistance box yet)
    if (galvanometer) {
        return [
            ...baseWires,
            {
                id: uid("5"),
                from: { itemId: voltmeter.id, terminal: "positive" },
                to: { itemId: galvanometer.id, terminal: "positive" },
            },
            {
                id: uid("6"),
                from: { itemId: voltmeter.id, terminal: "negative" },
                to: { itemId: galvanometer.id, terminal: "negative" },
            },
        ];
    }

    // CASE 3: Galvanometer + Rheostat (alternative setup)
    if (galvanometer && rheostat) {
        return [
            ...baseWires,
            {
                id: uid("7"),
                from: { itemId: voltmeter.id, terminal: "positive" },
                to: { itemId: galvanometer.id, terminal: "positive" },
            },
            {
                id: uid("8"),
                from: { itemId: voltmeter.id, terminal: "negative" },
                to: { itemId: rheostat.id, terminal: "B" },
            },
        ];
    }

    // No fix possible
    return baseWires;
}
