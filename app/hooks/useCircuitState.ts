import { useState, useCallback, useMemo } from 'react';
import { PhysicsItem, Wire, DataPoint } from '../types/circuit.types';
import { DEFAULT_PROPS } from '../constants/experimentGuide';

export function useCircuitState() {
    const [workbenchItems, setWorkbenchItems] = useState<PhysicsItem[]>([]);
    const [wires, setWires] = useState<Wire[]>([]);
    const [connectingFrom, setConnectingFrom] = useState<{ itemId: string; terminal: string } | null>(null);
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [showGraph, setShowGraph] = useState(false);
    const [circuitRisks, setCircuitRisks] = useState<string[]>([]);
    const [actionError, setActionError] = useState<string | null>(null);

    const addItem = useCallback((type: string, x: number, y: number) => {
        const newItem: PhysicsItem = {
            id: `item-${Date.now()}`,
            type,
            x,
            y,
            props: DEFAULT_PROPS[type] || {}
        };
        setWorkbenchItems(prev => [...prev, newItem]);
    }, []);

    const updateItemPosition = useCallback((id: string, x: number, y: number) => {
        setWorkbenchItems(items =>
            items.map(item => (item.id === id ? { ...item, x, y } : item))
        );
    }, []);

    const deleteItem = useCallback((id: string) => {
        setWorkbenchItems(items => items.filter(item => item.id !== id));
        setWires(wires => wires.filter(wire =>
            wire.from.itemId !== id && wire.to.itemId !== id
        ));
    }, []);

    const updateItemProperty = useCallback((id: string, property: string, value: any) => {
        setWorkbenchItems(items =>
            items.map(item =>
                item.id === id ? { ...item, props: { ...item.props, [property]: value } } : item
            )
        );
    }, []);

    const clearWires = useCallback(() => {
        setWires([]);
    }, []);

    const deleteWire = useCallback((wireId: string) => {
        setWires(prev => prev.filter(w => w.id !== wireId));
    }, []);

    const resetWorkbench = useCallback(() => {
        setWorkbenchItems([]);
        setWires([]);
        setDataPoints([]);
        setCurrentStepIndex(0);
    }, []);

    const addDataPoint = useCallback((dataPoint: DataPoint) => {
        // Enforce calibration: only log if R is correct
        const resBox = workbenchItems.find(i => i.type === 'resistance_box');
        if (!resBox || Math.abs(resBox.props.resistance - 9900) > 10) {
            setActionError("⚠️ Calibration Required: Set Resistance Box to 9900Ω to log valid data.");
            return;
        }

        setDataPoints(prev => {
            const last = prev[prev.length - 1];
            if (last &&
                Math.abs(last.voltage - dataPoint.voltage) < 0.01 &&
                Math.abs(last.current - dataPoint.current) < 0.005) {
                return prev;
            }
            return [...prev, dataPoint].slice(-100);
        });
    }, [workbenchItems]);

    const clearDataPoints = useCallback(() => {
        setDataPoints([]);
    }, []);

    const suggestedConnection = useMemo(() => {
        // Step 5: Series Wiring
        if (currentStepIndex === 4) { // ID 5
            const galva = workbenchItems.find(i => i.type === 'galvanometer');
            const resBox = workbenchItems.find(i => i.type === 'resistance_box');
            const batt = workbenchItems.find(i => i.type === 'battery');
            const rheo = workbenchItems.find(i => i.type === 'rheostat');

            if (!batt || !galva || !resBox || !rheo) return null;

            const connections = [
                { from: batt.id, fromT: 'positive', to: galva.id, toT: 'positive', label: 'Battery(+) to Galva(+)' },
                { from: galva.id, fromT: 'negative', to: resBox.id, toT: 'left', label: 'Galva(-) to ResBox(Left)' },
                { from: resBox.id, fromT: 'right', to: rheo.id, toT: 'C', label: 'ResBox(Right) to Rheostat(C)' },
                { from: rheo.id, fromT: 'A', to: batt.id, toT: 'negative', label: 'Rheostat(A) to Battery(-)' }
            ];

            for (const conn of connections) {
                const connected = wires.some(w => 
                    ((w.from.itemId === conn.from && w.from.terminal === conn.fromT) && (w.to.itemId === conn.to && w.to.terminal === conn.toT)) ||
                    ((w.to.itemId === conn.from && w.to.terminal === conn.fromT) && (w.from.itemId === conn.to && w.from.terminal === conn.toT))
                );
                if (!connected) return conn;
            }
        }

        // Step 7: Parallel Voltmeter
        if (currentStepIndex === 6) { // ID 7
            const galva = workbenchItems.find(i => i.type === 'galvanometer');
            const resBox = workbenchItems.find(i => i.type === 'resistance_box');
            const volt = workbenchItems.find(i => i.type === 'voltmeter');

            if (!galva || !resBox) return null;
            if (!volt) return { from: '', fromT: '', to: '', toT: '', label: 'Add Voltmeter from Sidebar' };

            const connections = [
                { from: volt.id, fromT: 'positive', to: galva.id, toT: 'positive', label: 'Voltmeter(+) across G+R' },
                { from: volt.id, fromT: 'negative', to: resBox.id, toT: 'right', label: 'Voltmeter(-) across G+R' }
            ];

            for (const conn of connections) {
                const connected = wires.some(w => 
                    ((w.from.itemId === conn.from && w.from.terminal === conn.fromT) && (w.to.itemId === conn.to && w.to.terminal === conn.toT)) ||
                    ((w.to.itemId === conn.from && w.to.terminal === conn.fromT) && (w.from.itemId === conn.to && w.from.terminal === conn.toT))
                );
                if (!connected) return conn;
            }
        }

        return null;
    }, [workbenchItems, wires, currentStepIndex]);

    const handleTerminalClick = useCallback((itemId: string, terminalName: string) => {
        setActionError(null);
        
        // Strict Guidance Enforcement
        if (suggestedConnection) {
            const isPart = (itemId === suggestedConnection.from && terminalName === suggestedConnection.fromT) ||
                           (itemId === suggestedConnection.to && terminalName === suggestedConnection.toT);
            
            if (!isPart) {
                setActionError(`Follow the GLOWING terminals! We need to connect: ${suggestedConnection.label}`);
                return;
            }

            if (connectingFrom) {
                const isCorrectPair = 
                    (connectingFrom.itemId === suggestedConnection.from && connectingFrom.terminal === suggestedConnection.fromT && itemId === suggestedConnection.to && terminalName === suggestedConnection.toT) ||
                    (connectingFrom.itemId === suggestedConnection.to && connectingFrom.terminal === suggestedConnection.toT && itemId === suggestedConnection.from && terminalName === suggestedConnection.fromT);
                
                if (!isCorrectPair) {
                    setActionError(`Please connect this to the OTHER glowing terminal for: ${suggestedConnection.label}`);
                    return;
                }
            }
        }

        if (!connectingFrom) {
            setConnectingFrom({ itemId, terminal: terminalName });
        } else {
            if (connectingFrom.itemId !== itemId) {
                const newWire: Wire = {
                    id: `wire-${Date.now()}`,
                    from: connectingFrom,
                    to: { itemId, terminal: terminalName }
                };
                setWires(prev => [...prev, newWire]);
            }
            setConnectingFrom(null);
        }
    }, [connectingFrom, suggestedConnection]);

    return {
        workbenchItems,
        wires,
        connectingFrom,
        dataPoints,
        currentStepIndex,
        showGraph,
        circuitRisks,
        actionError,
        suggestedConnection,
        setWorkbenchItems,
        setWires,
        setConnectingFrom,
        setCurrentStepIndex,
        setShowGraph,
        setCircuitRisks,
        setActionError,
        addItem,
        updateItemPosition,
        deleteItem,
        updateItemProperty,
        handleTerminalClick,
        clearWires,
        deleteWire,
        resetWorkbench,
        addDataPoint,
        clearDataPoints,
    };

}
