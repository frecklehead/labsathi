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
        description: "Attach a Burette to the clamp. The burette should contain NaOH (0.1M solution).",
        check: (items) => items.some(i => i.type === 'burette' && i.snappedToId?.startsWith('holder-'))
    },
    {
        id: 4,
        title: "Fill Burette with NaOH",
        description: "Click the burette and select 'NaOH' to fill it with sodium hydroxide solution (0.1M).",
        check: (items) => {
            const burette = items.find(i => i.type === 'burette' && i.snappedToId?.startsWith('holder-'));
            // Check if burette has significant fill level (>50%)
            return burette && (burette.props.fill ?? 0) > 50;
        }
    },
    {
        id: 5,
        title: "Place Volumetric Flask",
        description: "Place the Volumetric Flask on the stand base. This will hold your standard solution.",
        check: (items) => items.some(i => (i.type === 'flask' || i.type === 'titration-flask' || i.type === 'volumetric-flask') && i.snappedToId?.startsWith('base-'))
    },
    {
        id: 6,
        title: "Add HCl (50ml)",
        description: "Click on the flask and add 50ml of HCl (0.1M) to prepare your analyte solution.",
        check: (items) => {
            const flask = items.find(i => (i.type === 'flask' || i.type === 'titration-flask' || i.type === 'volumetric-flask') && i.snappedToId?.startsWith('base-'));
            if (!flask?.containerState) return false;
            return flask.containerState.totalVolume >= 45 && flask.containerState.molesH > 0.004;
        }
    },
    {
        id: 7,
        title: "Add Indicator (5ml)",
        description: "Add 5ml of phenolphthalein indicator to the flask. This will help you detect the end point.",
        check: (items) => {
            const flask = items.find(i => (i.type === 'flask' || i.type === 'titration-flask' || i.type === 'volumetric-flask') && i.snappedToId?.startsWith('base-'));
            return flask?.containerState?.hasIndicator === true;
        }
    },
    {
        id: 8,
        title: "Perform Titration",
        description: "Open the burette valve to slowly add NaOH to the flask. Watch carefully for the color to change to pink.",
        check: (items) => {
            const flask = items.find(i => (i.type === 'flask' || i.type === 'titration-flask' || i.type === 'volumetric-flask') && i.snappedToId?.startsWith('base-'));
            if (!flask?.containerState) return false;
            // Check that NaOH has been added (molesOH > 0) and flask fill increased
            return flask.containerState.molesOH > 0 && (flask.props.fill ?? 0) > 25;
        }
    },
    {
        id: 9,
        title: "Verify End Point",
        description: "Stop adding NaOH when you see a persistent pink color. This indicates neutralization is complete.",
        check: (items) => {
            const flask = items.find(i => (i.type === 'flask' || i.type === 'titration-flask' || i.type === 'volumetric-flask') && i.snappedToId?.startsWith('base-'));
            if (!flask?.containerState) return false;
            // Check pink color AND that OH- exceeds H+
            const isPink = flask.props.color?.includes('pink') ?? false;
            const isNeutralized = flask.containerState.molesOH > flask.containerState.molesH;
            return isPink && isNeutralized;
        }
    }
];
