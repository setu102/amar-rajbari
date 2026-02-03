
import { RAJBARI_DATA } from './constants.tsx';

export const db = {
  /**
   * টেক্সট থেকে JSON ডাটা খুঁজে বের করে।
   */
  extractJSON: (text: string) => {
    if (!text) return null;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (e) {
      console.error("JSON Parsing Error:", e);
      return null;
    }
  },

  /**
   * এআই কল করার মূল ফাংশন।
   * ফ্রন্টএন্ড থেকে নিরাপদ সার্ভারলেস API রুটে রিকোয়েস্ট পাঠায়।
   */
  callAI: async (params: { 
    contents: any; 
    systemInstruction?: string; 
    tools?: any[]; 
    model?: string;
    responseMimeType?: string;
    responseSchema?: any;
  }) => {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: params.contents,
          systemInstruction: params.systemInstruction,
          tools: params.tools,
          model: params.model,
          responseMimeType: params.responseMimeType,
          responseSchema: params.responseSchema
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const serverMessage = errorPayload?.error || errorPayload?.details;
        throw new Error(serverMessage || "AI Request Failed.");
      }

      const data = await response.json();
      if (!data?.text) {
        throw new Error("AI returned an empty or invalid response.");
      }

      return {
        text: data.text,
        groundingMetadata: data.groundingMetadata || null
      };
    } catch (error: any) {
      console.error("Gemini AI Engine Error:", error);
      // ইউজার যাতে এরর বুঝতে পারে তাই বিস্তারিত থ্রো করা হচ্ছে
      throw new Error(error.message || "Something went wrong with AI.");
    }
  },

  getCategory: async (category: string) => {
    return (RAJBARI_DATA as any)[category] || [];
  }
};
