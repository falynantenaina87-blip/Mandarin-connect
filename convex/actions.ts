"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const translateText = action({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the following text (French/English) into Simplified Chinese (Hanzi). Provide Pinyin. Text: "${args.text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hanzi: { type: Type.STRING },
              pinyin: { type: Type.STRING },
            },
            required: ["hanzi", "pinyin"],
          },
        },
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Gemini Error", e);
      throw new Error("Translation failed");
    }
  },
});

export const generateQuiz = action({
  args: { topic: v.string() },
  handler: async (ctx, args) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `You are an expert Mandarin teacher. Generate 5 multiple-choice questions for a beginner about: "${args.topic}". Return JSON array.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["question", "options", "correctAnswer", "explanation"],
            },
          },
        },
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Gemini Quiz Error", e);
      throw new Error("Quiz generation failed");
    }
  },
});

export const generateImage = action({
  args: { prompt: v.string(), baseImage: v.optional(v.string()) },
  handler: async (ctx, args) => {
    try {
      const parts: any[] = [];
      if (args.baseImage) {
        let mimeType = 'image/jpeg';
        let data = args.baseImage;

        // Correctly extract MIME type and data if it's a data URL
        if (args.baseImage.startsWith('data:')) {
            const matches = args.baseImage.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                mimeType = matches[1];
                data = matches[2];
            }
        } else {
            // Fallback: try to strip header if present, assume jpeg otherwise
            data = args.baseImage.split(',')[1] || args.baseImage;
        }

        parts.push({
          inlineData: {
            data: data,
            mimeType: mimeType,
          },
        });
      }
      parts.push({ text: args.prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
      }
      return null;
    } catch (e) {
      console.error("Gemini Image Error", e);
      throw new Error("Image generation failed");
    }
  },
});
