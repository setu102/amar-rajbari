
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // API_KEY অথবা GEMINI_API_KEY উভয়ই চেক করবে
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API Key missing',
      details: 'Vercel বা হোস্টিং এনভায়রনমেন্টে API_KEY সেট করা নেই।' 
    });
  }

  const { contents, systemInstruction, tools, model, responseMimeType, responseSchema } = req.body;
  const ai = new GoogleGenAI({ apiKey });
  
  // প্রাইমারি এবং ফলব্যাক মডেল সেটআপ
  const primaryModel = model || 'gemini-3-flash-preview';
  const fallbackModel = 'gemini-2.5-flash-lite-latest';

  const generateAI = async (useModel, useTools) => {
    return await ai.models.generateContent({
      model: useModel,
      contents: contents,
      config: {
        systemInstruction: systemInstruction || "আপনি রাজবাড়ী জেলার একজন তথ্য সহায়িকা।",
        tools: useTools ? [{ googleSearch: {} }] : [],
        temperature: 0.7,
        responseMimeType: responseMimeType,
        responseSchema: responseSchema
      },
    });
  };

  try {
    // ১. প্রথম চেষ্টা: প্রাইমারি মডেল + গুগল সার্চ
    console.log("Attempting with Google Search...");
    let response = await generateAI(primaryModel, true);

    return res.status(200).json({
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null,
      mode: 'live_search'
    });

  } catch (error) {
    console.warn('Initial AI Attempt Failed:', error.message);

    // ২. দ্বিতীয় চেষ্টা: ফলব্যাক মডেল + গুগল সার্চ ছাড়া (যেকোনো এরর হলে)
    try {
      console.log("Falling back to standard mode without tools...");
      let fallbackResponse = await generateAI(fallbackModel, false);
      
      return res.status(200).json({
        text: fallbackResponse.text,
        groundingMetadata: null,
        mode: 'offline_knowledge'
      });
    } catch (fallbackError) {
      console.error('All AI attempts failed:', fallbackError.message);
      return res.status(500).json({ 
        error: "AI Services Unavailable",
        details: fallbackError.message 
      });
    }
  }
}
