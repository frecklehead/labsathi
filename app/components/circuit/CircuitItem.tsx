import React from 'react';
import { PhysicsItem } from '../../types/circuit.types';
import { DraggableLabObject } from "../../snapped";
import { Battery } from "../physics/Battery";
import { Resistor } from "../physics/Resistor";
import { Ammeter } from "../physics/Ammeter";
import { Galvanometer } from "../physics/Galvanometer";
import { Rheostat } from "../physics/Rheostat";
import { Voltmeter } from "../physics/Voltmeter";
import { HighResistanceBox } from "../physics/HighResistanceBox";

interface CircuitItemProps {
    item: PhysicsItem;
    onPositionChange: (id: string, x: number, y: number) => void;
    onDelete: (id: string) => void;
    onPropertyChange: (id: string, property: string, value: any) => void;
}

export default function CircuitItem({
    item,
    onPositionChange,
    onDelete,
    onPropertyChange
}: CircuitItemProps) {
    let Component;
    switch (item.type) {
        case 'battery':
            Component = <Battery
                voltage={item.props.voltage}
                onVoltageChange={(v) => onPropertyChange(item.id, 'voltage', v)}
            />;
            break;
        case 'resistor':
            Component = <Resistor
                resistance={item.props.resistance}
                onResistanceChange={(r) => onPropertyChange(item.id, 'resistance', r)}
            />;
            break;
        case 'ammeter':
            Component = <Ammeter current={item.props.current || 0} />;
            break;
        case "galvanometer":
            Component = (
                <Galvanometer
                    current={item.props.current || 0}
                    internalResistance={item.props.internalResistance || 100}
                    fullScaleCurrent={item.props.fullScaleCurrent || 1}
                    onPropertyChange={(p: string, v: number) =>
                        onPropertyChange(item.id, p, v)
                    }
                />
            );
            break;
        case "rheostat":
            Component = (
                <Rheostat
                    resistance={item.props.resistance || 50}
                    maxResistance={item.props.maxResistance || 100}
                    onResistanceChange={(r: number) =>
                        onPropertyChange(item.id, "resistance", r)
                    }
                />
            );
            break;
        case "voltmeter":
            Component = (
                <Voltmeter
                    voltage={item.props.voltage || 0}
                    resistance={item.props.internalResistance || 1000000}
                    onPropertyChange={(p: string, v: number) =>
                        onPropertyChange(item.id, p, v)
                    }
                />
            );
            break;
        case 'resistance_box':
            Component = <HighResistanceBox
                resistance={item.props.resistance || 0}
                onResistanceChange={(r) => onPropertyChange(item.id, 'resistance', r)}
            />;
            break;
        default:
            Component = <div className="p-4 bg-red-500">?</div>;
    }

    return (
        <DraggableLabObject
            id={item.id}
            type={item.type}
            initialX={item.x}
            initialY={item.y}
            snapTargets={[]}
            onPositionChange={(id, x, y) => onPositionChange(id, x, y)}
            onDelete={onDelete}
            onHover={() => { }}
        >
            {Component}
        </DraggableLabObject>
    );
}
