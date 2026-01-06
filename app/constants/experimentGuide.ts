import { PhysicsItem, Wire, GuideStep } from '../types/circuit.types';
import { isSeriesConnection, isParallelConnection, detectParallelResistorError, isVoltmeterCorrectlyPlaced } from '../utils/circuitHelpers';

export const GUIDE_STEPS: GuideStep[] = [
    {
        id: 1,
        title: "Calculate Series Resistance",
        description: "For converting galvanometer (G=100Ω, Ig=1mA) to voltmeter of range V=10V, calculate required series resistance.",
        hint: "Formula: R = (V / Ig) - G = (10 / 0.001) - 100 = 9900Ω",
        isExplicit: true,
        check: () => false
    },
    {
        id: 2,
        title: "Place Galvanometer",
        description: "Drag the Galvanometer onto the workbench. This is the instrument we'll convert into a voltmeter.",
        check: (items: PhysicsItem[]) => items.some(i => i.type === 'galvanometer'),
    },
    {
        id: 3,
        title: "Add High Resistance Box",
        description: "Add the Resistance Box. IMPORTANT: This MUST be connected in SERIES with the galvanometer, not parallel!",
        hint: "Series connection: Current flows through both components one after another.",
        check: (items: PhysicsItem[]) => items.some(i => i.type === 'resistance_box'),
        errorCheck: (items: PhysicsItem[], wires: Wire[]) => {
            if (detectParallelResistorError(items, wires)) {
                return "⚠️ ERROR: Resistance Box is in PARALLEL! It must be in SERIES with the galvanometer. Disconnect and rewire.";
            }
            return null;
        }
    },
    {
        id: 4,
        title: "Add Battery & Rheostat",
        description: "Add Battery and Rheostat to complete the circuit components. All should form a series loop.",
        check: (items: PhysicsItem[]) => {
            const types = items.map(i => i.type);
            return types.includes('battery') && types.includes('rheostat');
        }
    },
    {
        id: 5,
        title: "Wire Components in Series",
        description: "Follow the glowing terminals. We need a series loop: Battery(+) → Galvanometer → Resistance Box → Rheostat(Wiper) → Battery(-).",
        hint: "Connect the Rheostat Wiper (Terminal C) to vary the resistance!",
        check: (items: PhysicsItem[], wires: Wire[] = []) => {
            const types = items.map(i => i.type);
            const hasAll = types.includes('battery') && types.includes('galvanometer') && 
                          types.includes('resistance_box') && types.includes('rheostat');
            return hasAll && wires.length >= 4 && isSeriesConnection(items, wires);
        }
    },
    {
        id: 6,
        title: "Calibrate Resistance Box",
        description: "Set the Resistance Box to EXACTLY 9900 Ω. This provides the correct multiplier for the 10V voltmeter conversion.",
        hint: "Formula: R = (V/Ig) - G = (10/0.001) - 100 = 9900 Ω",
        check: (items: PhysicsItem[]) => {
            const resBox = items.find(i => i.type === 'resistance_box');
            // Strict check: must be exactly 9900 or within very small margin
            return !!resBox && Math.abs(resBox.props.resistance - 9900) < 10;
        },
        errorCheck: (items: PhysicsItem[]) => {
            const resBox = items.find(i => i.type === 'resistance_box');
            if (resBox && Math.abs(resBox.props.resistance - 9900) > 10) {
                return `⚠️ Accuracy Error: The resistance is set to ${resBox.props.resistance}Ω. It must be 9900Ω for a 10V range.`;
            }
            return null;
        }
    },
    {
        id: 7,
        title: "Parallel Verification",
        description: "Connect the Voltmeter in PARALLEL across the Galvanometer + Resistance Box branch to verify your conversion.",
        hint: "A voltmeter always bridges across the portion of the circuit you want to measure.",
        check: (items: PhysicsItem[], wires: Wire[] = []) => {
            const hasVoltmeter = items.some(i => i.type === 'voltmeter');
            const resBox = items.find(i => i.type === 'resistance_box');
            const isCalibrated = !!resBox && Math.abs(resBox.props.resistance - 9900) < 10;
            return isVoltmeterCorrectlyPlaced(items, wires) && isCalibrated;
        },
        errorCheck: (items: PhysicsItem[], wires: Wire[]) => {
            const resBox = items.find(i => i.type === 'resistance_box');
            if (resBox && Math.abs(resBox.props.resistance - 9900) > 10) {
                return "⚠️ Calibration Lost: Please set the Resistance Box back to 9900Ω before verifying.";
            }
            const hasVoltmeter = items.some(i => i.type === 'voltmeter');
            if (hasVoltmeter && !isVoltmeterCorrectlyPlaced(items, wires)) {
                return "⚠️ Wiring Error: Voltmeter must be in PARALLEL. Ensure it bridges both the Galvanometer and Resistance Box.";
            }
            return null;
        }
    },
    {
        id: 8,
        title: "Observation & Data Logging",
        description: "Vary the Rheostat to change the voltage and log at least 5 high-quality data points for calibration.",
        hint: "Smoothly slide the rheostat wiper and wait for the galvanometer needle to stabilize.",
        check: (items: PhysicsItem[], wires: Wire[] = []) => {
            return items.length > 0; // Final state
        }
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
