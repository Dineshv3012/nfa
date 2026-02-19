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

    const { transcript, currentNfa } = req.body;
    if (!transcript) return res.status(400).json({ error: 'No transcript' });

    const prompt = `
      You are an assistant modifying a Finite Automaton (NFA) based on a user's voice command.
      Current NFA State:
      ${JSON.stringify(currentNfa, null, 2)}

      User Command: "${transcript}"

      Return the UPDATED NFA as a valid JSON object.
      Follow these rules:
      1. If the user asks to "add state X", add it to 'states'.
      2. If the user asks to "connect A to B with 0", add a transition.
      3. If the user asks to "make X final", add to 'finalStates'.
      4. If the user asks to "remove...", remove the corresponding elements.
      5. Ensure the structure is valid: { states, alphabet, transitions, initialState, finalStates }.
      6. Return ONLY the JSON.
    `;

    const tryGemini = async () => {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error('Gemini API Key not configured');

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText);
    };

    const tryOpenAI = async () => {
        if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI API Key not configured');

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a helpful assistant that outputs only valid JSON." },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
        });

        const text = response.choices[0].message.content;
        return JSON.parse(text);
    };

    try {
        if (process.env.OPENAI_API_KEY) {
            try {
                const result = await tryOpenAI();
                return res.status(200).json(result);
            } catch (openAiError) {
                console.warn('OpenAI failed, falling back to Gemini:', openAiError.message);
                const result = await tryGemini();
                return res.status(200).json(result);
            }
        } else {
            const result = await tryGemini();
            return res.status(200).json(result);
        }
    } catch (error) {
        console.error('Final Voice Command Error:', error);
        res.status(500).json({ error: 'Failed to process voice command: ' + error.message });
    }
}
