import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

        res.status(200).json(json);
    } catch (error) {
        console.error('Image Analysis Error:', error);
        res.status(500).json({ error: 'Failed to analyze image: ' + error.message });
    }
}
