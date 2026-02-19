import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

        res.status(200).json(json);
    } catch (error) {
        console.error('Voice Command Error:', error);
        res.status(500).json({ error: 'Failed to process voice command: ' + error.message });
    }
}
