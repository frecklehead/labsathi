import { LabItem } from "./types";

export interface GuideStep {
    id: number;
    title: string;
    description: string;
    check: (items: LabItem[]) => boolean;
}

export const GUIDE_STEPS: GuideStep[] = [
    {
        id: 1,
        title: "Setup Stand",
        description: "Drag a Retort Stand from the apparatus shelf to the workbench.",
        check: (items) => items.some(i => i.type === 'stand')
    },
    {
        id: 2,
        title: "Attach Clamp",
        description: "Attach a Stand Clamp to the Retort Stand.",
        check: (items) => items.some(i => i.type === 'clamp' && i.snappedToId?.startsWith('rod-'))
    },
    {
        id: 3,
        title: "Mount Burette",
        description: "Attach a Burette to the clamp. The burette holds the titrant (known concentration).",
        check: (items) => items.some(i => i.type === 'burette' && i.snappedToId?.startsWith('holder-'))
    },
    {
        id: 4,
        title: "Place Volumetric Flask (Molar Standard)",
        description: "To find the unknown concentration, we first need a standard solution. Place the Volumetric Flask on the base.",
        check: (items) => items.some(i => (i.type === 'flask' || i.type === 'titration-flask' || i.type === 'volumetric-flask') && i.snappedToId?.startsWith('base-'))
    },
    {
        id: 5,
        title: "Perform Titration",
        description: "Open the burette carefully to add titrant to the flask. Watch for the color change (End Point) indicating neutralization.",
        check: (items) => items.some(i => (i.type === 'flask' || i.type === 'titration-flask' || i.type === 'volumetric-flask') && (i.props.fill > 20 || i.props.color !== 'bg-transparent')) // Check if liquid added
    }
];
