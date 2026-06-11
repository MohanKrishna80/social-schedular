import { GoogleGenAI } from "@google/genai";
import { AuthRequest } from "../middleware/authMiddlewares.js";
import { Response } from "express";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateContent = async (req:AuthRequest, res:Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        message: "Prompt is required",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are a professional LinkedIn content writer.

Generate an engaging LinkedIn post based on the user's idea.
- Make it professional
- Add emojis where relevant
- Add a call-to-action when appropriate
- Include 3-5 relevant hashtags

User Idea:
${prompt}
      `,
    });

    res.json({
      content: response.text,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate content",
    });
  }
};