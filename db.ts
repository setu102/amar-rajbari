
import { GoogleGenAI } from "@google/genai";
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
   * প্রতিবার কলের আগে নতুন GoogleGenAI ইনস্ট্যান্স তৈরি করে (এটি নিয়ম)।
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
      // এপিআই কী চেক (নির্দেশিকা অনুযায়ী process.env.API_KEY ব্যবহার করা হয়েছে)
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API_KEY is missing in environment variables.");
      }

      // ১. প্রতিবার নতুন ক্লায়েন্ট তৈরি (রুলস অনুযায়ী)
      const ai = new GoogleGenAI({ apiKey });
      
      const modelName = params.model || 'gemini-3-flash-preview';
      
      // ২. কনটেন্ট ফরম্যাট চেক (Array of Content objects: { role, parts: [{ text }] })
      let formattedContents = [];
      if (Array.isArray(params.contents)) {
        formattedContents = params.contents.map(c => ({
          role: c.role || 'user',
          parts: Array.isArray(c.parts) ? c.parts : [{ text: String(c.text || c.parts || "") }]
        }));
      } else {
        formattedContents = [{
          role: 'user',
          parts: [{ text: String(params.contents) }]
        }];
      }

      // ৩. সরাসরি জেনারেট কন্টেন্ট কল
      const response = await ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config: {
          systemInstruction: params.systemInstruction || "আপনি রাজবাড়ী জেলার একজন ভার্চুয়াল অ্যাসিস্ট্যান্ট।",
          tools: params.tools || [{ googleSearch: {} }],
          temperature: 0.1,
          responseMimeType: params.responseMimeType,
          responseSchema: params.responseSchema
        }
      });

      if (!response || !response.text) {
        throw new Error("AI returned an empty or invalid response.");
      }

      return {
        text: response.text,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata || null
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
