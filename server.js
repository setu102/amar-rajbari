import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.post('/api/ai', async (req, res) => {
    const { contents, systemInstruction, tools, model, responseMimeType, responseSchema } = req.body;
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "Server Configuration Error: API_KEY is missing." });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const callGemini = async (useTools) => {
        return await ai.models.generateContent({
            model: model || 'gemini-3-flash-preview',
            contents: contents,
            config: {
                systemInstruction: systemInstruction || `আপনি রাজবাড়ী জেলার একজন ভার্চুয়াল অ্যাসিস্ট্যান্ট।`,
                tools: useTools ? [{ googleSearch: {} }] : [],
                temperature: 0.7,
                responseMimeType: responseMimeType,
                responseSchema: responseSchema
            }
        });
    };

    try {
        const response = await callGemini(true);
        res.json({
            text: response.text || "",
            groundingMetadata: response.candidates?.[0]?.groundingMetadata || null,
            mode: 'live_search'
        });
    } catch (error) {
        console.error("Gemini Primary Error:", error.message);
        if (error.message.includes("429") || error.message.includes("quota")) {
            try {
                const fallback = await callGemini(false);
                return res.json({
                    text: fallback.text || "",
                    groundingMetadata: null,
                    mode: 'offline_knowledge'
                });
            } catch (e) {
                return res.status(500).json({ error: "API Limit Reached. Try again later." });
            }
        }
        res.status(500).json({ error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => console.log(`Rajbari Smart Server active on port ${port}`));
