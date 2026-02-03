import { RAJBARI_DATA } from './constants.tsx';

export const db = {
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: params.contents,
          systemInstruction: params.systemInstruction,
          tools: params.tools,
          model: params.model,
          responseMimeType: params.responseMimeType,
          responseSchema: params.responseSchema
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // যদি details থাকে তবে সেটিই দেখানো হবে
        const errorMsg = data.details || data.error || "AI রিকোয়েস্ট ব্যর্থ হয়েছে।";
        throw new Error(errorMsg);
      }

      return {
        text: data.text || "",
        groundingMetadata: data.groundingMetadata || null
      };
    } catch (error: any) {
      console.error("AI Bridge Error:", error);
      throw new Error(error.message || "এআই সার্ভারের সাথে যোগাযোগ করা সম্ভব হচ্ছে না।");
    }
  },

  getCategory: async (category: string) => {
    return (RAJBARI_DATA as any)[category] || [];
  }
};
