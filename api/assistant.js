import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'no-key',
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "");

/**
 * Advanced Neural Assistant for Automata Analysis
 * Handles: Drawing, Voice, and Formal Conversion Logic
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, payload, currentNfa } = req.body;

    // --- Process 1: Voice Command Analysis ---
    if (type === 'voice') {
        return handleVoice(payload, currentNfa, res);
    }

    // --- Process 2: Drawing/Image Analysis ---
    if (type === 'vision') {
        return handleVision(payload, res);
    }

    // --- Process 3: Formal Conversion Logic (Backend helper) ---
    if (type === 'conversion') {
        // This is handled by the local converter services, but we can add AI optimization here if needed
        return res.status(200).json({ status: "Logic processed locally for performance" });
    }

    return res.status(400).json({ error: 'Invalid assistant task type' });
}

async function handleVoice(transcript, currentNfa, res) {
    const prompt = `
      You are the Neural Assistant for an ε-NFA to NFA Converter.
      CURRENT STATE: ${JSON.stringify(currentNfa)}
      USER COMMAND: "${transcript}"
      
      TASK: Generate a valid JSON update for the automaton.
      RULES:
      1. If adding a state, ensure it follows the naming convention (e.g., q0, q1 or A, B).
      2. If connecting states, specify the symbol. Handle 'epsilon' or 'e' as 'ε'.
      3. Support complex requests like "Delete all states except A" or "Swap final and initial states".
      4. Return ONLY a JSON object: { states, alphabet, transitions, initialState, finalStates }.
    `;

    try {
        const result = await tryCloudAI(prompt, "json_object");
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

async function handleVision(imageBase64, res) {
    const prompt = `Interpret this automaton sketch. Extract states, alphabet, transitions, initial state, and final states. Return ONLY valid JSON.`;

    try {
        // Vision tasks always use the most powerful model available (Cloud)
        const result = await tryCloudVision(prompt, imageBase64);
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

// Unified Cloud AI Caller with Fallback
async function tryCloudAI(prompt, format) {
    if (process.env.OPENAI_API_KEY) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: format },
            });
            return JSON.parse(response.choices[0].message.content);
        } catch (e) {
            console.warn("OpenAI failed, falling back to Gemini...");
        }
    }

    // Gemini Fallback
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
}

async function tryCloudVision(prompt, base64) {
    // Vision logic implementation (fallback included)
    if (process.env.OPENAI_API_KEY) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: base64 } }
                    ]
                }],
            });
            return JSON.parse(response.choices[0].message.content.replace(/```json/g, "").replace(/```/g, "").trim());
        } catch (e) { console.warn("OpenAI Vision failed"); }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const data = base64.includes(',') ? base64.split(',')[1] : base64;
    const result = await model.generateContent([prompt, { inlineData: { data, mimeType: "image/png" } }]);
    return JSON.parse(result.response.text().replace(/```json/g, "").replace(/```/g, "").trim());
}
