
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

const VoiceControl: React.FC<Props> = ({ onCommand, isProcessing }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = React.useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognitionConstructor = (window as unknown as IWindow).webkitSpeechRecognition || (window as unknown as IWindow).SpeechRecognition;
            const rec = new SpeechRecognitionConstructor();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';

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
    }, [onCommand]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Voice recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
            setTranscript("Listening...");
        }
    };

    return (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-2xl shadow-lg relative overflow-hidden text-white">
            <div className="relative z-10 flex flex-col items-center text-center">
                <h3 className="text-xl font-bold mb-2">Voice Control</h3>
                <p className="text-indigo-100 text-sm mb-6 max-w-xs">
                    Try saying: "Add state q2", "Connect q0 to q1 with 0", or "Make q1 a final state".
                </p>

                <button
                    onClick={toggleListening}
                    disabled={isProcessing}
                    className={`
            w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-xl transition-all duration-300
            ${isListening ? 'bg-red-500 animate-pulse scale-110' : 'bg-white text-indigo-600 hover:scale-105'}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                </button>

                <div className="mt-4 h-6 text-sm font-medium text-indigo-100">
                    {isProcessing ? (
                        <span className="flex items-center gap-2"><i className="fas fa-spinner fa-spin"></i> Processing...</span>
                    ) : (
                        transcript || "Tap mic to speak"
                    )}
                </div>
            </div>

            {/* Decorative background circles */}
            <div className="absolute top-[-50%] left-[-20%] w-60 h-60 rounded-full bg-white opacity-10 blur-3xl"></div>
            <div className="absolute bottom-[-50%] right-[-20%] w-60 h-60 rounded-full bg-white opacity-10 blur-3xl"></div>
        </div>
    );
};

export default VoiceControl;
