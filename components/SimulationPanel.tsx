
import React, { useState, useEffect } from 'react';
import { Automaton } from '../types';
import { computeStateEpsilonClosure } from '../services/nfaConverter';

interface Props {
    automaton: Automaton;
}

const SimulationPanel: React.FC<Props> = ({ automaton }) => {
    const [inputString, setInputString] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [activeStates, setActiveStates] = useState<string[]>([]);
    const [history, setHistory] = useState<string[][]>([]);
    const [resetTrigger, setResetTrigger] = useState(0);
    // const [isPlaying, setIsPlaying] = useState(false);

    // Initialize/reset simulation state when automaton or input changes
    useEffect(() => {
        const startClosure = computeStateEpsilonClosure(automaton.initialState, automaton.transitions);
        // Batch all state updates together to avoid cascading renders
        Promise.resolve().then(() => {
            setActiveStates(startClosure);
            setHistory([startClosure]);
            setCurrentStep(0);
        });
    }, [automaton, inputString, resetTrigger]);

    const resetSimulation = () => {
        // Trigger the effect to run again by changing resetTrigger
        setResetTrigger(prev => prev + 1);
    };

    const stepForward = () => {
        if (currentStep >= inputString.length) return;

        const symbol = inputString[currentStep];
        const currentActive = history[currentStep];
        const nextStates = new Set<string>();

        // 1. Move on symbol
        for (const state of currentActive) {
            automaton.transitions
                .filter(t => t.from === state && t.symbol === symbol)
                .forEach(t => nextStates.add(t.to));
        }

        // 2. Compute Epsilon Closure of all reached states
        const finalNextStates = new Set<string>();
        nextStates.forEach(s => {
            computeStateEpsilonClosure(s, automaton.transitions).forEach(c => finalNextStates.add(c));
        });

        const nextActive = Array.from(finalNextStates).sort();

        setHistory(prev => [...prev, nextActive]);
        setActiveStates(nextActive);
        setCurrentStep(prev => prev + 1);
    };

    const stepBackward = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            setActiveStates(history[currentStep - 1]);
            setHistory(prev => prev.slice(0, -1));
        }
    };

    const isAccepted = activeStates.some(s => automaton.finalStates.includes(s));
    const isFinished = currentStep === inputString.length;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-play-circle text-green-600"></i> String Simulation
            </h3>

            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={inputString}
                    onChange={(e) => setInputString(e.target.value)}
                    placeholder="Enter test string (e.g. 01001)"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
                <button
                    onClick={resetSimulation}
                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-200 font-bold"
                >
                    Reset
                </button>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
                <div className="flex gap-2 font-mono text-lg tracking-widest">
                    {inputString.split('').map((char, index) => (
                        <span
                            key={index}
                            className={`w-8 h-8 flex items-center justify-center rounded ${index === currentStep
                                ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300'
                                : index < currentStep
                                    ? 'text-slate-400'
                                    : 'text-slate-800'
                                }`}
                        >
                            {char}
                        </span>
                    ))}
                    {currentStep === inputString.length && (
                        <span className="w-8 h-8 flex items-center justify-center text-slate-300">End</span>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <div className="text-sm font-semibold text-slate-500 mb-2">Active States:</div>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {activeStates.length > 0 ? activeStates.map(s => (
                        <span key={s} className={`px-3 py-1 rounded-lg font-bold border transition-all ${automaton.finalStates.includes(s)
                            ? 'bg-green-100 text-green-700 border-green-300 ring-2 ring-green-100'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                            {s}
                        </span>
                    )) : (
                        <span className="text-red-500 italic text-sm">Dead State (Rejected)</span>
                    )}
                </div>
            </div>

            {isFinished && (
                <div className={`p-4 rounded-xl text-center font-bold text-lg mb-6 ${isAccepted
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                    {isAccepted ? '✨ String Accepted! ✨' : '❌ String Rejected'}
                </div>
            )}

            <div className="flex justify-between gap-4">
                <button
                    onClick={stepBackward}
                    disabled={currentStep === 0}
                    className="flex-1 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                    <i className="fas fa-step-backward mr-2"></i> Back
                </button>
                <button
                    onClick={stepForward}
                    disabled={isFinished}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-md"
                >
                    Step <i className="fas fa-step-forward ml-2"></i>
                </button>
            </div>
        </div>
    );
};

export default SimulationPanel;
