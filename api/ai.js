
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API_KEY missing',
      details: 'Vercel Settings-এ API_KEY সেট করুন।' 
    });
  }

  const { contents, systemInstruction, tools, model, responseMimeType, responseSchema } = req.body;
  const ai = new GoogleGenAI({ apiKey });
  const targetModel = model || 'gemini-3-flash-preview';

  // AI কল করার ফাংশন
  const generateAIContent = async (useSearch) => {
    const config = {
      systemInstruction: systemInstruction || "আপনি রাজবাড়ী জেলার একজন স্মার্ট তথ্য সহায়িকা।",
      temperature: 0.7,
      responseMimeType: responseMimeType,
      responseSchema: responseSchema
    };

    // যদি সার্চ অন থাকে তবেই টুলস অ্যাড হবে
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    return await ai.models.generateContent({
      model: targetModel,
      contents: contents,
      config: config,
    });
  };

  try {
    // ১. প্রথমে সার্চসহ চেষ্টা করা হবে
    let response = await generateAIContent(true);

    return res.status(200).json({
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null,
      mode: 'live_search'
    });

  } catch (error) {
    console.error('AI Error:', error.message);

    // ২. যদি কোটা (429) বা রিসোর্স এরর হয়, তবে সার্চ ছাড়াই আবার চেষ্টা করবে
    if (error.message.includes("429") || error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")) {
      try {
        console.log("Quota exceeded, retrying without Google Search...");
        let fallbackResponse = await generateAIContent(false);
        
        return res.status(200).json({
          text: fallbackResponse.text,
          groundingMetadata: null,
          mode: 'offline_knowledge' // এই মোডটি ফ্রন্টএন্ডে মেসেজ দেখাবে
        });
      } catch (fallbackError) {
        return res.status(500).json({ 
          error: "সব প্রচেষ্টাই ব্যর্থ হয়েছে।",
          details: "আপনার এপিআই কী-র একদম বেসিক লিমিটও শেষ হয়ে গেছে। দয়া করে ১০-১৫ মিনিট অপেক্ষা করুন।" 
        });
      }
    }

    return res.status(500).json({ 
      error: 'AI Request Failed',
      details: error.message 
    });
  }
}
