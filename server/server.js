
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

// OpenAI Setup
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Routes
app.post('/api/analyze-image', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'No image data' });

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: 'OpenAI API Key not configured' });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this image of a finite automaton (NFA or DFA) diagram.
              
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
              }`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageBase64,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 4096,
        });

        const text = response.choices[0].message.content;
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const json = JSON.parse(cleanedText);

        res.json(json);
    } catch (error) {
        console.error('Image Analysis Error:', error);
        res.status(500).json({ error: 'Failed to analyze image' });
    }
});

app.post('/api/voice-command', async (req, res) => {
    try {
        const { transcript, currentNfa } = req.body;
        if (!transcript) return res.status(400).json({ error: 'No transcript' });

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: 'OpenAI API Key not configured' });
        }

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

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a helpful assistant that outputs only valid JSON." },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
        });

        const text = response.choices[0].message.content;
        const json = JSON.parse(text);

        res.json(json);
    } catch (error) {
        console.error('Voice Command Error:', error);
        res.status(500).json({ error: 'Failed to process voice command' });
    }
});

app.listen(port, () => {
    console.log(`AI Server running on http://localhost:${port}`);
});
