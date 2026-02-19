
import { Automaton } from "../types";

/**
 * Unified Assistant Engine
 * orchestrates Local (Free/Fast) and Backend (Powerful) AI tasks
 */

export async function processAITask(
    type: 'voice' | 'vision',
    payload: string,
    currentNfa: Automaton
): Promise<{ updatedNfa: Automaton; source: 'local' | 'cloud'; message: string }> {

    // 1. If Voice, try Local Fast Parser first
    if (type === 'voice') {
        const localResult = tryLocalRules(payload, currentNfa);
        if (localResult) {
            return { updatedNfa: localResult, source: 'local', message: "Instant Local Engine updated automaton." };
        }
    }

    // 2. Fallback to Advanced Backend Assistant
    try {
        const response = await fetch('/api/assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, payload, currentNfa })
        });

        if (!response.ok) throw new Error("Backend neural link failed");

        const updatedNfa = await response.json();
        return {
            updatedNfa,
            source: 'cloud',
            message: type === 'vision' ? "Neural Vision successfully interpreted sketch." : "Advanced Brain updated automaton."
        };
    } catch (e) {
        throw new Error(`AI System Error: ${(e as Error).message}`);
    }
}

/**
 * Local Rule Processor (Handled instantly in browser)
 */
function tryLocalRules(text: string, current: Automaton): Automaton | null {
    const cmd = text.toLowerCase();
    const next = { ...current, states: [...current.states], transitions: [...current.transitions], finalStates: [...current.finalStates], alphabet: [...current.alphabet] };

    // Basic Add State
    const addMatch = cmd.match(/(?:add|create)\s+state\s+([a-z0-9]+)/i);
    if (addMatch) {
        const name = addMatch[1].toUpperCase();
        if (!next.states.includes(name)) {
            next.states.push(name);
            return next;
        }
    }

    // Basic Connect
    const connMatch = cmd.match(/(?:connect|from)\s+([a-z0-9]+)\s+to\s+([a-z0-9]+)\s+with\s+([a-z0-9ε]+)/i);
    if (connMatch) {
        const from = connMatch[1].toUpperCase();
        const to = connMatch[2].toUpperCase();
        let sym = connMatch[3].toLowerCase();
        if (sym === 'epsilon') sym = 'ε';

        if (next.states.includes(from) && next.states.includes(to)) {
            next.transitions.push({ from, to, symbol: sym });
            if (sym !== 'ε' && !next.alphabet.includes(sym)) next.alphabet.push(sym);
            return next;
        }
    }

    return null; // Let the backend handle anything more complex
}
