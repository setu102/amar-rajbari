import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // শুধুমাত্র POST রিকোয়েস্ট গ্রহণ করবে
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  /**
   * ইউজার স্ক্রিনশট অনুযায়ী GEMINI_API_KEY ভেরিয়েবলটি চেক করা হচ্ছে।
   * সাধারণত Vercel-এ API_KEY বা GEMINI_API_KEY নামে সেভ করা হয়।
   */
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API_KEY configuration missing on server.',
      details: 'আপনার Vercel Settings-এ ভেরিয়েবলটির নাম GEMINI_API_KEY অথবা API_KEY আছে কিনা চেক করুন এবং Redeploy দিন।' 
    });
  }

  const { contents, systemInstruction, tools, model, responseSchema, responseMimeType } = req.body;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const targetModel = model || 'gemini-3-pro-preview';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: contents,
      config: {
        systemInstruction: systemInstruction || "আপনি রাজবাড়ী জেলার একজন স্মার্ট তথ্য সহায়িকা।",
        tools: tools || [{ googleSearch: {} }],
        temperature: 0.1,
        responseSchema: responseSchema,
        responseMimeType: responseMimeType,
      },
    });

    return res.status(200).json({
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null,
    });
  } catch (error) {
    console.error('Gemini Backend Error:', error);
    return res.status(500).json({ 
      error: 'AI Request Failed',
      details: error.message 
    });
  }
}
