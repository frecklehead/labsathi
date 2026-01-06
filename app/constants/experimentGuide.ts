import { PhysicsItem, Wire, GuideStep } from '../types/circuit.types';

export const GUIDE_STEPS: GuideStep[] = [
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

export const DEFAULT_PROPS: { [key: string]: any } = {
    battery: { voltage: 5 },
    resistor: { resistance: 10 },
    ammeter: { current: 0, internalResistance: 0.01 },
    voltmeter: { voltage: 0, internalResistance: 1000000 },
    galvanometer: { current: 0, internalResistance: 100, fullScaleCurrent: 1 },
    rheostat: { resistance: 50, maxResistance: 100 },
    resistance_box: { resistance: 1000 },
};
