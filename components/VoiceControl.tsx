
import React, { useState, useEffect } from 'react';

interface Props {
    onCommand: (transcript: string) => void;
    isProcessing: boolean;
}


// Add type definition for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
}

interface IWindow extends Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
    SpeechRecognition: new () => SpeechRecognition;
}

const LANGUAGES = [
    { code: 'en-US', label: 'English' },
    { code: 'hi-IN', label: 'Hindi' },
    { code: 'ta-IN', label: 'Tamil' },
    { code: 'te-IN', label: 'Telugu' },
    { code: 'kn-IN', label: 'Kannada' },
    { code: 'ml-IN', label: 'Malayalam' },
    { code: 'bn-IN', label: 'Bengali' },
    { code: 'gu-IN', label: 'Gujarati' },
    { code: 'mr-IN', label: 'Marathi' },
    { code: 'pa-IN', label: 'Punjabi' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'zh-CN', label: 'Chinese' },
    { code: 'ja-JP', label: 'Japanese' },
];

const VoiceControl: React.FC<Props> = ({ onCommand, isProcessing }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [selectedLang, setSelectedLang] = useState(navigator.language || 'en-US');
    const recognitionRef = React.useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognitionConstructor = (window as unknown as IWindow).webkitSpeechRecognition || (window as unknown as IWindow).SpeechRecognition;
            const rec = new SpeechRecognitionConstructor();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = selectedLang;

            rec.onresult = (event: SpeechRecognitionEvent) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                onCommand(text);
                setIsListening(false);
            };

            rec.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            rec.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = rec;
        } else {
            console.warn("Speech recognition not supported in this browser.");
        }
    }, [onCommand, selectedLang]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Voice recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.lang = selectedLang;
            recognitionRef.current.start();
            setIsListening(true);
            setTranscript("Listening...");
        }
    };

    return (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-3xl shadow-xl relative overflow-hidden text-white border border-white/20">
            <div className="relative z-10 flex flex-col items-center text-center">
                <h3 className="text-xl font-bold mb-1">Voice Assistant</h3>
                <p className="text-indigo-100 text-xs mb-6 max-w-xs opacity-80">
                    Interact with your automaton naturally. Commands are parsed by AI.
                </p>

                {/* Language Selector */}
                <div className="mb-6 flex flex-col items-start w-full max-w-[200px]">
                    <label className="text-[10px] uppercase tracking-widest font-bold mb-1.5 opacity-60 ml-1">Listen in:</label>
                    <select
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm w-full outline-none focus:bg-white/20 transition-all font-medium"
                        title="Select Language"
                    >
                        <option value={navigator.language} className="text-slate-900">Auto ({navigator.language})</option>
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code} className="text-slate-900">{lang.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={toggleListening}
                        disabled={isProcessing}
                        title={isListening ? "Stop listening" : "Start listening"}
                        aria-label={isListening ? "Stop listening" : "Start listening"}
                        className={`
                            w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-2xl transition-all duration-300 relative
                            ${isListening ? 'bg-red-500 scale-110' : 'bg-white text-indigo-600 hover:scale-105'}
                            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {isListening && <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></span>}
                        <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
                    </button>

                    <div className="h-10 flex flex-col items-center justify-center">
                        {isProcessing ? (
                            <div className="flex items-center gap-2 text-purple-200">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-0"></div>
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-75"></div>
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150"></div>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider">AI is processing...</span>
                            </div>
                        ) : (
                            <p className="text-sm font-medium italic text-indigo-100 max-w-sm">
                                {transcript || "Click to start speaking"}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Decorative background circles */}
            <div className="absolute top-[-50%] left-[-20%] w-60 h-60 rounded-full bg-white opacity-10 blur-3xl"></div>
            <div className="absolute bottom-[-50%] right-[-20%] w-60 h-60 rounded-full bg-white opacity-10 blur-3xl"></div>
        </div>
    );
};

export default VoiceControl;
