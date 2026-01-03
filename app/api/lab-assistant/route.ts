import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            experimentId,
            studentActions,
            studentQuestion,
            conversationHistory
        } = body;

        console.log("API Route Request:", { experimentId, actionCount: studentActions?.length, question: studentQuestion });

        if (!process.env.GEMINI_API_KEY) {
            console.error("Missing GEMINI_API_KEY");
            return NextResponse.json({ error: "Server Configuration Error: Missing API Key" }, { status: 500 });
        }

        // Validate input
        if (!experimentId || !studentActions) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Simple direct Gemini call for now
        // In api/route.ts and lab-assistant.js
        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash", // Use modelName instead of model
            maxOutputTokens: 1024,
            apiKey: process.env.GEMINI_API_KEY,
        });

        const systemPrompt = `You are a helpful chemistry lab assistant for students in Nepal.
You are helping with an Acid-Base Titration experiment.
Be encouraging and explain concepts simply.`;

        let userPrompt = studentQuestion || "The student is performing a titration experiment.";

        if (studentActions && studentActions.length > 0) {
            userPrompt += `\n\nRecent actions: ${studentActions.slice(-3).map((a: any) => `${a.action} (${a.value}${a.unit})`).join(', ')}`;
        }

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt)
        ];

        console.log("Calling Gemini...");
        const response = await model.invoke(messages);
        console.log("Gemini response received");

        return NextResponse.json({
            success: true,
            mistakes: [],
            response: response.content as string,
        });

    } catch (error: any) {
        console.error('Lab assistant error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        return NextResponse.json(
            { error: `Failed to process lab data: ${error.message}` },
            { status: 500 }
        );
    }
}
