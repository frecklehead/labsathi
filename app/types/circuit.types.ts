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

export interface GuideStep {
    id: number;
    title: string;
    description: string;
    hint?: string;
    isExplicit?: boolean;
    check: (items: PhysicsItem[], wires: Wire[]) => boolean;
    errorCheck?: (items: PhysicsItem[], wires: Wire[]) => string | null;
}
