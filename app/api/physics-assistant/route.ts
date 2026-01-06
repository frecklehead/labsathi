import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { message, context } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.3,
            },
        });

        const systemPrompt = `You are a Physics Learning Assistant for a virtual lab simulator where students convert a galvanometer into a voltmeter.

CURRENT EXPERIMENT CONTEXT:
The user is working on "Galvanometer to Voltmeter Conversion".
- A galvanometer (G) measures small currents.
- Adding a high resistance (R) in SERIES converts it to measure voltage.
- Calculation formula: $$R = \\frac{V}{I_g} - G$$

EXPERIMENT STEPS:
1. Calculate required series resistance R
2. Assemble circuit: Battery → Rheostat → Galvanometer → Resistance Box (all in series)
3. Set Resistance Box to calculated R value
4. Connect Voltmeter in PARALLEL across (Galvanometer + Resistance Box) to verify
5. Vary Rheostat to take multiple V-I readings

INSTRUCTIONS:
- Identify the target component if the question or answer is specifically about one (galvanometer, voltmeter, rheostat, battery, resistance_box).
- Use the CURRENT LAB STATE provided below to give specific, context-aware advice.
- If the user asks "what next" or "what to do", look at the NEXT ACTION in the state.
- Keep answers concise and direct.
- Use double backslashes for LaTeX: $$\\frac{a}{b}$$.
- Reference specific circuit values if they are present in the context.

${context || "No specific state provided yet."}

Return your response in JSON format:
{
  "reply": "Your markdown answer here...",
  "focusComponent": "galvanometer" | "voltmeter" | "rheostat" | "battery" | "resistance_box" | "none"
}`;

        const fullPrompt = `${systemPrompt}\n\nUser Question: ${message}`;
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text().replace(/```json\n?|\n?```/g, '').trim();

        try {
            const data = JSON.parse(text);
            return NextResponse.json(data);
        } catch (e) {
            // Fallback if AI doesn't return perfect JSON
            return NextResponse.json({
                reply: text,
                focusComponent: "none"
            });
        }
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: "Failed to fetch response from AI" }, { status: 500 });
    }
}