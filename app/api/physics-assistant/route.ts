import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API Key not found" }, { status: 500 });
        }

        const model = new ChatGoogleGenerativeAI({
            apiKey: apiKey,
            model: "gemini-2.5-flash", // Updated model name
            temperature: 0.2,
        });

        const systemPrompt = `You are a specialized Physics Assistant.
Your task is to answer user questions about physics concepts, experiments, and calculations.
CRITICAL: You MUST structure your answer into exactly these four labeled sections. Do not add any conversational filler.

**Why**: [Explain the underlying physical principle or cause concisely]
**What**: [Define the concept or phenomenon briefly]
**How**: [Describe the mechanism, process, or steps]
**Formulas**: [Provide relevant equations. Use LaTeX format for math, e.g., $F=ma$]

Keep the entire response very short, concise, and direct.`;

        const fullPrompt = `${systemPrompt}\n\nUser Question: ${message}`;

        const response = await model.invoke(fullPrompt);

        const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

        return NextResponse.json({ reply: text });
    } catch (error: any) {
        console.error("Physics Assistant Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}