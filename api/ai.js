
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // এপিআই কী ট্রিম করা হচ্ছে যাতে কোনো স্পেস না থাকে
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API_KEY configuration missing on server.',
      details: 'Vercel Settings-এ GEMINI_API_KEY চেক করুন এবং Redeploy দিন।' 
    });
  }

  const { contents, systemInstruction, tools, model } = req.body;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // gemini-3-flash-preview সাধারণত সব রিজিয়নে দ্রুত কাজ করে
    const targetModel = model || 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: contents,
      config: {
        systemInstruction: systemInstruction || "আপনি রাজবাড়ী জেলার একজন স্মার্ট তথ্য সহায়িকা।",
        tools: tools || [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    if (!response || !response.text) {
      throw new Error("এআই থেকে কোনো উত্তর পাওয়া যায়নি। সম্ভবত সেফটি ফিল্টারে ব্লক হয়েছে।");
    }

    return res.status(200).json({
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null,
    });
  } catch (error) {
    console.error('Gemini Backend Error:', error);
    
    // জেমিনি থেকে আসা আসল এরর মেসেজটি পাঠানো হচ্ছে
    let errorMessage = error.message || "Unknown AI error";
    if (errorMessage.includes("403") || errorMessage.includes("permission")) {
      errorMessage = "এপিআই কী-এর অনুমতি নেই অথবা রিজিয়ন সাপোর্ট করছে না।";
    } else if (errorMessage.includes("404")) {
      errorMessage = "মডেলটি খুঁজে পাওয়া যায়নি। মডেল নাম চেক করুন।";
    } else if (errorMessage.includes("API key not valid")) {
      errorMessage = "আপনার এপিআই কী-টি সঠিক নয়। নতুন একটি কী ট্রাই করুন।";
    }

    return res.status(500).json({ 
      error: 'AI Request Failed',
      details: errorMessage 
    });
  }
}
