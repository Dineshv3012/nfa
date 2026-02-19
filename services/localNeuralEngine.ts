
import nlp from 'compromise';
import { Automaton } from "../types";

/**
 * Advanced Local Neural Engine
 * Uses NLP (compromise) to understand complex natural language instructions
 * without calling any external APIs.
 */

export interface NeuralResult {
    updated: Automaton;
    message: string;
    score: number; // Reliability score 0-1
}

export function processLocalIntelligence(text: string, current: Automaton): NeuralResult | null {
    const doc = nlp(text.toLowerCase());
    const next = {
        ...current,
        states: [...current.states],
        transitions: [...current.transitions],
        finalStates: [...current.finalStates],
        alphabet: [...current.alphabet]
    };

    let processed = false;
    let feedback = "";

    // 1. Complex State Handling (Add/Create)
    // Example: "Please create three new states called q1 q2 and q3"
    if (doc.has('(add|create|new|make) #Noun+')) {
        const potentialStates = doc.match('(q[0-9]+|[a-z])').text().split(' ');
        const added: string[] = [];
        potentialStates.forEach(s => {
            const name = s.toUpperCase().trim();
            if (name && !next.states.includes(name)) {
                next.states.push(name);
                added.push(name);
                processed = true;
            }
        });
        if (added.length > 0) feedback += `Created ${added.join(', ')}. `;
    }

    // 2. Removal Logic
    // Example: "Remove all states except A" or "Delete state q1"
    if (doc.has('(remove|delete|destroy|clear)')) {
        if (doc.has('except') || doc.has('all')) {
            const keepers = doc.match('except #Noun').text().replace('except', '').trim().toUpperCase();
            if (keepers) {
                next.states = next.states.filter(s => keepers.includes(s));
                next.transitions = next.transitions.filter(t => keepers.includes(t.from) && keepers.includes(t.to));
                next.finalStates = next.finalStates.filter(s => keepers.includes(s));
                processed = true;
                feedback += `Cleared everything except ${keepers}. `;
            }
        } else {
            const toRemove = doc.match('(q[0-9]+|[a-z])').text().toUpperCase().trim();
            if (next.states.includes(toRemove)) {
                next.states = next.states.filter(s => s !== toRemove);
                next.transitions = next.transitions.filter(t => t.from !== toRemove && t.to !== toRemove);
                next.finalStates = next.finalStates.filter(s => s !== toRemove);
                processed = true;
                feedback += `Removed ${toRemove}. `;
            }
        }
    }

    // 3. Advanced Connection Logic (NLP Based)
    // Example: "Connect state A to B on symbol 0"
    if (doc.has('(connect|transition|from)')) {
        const statesFound = doc.match('(q[0-9]+|[a-z])').text().toUpperCase().split(' ');
        const symbolMatch = doc.match('(0|1|epsilon|ε|e)').text().toLowerCase();
        let sym = symbolMatch;
        if (sym === 'epsilon' || sym === 'e') sym = 'ε';

        if (statesFound.length >= 2) {
            const from = statesFound[0];
            const to = statesFound[1];
            if (next.states.includes(from) && next.states.includes(to)) {
                next.transitions.push({ from, to, symbol: sym || 'ε' });
                if (sym && sym !== 'ε' && !next.alphabet.includes(sym)) next.alphabet.push(sym);
                processed = true;
                feedback += `Linked ${from} → ${to} [${sym || 'ε'}]. `;
            }
        }
    }

    // 4. Final State Optimization
    // Example: "Set state C as final" or "Make B accepting"
    if (doc.has('(final|accepting|end)')) {
        const state = doc.match('(q[0-9]+|[a-z])').text().toUpperCase().trim();
        if (next.states.includes(state)) {
            if (!next.finalStates.includes(state)) next.finalStates.push(state);
            processed = true;
            feedback += `${state} is now a final state. `;
        }
    }

    if (processed) {
        return {
            updated: next,
            message: feedback.trim(),
            score: 0.9
        };
    }

    return null;
}
