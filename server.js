
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
    const { contents, systemInstruction, tools, responseSchema, responseMimeType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "Server Configuration Error: API_KEY is missing." });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: contents,
            config: {
                systemInstruction: systemInstruction || `আপনি রাজবাড়ী জেলার একজন ভার্চুয়াল অ্যাসিস্ট্যান্ট।`,
                tools: tools || [{ googleSearch: {} }],
                responseSchema: responseSchema,
                responseMimeType: responseMimeType,
                temperature: 0.1,
            }
        });

        res.json({
            text: response.text || "",
            groundingMetadata: response.candidates?.[0]?.groundingMetadata || null
        });
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        res.status(500).json({ error: error.message || "Gemini API call failed." });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => console.log(`Rajbari Smart Server active on port ${port}`));
