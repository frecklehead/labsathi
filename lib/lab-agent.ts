import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { LABMATE_SYSTEM_PROMPT } from "./labmate-system-prompt";
import { SATHI_SYSTEM_PROMPT } from "./sathi-system-prompt";
import { JsonOutputParser } from "@langchain/core/output_parsers";

// ==============================================
// ADVANCED AI LAB AGENT WITH LANGGRAPH + GEMINI
// ==============================================

// State Definition
export interface LabAction {
    step: number;
    action: string;
    value: number;
    unit: string;
    timestamp: Date;
    image?: string; // Base64 for multimodal
}

export interface LabIssue {
    type: 'error' | 'warning' | 'safety' | 'tip';
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    suggestion: string;
    concept?: string;
}

export interface ProcedureStep {
    step: number;
    instruction: string;
    expectedValue: number;
    tolerance: number;
    unit: string;
    safetyNotes?: string[];
}

// Define State using Annotation for LangGraph v1.x
export const LabAgentStateAnnotation = Annotation.Root({
    experimentId: Annotation<string>(),
    studentId: Annotation<string>(),
    currentStep: Annotation<number>(),
    studentActions: Annotation<LabAction[]>(),
    correctProcedure: Annotation<ProcedureStep[]>(),
    detectedIssues: Annotation<LabIssue[]>(),
    studentQuestion: Annotation<string | undefined>(),
    conversationHistory: Annotation<any[]>(),
    studentLevel: Annotation<'beginner' | 'intermediate' | 'advanced'>(),
    strugglingConcepts: Annotation<string[]>(),
    predictedOutcome: Annotation<string | undefined>(),
    calculationHelp: Annotation<any | undefined>(),
    agentResponse: Annotation<string | undefined>(),
    visualFeedback: Annotation<any | undefined>(),
    circuitState: Annotation<any | undefined>(),
    sathiResponse: Annotation<any | undefined>(),
});

export type LabAgentState = typeof LabAgentStateAnnotation.State;

// Initialize Gemini Model
const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-exp",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7,
    maxOutputTokens: 2048,
});

// ============================================
// AGENT NODES
// ============================================

// Node 1: Error Detection with Context
async function detectErrors(state: LabAgentState): Promise<Partial<LabAgentState>> {
    const issues: LabIssue[] = [];
    const lastAction = state.studentActions[state.studentActions.length - 1];
    const expected = state.correctProcedure.find(p => p.step === lastAction?.step);

    if (!lastAction || !expected) return { detectedIssues: [] };

    // Measurement Error
    const diff = Math.abs(lastAction.value - expected.expectedValue);
    if (diff > expected.tolerance) {
        const severity = diff > expected.tolerance * 3 ? 'critical' :
            diff > expected.tolerance * 2 ? 'high' : 'medium';

        issues.push({
            type: 'error',
            severity,
            message: `Used ${lastAction.value}${lastAction.unit} instead of ${expected.expectedValue}${expected.unit}.`,
            suggestion: `Adjust to ${expected.expectedValue}${expected.unit} (±${expected.tolerance}${expected.unit}).`,
            concept: 'Precision in Measurements'
        });
    }

    // Sequence Error
    if (lastAction.step !== state.currentStep) {
        issues.push({
            type: 'error',
            severity: 'critical',
            message: 'Steps performed out of order.',
            suggestion: `Complete step ${state.currentStep} first: ${expected.instruction}`,
            concept: 'Procedure Sequence'
        });
    }

    // Safety Check
    if (expected.safetyNotes && expected.safetyNotes.length > 0) {
        issues.push({
            type: 'safety',
            severity: 'high',
            message: 'Safety reminder for this step.',
            suggestion: expected.safetyNotes.join('. '),
            concept: 'Lab Safety'
        });
    }

    return { detectedIssues: issues };
}

