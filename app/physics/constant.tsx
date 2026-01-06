export interface PhysicsItem {
    id: string;
    type: string;
    x: number;
    y: number;
    props: { [key: string]: any };
}

export interface Wire {
    id: string;
    from: { itemId: string; terminal: string };
    to: { itemId: string; terminal: string };
}

export interface Terminal {
    id: string;
    itemId: string;
    name: string;
    x: number;
    y: number;
}

export interface DataPoint {
    voltage: number;
    current: number;
    resistance: number;
    timestamp: number;
}



export const GUIDE_STEPS = [
    {
        id: 1,
        title: "Experimental Setup",
        description: "Calculate resistance R = (V / Ig) - G for your desired voltmeter range V.",
        check: (items: PhysicsItem[]) => items.length > 0
    },
    {
        id: 2,
        title: "Assemble Circuit",
        description: "Connect Battery, Rheostat, Galvanometer, and Resist. Box in a closed series loop.",
        check: (items: PhysicsItem[], wires: Wire[]) => {
            const types = items.map(i => i.type);
            return types.includes('battery') && types.includes('galvanometer') && types.includes('resistance_box') && wires.length >= 3;
        }
    },
    {
        id: 3,
        title: "Calibration",
        description: "Adjust the High Resistance Box to match your calculated value R.",
        check: (items: PhysicsItem[]) => items.some(i => i.type === 'resistance_box' && i.props.resistance !== 1000)
    },
    {
        id: 4,
        title: "Verification",
        description: "Connect a Voltmeter in parallel across the (G + R) combination to verify.",
        check: (items: PhysicsItem[], wires: Wire[]) => {
            const hasVoltmeter = items.some(i => i.type === 'voltmeter');
            return hasVoltmeter && wires.length >= 5;
        }
    },
    {
        id: 5,
        title: "Take Readings",
        description: "Vary the Rheostat resistance to record different sets of V and I readings. Click 'Show Graph' to visualize.",
        check: (items: PhysicsItem[]) => items.length > 0 // Final state
    }
];