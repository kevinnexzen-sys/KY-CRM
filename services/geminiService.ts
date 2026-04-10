
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const generateAIResponse = async (prompt: string, context?: string, images?: { data: string, mimeType: string }[]): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return "Gemini API Key is missing. Please set GEMINI_API_KEY or select an API key in the settings.";
  }

  try {
    const ai = getClient();
    const baseInstruction = "You are an AI assistant for the DealPipeline CRM. Help users manage work orders, technicians, and operations.";
    const emailInstruction = "If asked to draft an email, strictly follow this format:\n\n**Subject:** [Subject Line]\n\n[Body Text]\n\nEnsure the tone is professional, clear, and empathetic.";
    
    const systemInstruction = context 
      ? `${baseInstruction} User context: ${context}. ${emailInstruction} Keep other answers concise and professional.`
      : `${baseInstruction} ${emailInstruction}`;

    const parts: any[] = [];
    
    if (images && images.length > 0) {
      images.forEach(img => {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data
          }
        });
      });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error communicating with the AI service.";
  }
};

export const generateEstimateAI = async (inspectionReport: string): Promise<any> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing.");
  }

  try {
    const ai = getClient();
    const prompt = `
      You are a professional estimator for a home services CRM. 
      Analyze the following inspection report and generate a detailed estimate.
      
      SOP RULES:
      1. Identify all issues and required repairs.
      2. Labor: Estimate hours based on trade (Plumbing: $120/hr, Electrical: $135/hr, HVAC: $150/hr, General: $85/hr).
      3. Parts: List specific parts needed with estimated market prices + 20% markup.
      4. Structure: Provide a JSON object with:
         - summary: A brief overview of the work.
         - lineItems: Array of { description: string, quantity: number, unitPrice: number, type: 'Labor' | 'Part' }.
         - totalAmount: Sum of all line items.
         - recommendations: Any additional professional advice.

      INSPECTION REPORT:
      ${inspectionReport}
      
      Return ONLY the JSON object.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Estimate Error:", error);
    throw error;
  }
};