// Node 2: Predictive Outcome Analysis
async function predictOutcome(state: LabAgentState): Promise<Partial<LabAgentState>> {
    if (state.detectedIssues.length === 0) {
        return { predictedOutcome: undefined };
    }

    const prompt = PromptTemplate.fromTemplate(`
You are a chemistry lab instructor. Based on the student's mistakes, predict the experimental outcome.

Experiment: {experiment}
Student's Mistake: {mistake}
Expected Procedure: {procedure}

Provide a SHORT prediction (2-3 sentences) of:
1. What will happen to the results
2. Why this error matters

Be concise and educational.`);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const prediction = await chain.invoke({
        experiment: state.experimentId,
        mistake: state.detectedIssues[0]?.message,
        procedure: JSON.stringify(state.correctProcedure[state.currentStep - 1])
    });

    return { predictedOutcome: prediction };
}

// Node 3: AI-Powered Explanation with Gemini
async function generateExplanation(state: LabAgentState): Promise<Partial<LabAgentState>> {
    const systemPrompt = `${LABMATE_SYSTEM_PROMPT}

EXPERIMENT: ${state.experimentId}
STUDENT LEVEL: ${state.studentLevel}
${state.strugglingConcepts.length > 0 ? `STUDENT STRUGGLES WITH: ${state.strugglingConcepts.join(', ')}` : ''}
`;

    let userPrompt = "";

    // Handle different scenarios
    if (state.studentQuestion) {
        userPrompt = `Student asks: "${state.studentQuestion}"\n\nProvide a brief, clear answer (3 sentences max).`;
    } else if (state.detectedIssues.length > 0) {
        const criticalIssues = state.detectedIssues.filter(i => i.severity === 'critical' || i.severity === 'high');
        if (criticalIssues.length > 0) {
            const issue = criticalIssues[0];
            userPrompt = `Student made this mistake: ${issue.message}

Explain briefly (3 sentences):
1. Why this is a problem
2. What to do about it

${state.predictedOutcome ? `\nPredicted outcome: ${state.predictedOutcome}` : ''}`;
        }
    } else {
        const nextStep = state.correctProcedure[state.currentStep];
        if (nextStep) {
            userPrompt = `Give a quick tip (1-2 sentences) for the next step: "${nextStep.instruction}"`;
        } else {
            userPrompt = "The student has successfully completed the experiment steps. Provide a congratulatory wrap-up tip.";
        }
    }

    const messages = [
        new SystemMessage(systemPrompt),
        ...state.conversationHistory,
        new HumanMessage(userPrompt)
    ];

    const response = await model.invoke(messages);

    return {
        agentResponse: response.content as string,
        conversationHistory: [...state.conversationHistory, new HumanMessage(userPrompt), response]
    };
}

// Node 4: Calculation Assistant
async function calculateValues(state: LabAgentState): Promise<Partial<LabAgentState>> {
    if (!state.studentQuestion?.toLowerCase().includes('calculate') &&
        !state.studentQuestion?.toLowerCase().includes('molarity')) {
        return {};
    }

    const prompt = `You are helping with chemistry calculations.
Experiment: ${state.experimentId}
Student's actions so far: ${JSON.stringify(state.studentActions)}
Student needs help with: ${state.studentQuestion}

Provide:
1. The formula needed
2. Step-by-step calculation (SHORT)
3. Final answer with units

Format in 4 sentences maximum.`;

    const response = await model.invoke([new HumanMessage(prompt)]);

    return {
        calculationHelp: {
            explanation: response.content,
            formula: "Formula extracted from explanation"
        }
    };
}

// Node 5: Adaptive Learning Profile Update
async function updateLearningProfile(state: LabAgentState): Promise<Partial<LabAgentState>> {
    const newStrugglingConcepts = [...state.strugglingConcepts];

    state.detectedIssues.forEach(issue => {
        if (issue.concept && !newStrugglingConcepts.includes(issue.concept)) {
            newStrugglingConcepts.push(issue.concept);
        }
    });

    const criticalErrors = state.detectedIssues.filter(i => i.severity === 'critical').length;
    let newLevel = state.studentLevel;

    if (criticalErrors > 3) newLevel = 'beginner';
    else if (criticalErrors === 0 && state.studentActions.length > 5) newLevel = 'advanced';

    return {
        strugglingConcepts: newStrugglingConcepts,
        studentLevel: newLevel
    };
}

