import { useState, useCallback } from 'react';
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

    const handleTerminalClick = useCallback((itemId: string, terminalName: string) => {
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
    }, [connectingFrom]);

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
        setDataPoints(prev => {
            const last = prev[prev.length - 1];
            if (last &&
                Math.abs(last.voltage - dataPoint.voltage) < 0.01 &&
                Math.abs(last.current - dataPoint.current) < 0.005) {
                return prev;
            }
            return [...prev, dataPoint].slice(-100);
        });
    }, []);

    const clearDataPoints = useCallback(() => {
        setDataPoints([]);
    }, []);

    return {
        workbenchItems,
        wires,
        connectingFrom,
        dataPoints,
        currentStepIndex,
        showGraph,
        circuitRisks,
        setWorkbenchItems,
        setWires,
        setConnectingFrom,
        setCurrentStepIndex,
        setShowGraph,
        setCircuitRisks,
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
