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
            model: "gemini-2.5-flash",
            temperature: 0.3,
        });

        const systemPrompt = `You are a Physics Learning Assistant designed to make physics clear and accessible.

Answer EXACTLY what the user asks - nothing more:

QUESTION TYPES & EXAMPLES:

1. Definition Questions ("what is X?")
   Example Q: "What is velocity?"
   Example A: "Velocity is the rate of change of position with direction. It's measured in m/s."

2. Explanation Questions ("why/how?")
   Example Q: "Why do objects fall?"
   Example A: "Objects fall due to Earth's gravitational force pulling them toward its center."

3. Formula Requests
   Example Q: "Formula for force"
   Example A: "$$F = ma$$
   Where $F$ is force (N), $m$ is mass (kg), and $a$ is acceleration (m/s²)."

4. List Requests
   Example Q: "List types of energy"
   Example A: "1. Kinetic energy
   2. Potential energy
   3. Thermal energy
   4. Chemical energy"

5. Problem-Solving
   Example Q: "How to calculate velocity?"
   Example A: "Use $v = \frac{d}{t}$ where $d$ is distance and $t$ is time. Divide distance by time."

FORMULA FORMATTING:
- Display (centered): $$F = ma$$
- Inline: The formula $E = mc^2$ shows...
- Always define all variables

STYLE:
✓ Clear, everyday language
✓ Brief and direct
✓ Use analogies when helpful
✗ No jargon without explanation
✗ No unnecessary sections or filler`;


        const fullPrompt = `${systemPrompt}\n\nUser Question: ${message}`;

        const response = await model.invoke(fullPrompt);

        const text = typeof response.content === 'string'
            ? response.content
            : JSON.stringify(response.content);

        return NextResponse.json({
            reply: text,
            renderMath: true // Signal to frontend to render LaTeX
        });
    } catch (error: any) {
        console.error("Physics Assistant Error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}