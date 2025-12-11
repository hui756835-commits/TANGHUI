import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AIPackingListResponse, PackedItem } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API Key is missing! Please check Environment Variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const MODEL_NAME = 'gemini-2.5-flash';

export const generatePackingList = async (planDescription: string): Promise<AIPackingListResponse> => {
  const prompt = `
    User Travel Plan: "${planDescription}"

    Generate a comprehensive travel packing list and luggage recommendation.
    
    CRITICAL INSTRUCTIONS:
    1. LANGUAGE: All output MUST be in English.
    2. INTELLIGENCE: 
       - INFER the likely weather for the date/location (do not ask user).
       - INFER destination specific terrain/challenges (e.g., stairs in Chongqing -> suggest backpack).
    3. LUGGAGE: Create a "Package Name" (e.g., "Family Light Travel Set").
    4. ITEMS: Be granular.
    
    Output JSON format matching the schema.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          weather: {
             type: Type.OBJECT,
             properties: {
                 summary: { type: Type.STRING },
                 tempRange: { type: Type.STRING },
                 rainProb: { type: Type.STRING }
             }
          },
          destinationTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
          },
          luggageRecommendation: {
            type: Type.OBJECT,
            properties: {
              packageName: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["suitcase", "backpack", "handbag"] },
                    size: { type: Type.INTEGER },
                    reason: { type: Type.STRING }
                  }
                }
              },
              reason: { type: Type.STRING }
            },
            required: ["items", "reason", "packageName"]
          },
          categories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      reason: { type: Type.STRING },
                      defaultQuantity: { type: Type.INTEGER }
                    },
                    required: ["name", "defaultQuantity"]
                  }
                }
              },
              required: ["name", "items"]
            }
          }
        },
        required: ["luggageRecommendation", "categories", "weather", "destinationTips"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text) as AIPackingListResponse;
};

export const createAssistantChat = (plan: string, data: AIPackingListResponse): Chat => {
  const systemInstruction = `
    You are Packwise Assistant, a friendly and knowledgeable travel packing expert.
    
    CURRENT TRIP DETAILS:
    - User Plan: "${plan}"
    - Destination Weather: ${data.weather.summary} (${data.weather.tempRange})
    - Luggage: ${data.luggageRecommendation.packageName}
    
    Your role is to:
    1. Answer questions about what to pack.
    2. Suggest items based on the weather/activities.
    3. Provide brief travel tips for the destination.
    
    Keep responses concise (under 3 sentences) unless asked for elaboration. 
    Be encouraging and helpful.
  `;

  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction,
    }
  });
};
