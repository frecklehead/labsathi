export interface ContainerState {
    totalVolume: number; // mL
    molesH: number;      // Moles H+
    molesOH: number;     // Moles OH-
    hasIndicator: boolean;
}

export interface LabItem {
    id: string;
    type: string;
    x: number;
    y: number;
    snappedToId?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: { [key: string]: any };
    containerState?: ContainerState;
}
