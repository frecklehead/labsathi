export const experimentKnowledge: Record<string, any> = {
    "acid-base-titration": {
        name: "Acid-Base Titration",
        objective: "Determine the concentration of an unknown acid using standardized base",
        safetyNotes: [
            "Always wear safety goggles",
            "NaOH is caustic - handle with care",
            "Clean spills immediately"
        ],
        concepts: {
            "equivalence-point": "The point where moles of acid equal moles of base",
            "indicator": "Phenolphthalein changes from colorless to pink at pH 8.2-10",
            "molarity": "Moles of solute per liter of solution (M = mol/L)"
        },
        commonMistakes: {
            "excess-base": {
                issue: "Adding too much NaOH",
                consequence: "Overshoots equivalence point, inaccurate results",
                prevention: "Add base slowly near expected endpoint"
            },
            "dirty-glassware": {
                issue: "Not rinsing equipment properly",
                consequence: "Contamination affects measurements",
                prevention: "Rinse with distilled water, then solution to be used"
            },
            "no-indicator": {
                issue: "Forgetting to add indicator",
                consequence: "No visible color change at endpoint",
                prevention: "Add indicator before starting titration"
            }
        },
        expectedProcedure: [
            {
                step: 0,
                instruction: "Setup stand and burette",
                expectedValue: 0,
                tolerance: 0,
                unit: "na"
            },
            {
                step: 1,
                instruction: "Fill burette with NaOH",
                expectedValue: 50,
                tolerance: 5,
                unit: "ml",
                rationale: "Ensure enough titrant for the experiment"
            },
            {
                step: 2,
                instruction: "Add Analyte (Acid) to Flask",
                expectedValue: 20,
                tolerance: 2,
                unit: "ml",
                rationale: "Precise volume needed for calculations"
            },
            {
                step: 3,
                instruction: "Add Indicator to Flask",
                expectedValue: 1,
                tolerance: 0,
                unit: "bool",
                rationale: "Required to see the endpoint"
            },
            {
                step: 4,
                instruction: "Titrate until endpoint (light pink)",
                expectedValue: 20,
                tolerance: 0.5,
                unit: "ml",
                rationale: "Stop exactly when color changes"
            }
        ]
    }
};
