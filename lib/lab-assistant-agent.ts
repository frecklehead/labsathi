import { StateGraph, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { experimentKnowledge } from "./experiments-knowledge";

// Define the state structure
interface LabState {
    experimentId: string;
    studentActions: Array<{
        step: number;
        action: string;
        value: number;
        unit: string;
        timestamp?: string;
    }>;
    mistakes: Array<{
        step: number;
        issue: string;
        severity: "critical" | "warning" | "minor";
        explanation: string;
    }>;
    studentQuestion?: string;
    agentResponse?: string;
    conversationHistory: BaseMessage[];
}

// Initialize Gemini model
const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    maxOutputTokens: 1024,
    apiKey: process.env.GEMINI_API_KEY,
});

// Node 1: Analyze Student Actions
async function analyzeActions(state: LabState): Promise<Partial<LabState>> {
    const mistakes: LabState["mistakes"] = [];
    const knowledge = experimentKnowledge[state.experimentId];

    if (!knowledge) return { mistakes: [] };

    const procedure = knowledge.expectedProcedure as Array<any>;

    // Simple heuristic analysis vs Procedure
    // In a real app, this might be more complex or use LLM to analyze flexible steps

    // We check the LAST action performed
    const lastAction = state.studentActions[state.studentActions.length - 1];
    if (lastAction) {
        // Find corresponding step in procedure (by step index or fuzzy match)
        // Here we assume step index matches for simplicity
        const expected = procedure.find(p => p.step === lastAction.step);

        if (expected) {
            // Tolerance Check
            if (expected.unit !== 'bool' && expected.unit !== 'na') {
                const diff = Math.abs(lastAction.value - expected.expectedValue);
                if (diff > expected.tolerance) {
                    const severity = diff > expected.tolerance * 2 ? "critical" : "warning";
                    mistakes.push({
                        step: lastAction.step,
                        issue: `Incorrect ${lastAction.action} amount`,
                        severity,
                        explanation: `You used ${lastAction.value} ${lastAction.unit}, but the procedure requires ${expected.expectedValue} ${expected.unit} (±${expected.tolerance}).`
                    });
                }
            }
            // Boolean/Presence Check
            if (expected.unit === 'bool') {
                // Value 0 = false/missing, 1 = true/present
                if (lastAction.value !== expected.expectedValue) {
                    mistakes.push({
                        step: lastAction.step,
                        issue: knowledge.commonMistakes['no-indicator']?.issue || "Missing Step",
                        severity: "critical",
                        explanation: knowledge.commonMistakes['no-indicator']?.consequence || "Component missing."
                    });
                }
            }
        }
    }

    return { mistakes };
}

// Node 2: Generate Feedback with AI
async function generateFeedback(state: LabState): Promise<Partial<LabState>> {
    if (state.mistakes.length === 0 && !state.studentQuestion) {
        return { agentResponse: "Great work! You're following the procedure correctly." };
    }

    const knowledge = experimentKnowledge[state.experimentId];
    const systemPrompt = `You are a helpful chemistry lab assistant for students in rural areas (Nepal).
Experiment: ${knowledge?.name || state.experimentId}
Objective: ${knowledge?.objective || 'Learn chemistry'}
Safety Notes: ${(knowledge?.safetyNotes || []).join(', ')}

Your role:
1. Explain mistakes clearly.
2. Teach underlying concepts.
3. Be encouraging.
4. Use simple English or standard Nepali.

Common Mistakes Context:
${JSON.stringify(knowledge?.commonMistakes || {})}
`;

    let userPrompt = "";

    if (state.mistakes.length > 0) {
        userPrompt += `The student made these mistakes:\n${state.mistakes.map(m =>
            `- ${m.issue}: ${m.explanation} (Severity: ${m.severity})`
        ).join('\n')}\n\nProvide constructive feedback.`;
    }

    if (state.studentQuestion) {
        userPrompt += `\n\nStudent Question: "${state.studentQuestion}"\n\nAnswer based on the experiment context.`;
    }

    const messages = [
        new SystemMessage(systemPrompt),
        ...state.conversationHistory,
        new HumanMessage(userPrompt)
    ];

    const response = await model.invoke(messages);

    return {
        agentResponse: response.content as string,
        // Note: In LangGraph usually we append to state, but here we just return the new piece
        // The caller manages history persistence ideally
    };
}

// Node 3: Provide Learning Resources (Concept Reinforcement)
async function provideLearning(state: LabState): Promise<Partial<LabState>> {
    const criticalMistakes = state.mistakes.filter(m => m.severity === "critical");

    if (criticalMistakes.length > 0) {
        const systemPrompt = `Generate a very brief (1-2 sentences) "Key Concept" review related to this critical mistake:
${criticalMistakes[0].explanation}
Focus on the chemistry principle.`;

        // Using a separate call or same model
        const response = await model.invoke([new HumanMessage(systemPrompt)]);

        return {
            agentResponse: (state.agentResponse || "") + "\n\n📚 **Key Concept**: " + response.content
        };
    }

    return {};
}

// Routing
function routeNext(state: LabState): "generateFeedback" | "__end__" {
    if (state.mistakes.length > 0 || state.studentQuestion) {
        return "generateFeedback";
    }
    return "__end__";
}

// Build Graph
const workflow = new StateGraph<LabState>({
    channels: {
        experimentId: {
            value: (x: string, y?: string) => y ?? x,
            default: () => ""
        },
        studentActions: {
            value: (x: any[], y?: any[]) => y ?? x,
            default: () => []
        },
        mistakes: {
            value: (x: any[], y?: any[]) => y ?? x,
            default: () => []
        },
        studentQuestion: {
            value: (x?: string, y?: string) => y ?? x,
            default: () => undefined
        },
        agentResponse: {
            value: (x?: string, y?: string) => y ?? x,
            default: () => undefined
        },
        conversationHistory: {
            value: (x: any[], y?: any[]) => y ?? x,
            default: () => []
        }
    }
})
    .addNode("analyzeActions", analyzeActions)
    .addNode("generateFeedback", generateFeedback)
    .addNode("provideLearning", provideLearning)
    .addEdge("__start__", "analyzeActions")
    .addConditionalEdges("analyzeActions", routeNext)
    .addEdge("generateFeedback", "provideLearning")
    .addEdge("provideLearning", END);

export const labAssistantGraph = workflow.compile();
