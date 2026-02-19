
import { Automaton } from "../types";

export async function analyzeImage(imageBase64: string): Promise<Automaton> {
    try {
        const response = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageBase64 }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to analyze image');
        }

        const data: Automaton = await response.json();
        return data;
    } catch (e) {
        console.error("Failed to analyze image:", e);
        throw e;
    }
}

export async function parseVoiceCommand(transcript: string, currentNfa: Automaton): Promise<Automaton> {
    try {
        const response = await fetch('/api/voice-command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transcript, currentNfa }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process voice command');
        }

        const data: Automaton = await response.json();
        return data;
    } catch (e) {
        console.error("Failed to process voice command:", e);
        throw e;
    }
}
