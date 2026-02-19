import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'no-key',
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "");

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image data' });

    const prompt = `Analyze this image of a finite automaton (NFA or DFA) diagram.
              
              Task: Extract the formal definition of the automaton.
              
              Instructions:
              1. Identify all states (circles).
              2. Identify the alphabet (labels on arrows).
              3. Identify the initial state (starting arrow).
              4. Identify final/accepting states (double circles).
              5. Extract all transitions. Standardize epsilon labels to 'ε'.
              6. If one arrow has multiple symbols (e.g. "0,1"), create separate transition objects.
              
              Return ONLY a valid JSON object matching this structure:
              {
                "states": ["A", "B", ...],
                "alphabet": ["0", "1", ...],
                "transitions": [
                  { "from": "A", "to": "B", "symbol": "0" },
                  ...
                ],
                "initialState": "A",
                "finalStates": ["B", ...]
              }`;

    // Helper to try Gemini
    const tryGemini = async () => {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('Gemini API Key not configured');

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // Remove data:image/png;base64, prefix if present
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/png"
                }
            }
        ]);

        const text = result.response.text();
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText);
    };

    // Helper to try OpenAI
    const tryOpenAI = async () => {
        if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI API Key not configured');

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: imageBase64 } },
                    ],
                },
            ],
            max_tokens: 4096,
        });

        const text = response.choices[0].message.content;
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText);
    };

    try {
        // Try OpenAI first if key exists
        if (process.env.OPENAI_API_KEY) {
            try {
                const result = await tryOpenAI();
                return res.status(200).json(result);
            } catch (openAiError) {
                console.warn('OpenAI failed, falling back to Gemini:', openAiError.message);
                // If it's a quota error, we definitely want to fall back
                const result = await tryGemini();
                return res.status(200).json(result);
            }
        } else {
            // Fallback to Gemini if no OpenAI key
            const result = await tryGemini();
            return res.status(200).json(result);
        }
    } catch (error) {
        console.error('Final Analysis Error:', error);
        res.status(500).json({ error: 'Failed to analyze image: ' + error.message });
    }
}
