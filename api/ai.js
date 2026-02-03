
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API_KEY configuration missing on server.' });
  }

  const { contents, systemInstruction, tools, model, responseSchema, responseMimeType } = req.body;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const targetModel = model || 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: contents,
      config: {
        systemInstruction: systemInstruction || "আপনি রাজবাড়ী জেলার একজন ভার্চুয়াল অ্যাসিস্ট্যান্ট।",
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
