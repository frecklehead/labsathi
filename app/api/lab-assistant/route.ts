import { NextRequest, NextResponse } from 'next/server';
import { runLabAgent, type LabAction, type ProcedureStep } from "@/lib/lab-agent";

// Default procedure for KMnO4 titration
const DEFAULT_PROCEDURE: ProcedureStep[] = [
    {
        step: 1,
        instruction: "Add 10ml oxalic acid (±0.2ml)",
        expectedValue: 10,
        tolerance: 0.2,
        unit: "ml",
        safetyNotes: ["Use a pipette for precision", "Align meniscus at eye level"]
    },
    {
        step: 2,
        instruction: "Add 5ml dilute H₂SO₄ (±0.5ml)",
        expectedValue: 5,
        tolerance: 0.5,
        unit: "ml",
        safetyNotes: ["Add acid slowly down the flask's side", "Wear goggles"]
    },
    {
        step: 3,
        instruction: "Heat to 60°C (±5°C)",
        expectedValue: 60,
        tolerance: 5,
        unit: "°C",
        safetyNotes: ["Stir continuously while heating", "Avoid violent boiling (bumping)"]
    },
    {
        step: 4,
        instruction: "Titrate until permanent pink (~20ml)",
        expectedValue: 20,
        tolerance: 1,
        unit: "ml",
        safetyNotes: ["Add drop-by-drop near endpoint", "Swirl continuously"]
    }
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            experimentId = 'kmno4-titration',
            studentActions = [],
            studentQuestion,
            conversationHistory = [],
            studentLevel = 'intermediate',
            customProcedure
        } = body;

        console.log("Lab Assistant Request:", {
            experimentId,
            actionCount: studentActions.length,
            question: studentQuestion
        });

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                error: "Server Configuration Error: Missing API Key"
            }, { status: 500 });
        }

        // Run the Advanced LangGraph Agent
        const result = await runLabAgent({
            experimentId,
            studentId: 'anonymous', // Can be expanded for registered users
            studentActions: studentActions as LabAction[],
            correctProcedure: customProcedure || DEFAULT_PROCEDURE,
            studentQuestion,
            studentLevel: studentLevel as 'beginner' | 'intermediate' | 'advanced',
            conversationHistory
        });

        return NextResponse.json({
            success: true,
            response: result.agentResponse,
            issues: result.detectedIssues,
            prediction: result.predictedOutcome,
            calculation: result.calculationHelp,
            studentLevel: result.studentLevel,
            strugglingTopics: result.strugglingConcepts,
            // For backward compatibility
            mistakes: result.detectedIssues.filter(i => i.type === 'error').map(i => i.message)
        });

    } catch (error: any) {
        console.error('Lab assistant error:', error);
        return NextResponse.json(
            { error: `Failed to process lab data: ${error.message}` },
            { status: 500 }
        );
    }
}