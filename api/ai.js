
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // শুধুমাত্র POST রিকোয়েস্ট গ্রহণ করবে
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Vercel Environment Variable থেকে API_KEY নেওয়া
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    // এই এররটি আসলে বুঝবেন Vercel-এ Environment Variable সেট করার পর Redeploy করা হয়নি
    return res.status(500).json({ 
      error: 'API_KEY configuration missing on server.',
      details: 'Please set API_KEY in Vercel settings and REDEPLOY your project.' 
    });
  }

  const { contents, systemInstruction, tools, model, responseSchema, responseMimeType } = req.body;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // টাস্ক অনুযায়ী মডেল নির্বাচন
    // চ্যাট বা জটিল টেক্সট টাস্কের জন্য gemini-3-pro-preview সেরা
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

    // সঠিক ডাটা রিটার্ন করা
    return res.status(200).json({
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null,
    });
  } catch (error) {
    console.error('Gemini Backend Error:', error);
    
    // নির্দিষ্ট এপিআই এরর হ্যান্ডলিং
    if (error.message && error.message.includes("API key not valid")) {
      return res.status(401).json({ error: 'Invalid API Key', details: 'আপনার দেওয়া এপিআই কী-টি সঠিক নয়।' });
    }

    return res.status(500).json({ 
      error: 'AI Request Failed',
      details: error.message 
    });
  }
}