// Node 6: Sathi Agent (Galvanometer Experiment)
async function runSathiAgent(state: LabAgentState): Promise<Partial<LabAgentState>> {
    const prompt = PromptTemplate.fromTemplate(`{system_prompt}

DATA INPUT:
{json_input}
`);

    const jsonInput = {
        circuit_state: state.circuitState || {},
        student_progress: {
            current_step: state.currentStep,
            hints_used: 0, // TODO: Track this
            errors_made: state.detectedIssues || []
        },
        user_message: state.studentQuestion || "Monitor status"
    };

    const chain = prompt.pipe(model).pipe(new JsonOutputParser());

    try {
        const response = await chain.invoke({
            system_prompt: SATHI_SYSTEM_PROMPT,
            json_input: JSON.stringify(jsonInput)
        }) as any;

        // Map Sathi response to standard state for frontend compatibility
        let textResponse = "";
        if (response.response_type === 'alert') {
            textResponse = `⚠️ ${response.message}`;
        } else if (response.response_type === 'hint') {
            textResponse = `💡 ${response.message}`;
        } else {
            textResponse = response.message;
        }

        return {
            sathiResponse: response,
            agentResponse: textResponse,
            // You might want to push to conversation history here too
            conversationHistory: [...state.conversationHistory,
            new HumanMessage(state.studentQuestion || "Monitor"),
            new SystemMessage(textResponse)
            ]
        };
    } catch (e) {
        console.error("Sathi Agent Error", e);
        return {
            agentResponse: "Sathi is rebooting... (JSON Parse Error)"
        };
    }
}

// ============================================
// BUILD THE AGENT GRAPH
// ============================================

function routeStart(state: LabAgentState): string {
    if (state.experimentId === 'galvanometer_to_voltmeter' || state.experimentId === 'galvanometer-conversion') {
        return "runSathiAgent";
    }
    return "detectErrors";
}

function routeAfterDetection(state: LabAgentState): string {
    if (state.studentQuestion) {
        if (state.studentQuestion.toLowerCase().includes('calculate') || state.studentQuestion.toLowerCase().includes('molarity')) {
            return "calculateValues";
        }
        return "generateExplanation";
    }

    if (state.detectedIssues.length > 0) {
        return "predictOutcome";
    }

    return "generateExplanation";
}

// Create the graph
const workflow = new StateGraph(LabAgentStateAnnotation)
    .addNode("detectErrors", detectErrors)
    .addNode("predictOutcome", predictOutcome)
    .addNode("generateExplanation", generateExplanation)
    .addNode("calculateValues", calculateValues)
    .addNode("updateLearningProfile", updateLearningProfile)
    .addNode("runSathiAgent", runSathiAgent)
    .addConditionalEdges("__start__", routeStart)
    .addConditionalEdges("detectErrors", routeAfterDetection)
    .addEdge("predictOutcome", "generateExplanation")
    .addEdge("calculateValues", "generateExplanation")
    .addEdge("generateExplanation", "updateLearningProfile")
    .addEdge("runSathiAgent", END)
    .addEdge("updateLearningProfile", END);

// Compile to a Runnable
const app = workflow.compile();

/**
 * Runs the Multi-Node Lab Assistant Graph
 */
export async function runLabAgent(input: {
    experimentId: string;
    studentId: string;
    studentActions: LabAction[];
    correctProcedure: ProcedureStep[];
    studentQuestion?: string;
    studentLevel?: 'beginner' | 'intermediate' | 'advanced';
    conversationHistory?: any[];
    circuitState?: any; // New Input
}) {
    const initialState = {
        experimentId: input.experimentId,
        studentId: input.studentId,
        currentStep: input.studentActions.length + 1,
        studentActions: input.studentActions,
        correctProcedure: input.correctProcedure,
        studentQuestion: input.studentQuestion,
        detectedIssues: [],
        conversationHistory: input.conversationHistory || [],
        studentLevel: input.studentLevel || 'intermediate',
        strugglingConcepts: [],
        predictedOutcome: undefined,
        calculationHelp: undefined,
        agentResponse: undefined,
        visualFeedback: undefined,
        circuitState: input.circuitState, // Pass circuitState
        sathiResponse: undefined
    };

    const result = await app.invoke(initialState);
    return result;
}
