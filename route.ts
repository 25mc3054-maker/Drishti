import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-1.5-flash for high speed and efficiency
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const systemPrompt = `You are an Expert Solution Architect. Analyze this image of a real-world business scenario (handwritten notes, messy shelves, or diagrams). Output a structured JSON containing:
    A) The problem identified (key: "problem").
    B) A mathematical optimization plan (key: "optimizationPlan").
    C) The exact code/structure needed to build a dashboard for this business (key: "dashboardStructure").`;

    const result = await model.generateContent([
      systemPrompt,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type,
        },
      },
    ]);

    const responseText = result.response.text();
    return NextResponse.json(JSON.parse(responseText));

  } catch (error) {
    console.error("Error processing vision request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}