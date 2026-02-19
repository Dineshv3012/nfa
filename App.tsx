
import React, { useState, useMemo, useEffect } from 'react';
import { Automaton, Transition } from './types';
import { convertENFAToNFA } from './services/nfaConverter';
import AutomatonVisualizer from './components/AutomatonVisualizer';
import SketchPad from './components/SketchPad';
import VoiceControl from './components/VoiceControl';
import SimulationPanel from './components/SimulationPanel';
import { analyzeImage, parseVoiceCommand } from './services/gemini';

const INITIAL_ENFA: Automaton = {
  states: ['A', 'B', 'C'],
  alphabet: ['0', '1', 'ε'],
  transitions: [
    { from: 'A', to: 'A', symbol: '0' },
    { from: 'A', to: 'B', symbol: 'ε' },
    { from: 'B', to: 'B', symbol: '1' },
    { from: 'B', to: 'C', symbol: 'ε' },
    { from: 'C', to: 'C', symbol: '0' },
  ],
  initialState: 'A',
  finalStates: ['C'],
};

const EMPTY_ENFA: Automaton = {
  states: ['A'],
  alphabet: ['ε'],
  transitions: [],
  initialState: 'A',
  finalStates: [],
};

const App: React.FC = () => {
  const [enfa, setEnfa] = useState<Automaton>(INITIAL_ENFA);
  const [activeTab, setActiveTab] = useState<'visual' | 'logic'>('visual');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  // AI / Advanced Features State
  const [activeTool, setActiveTool] = useState<'none' | 'draw' | 'voice' | 'upload'>('none');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Transition Form State
  const [newTrans, setNewTrans] = useState<Transition>({ from: '', to: '', symbol: '' });
  const [newStateName, setNewStateName] = useState('');
  const [newSymbolName, setNewSymbolName] = useState('');

  const { nfa, closures } = useMemo(() => convertENFAToNFA(enfa), [enfa]);

  const addTransition = () => {
    if (newTrans.from && newTrans.to && (newTrans.symbol !== undefined)) {
      setEnfa(prev => ({
        ...prev,
        transitions: [...prev.transitions, { ...newTrans }]
      }));
      setNewTrans({ from: '', to: '', symbol: '' });
    }
  };

  const removeTransition = (idx: number) => {
    setEnfa(prev => ({
      ...prev,
      transitions: prev.transitions.filter((_, i) => i !== idx)
    }));
  };

  const addState = () => {
    if (newStateName && !enfa.states.includes(newStateName)) {
      setEnfa(prev => ({ ...prev, states: [...prev.states, newStateName] }));
      setNewStateName('');
    }
  };

  const removeState = (state: string) => {
    setEnfa(prev => ({
      ...prev,
      states: prev.states.filter(s => s !== state),
      finalStates: prev.finalStates.filter(s => s !== state),
      initialState: prev.initialState === state ? (prev.states[0] || '') : prev.initialState,
      transitions: prev.transitions.filter(t => t.from !== state && t.to !== state)
    }));
  };

  const addSymbol = () => {
    if (newSymbolName && !enfa.alphabet.includes(newSymbolName)) {
      setEnfa(prev => ({ ...prev, alphabet: [...prev.alphabet, newSymbolName] }));
      setNewSymbolName('');
    }
  };

  const removeSymbol = (symbol: string) => {
    if (symbol === 'ε') return; // Keep epsilon
    setEnfa(prev => ({
      ...prev,
      alphabet: prev.alphabet.filter(a => a !== symbol),
      transitions: prev.transitions.filter(t => t.symbol !== symbol)
    }));
  };

  const toggleFinalState = (state: string) => {
    setEnfa(prev => ({
      ...prev,
      finalStates: prev.finalStates.includes(state)
        ? prev.finalStates.filter(s => s !== state)
        : [...prev.finalStates, state]
    }));
  };

  const setInitialState = (state: string) => {
    setEnfa(prev => ({ ...prev, initialState: state }));
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.states && parsed.alphabet && parsed.transitions && parsed.initialState && parsed.finalStates) {
        setEnfa(parsed);
        setShowJsonInput(false);
        setJsonInput('');
      } else {
        alert("Invalid Automaton format. Required: states, alphabet, transitions, initialState, finalStates.");
      }
    } catch {
      alert("Invalid JSON string.");
    }
  };

  const exportState = () => {
    setJsonInput(JSON.stringify(enfa, null, 2));
    setShowJsonInput(true);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the entire automaton? This will remove all states and transitions.")) {
      setEnfa(EMPTY_ENFA);
    }
  };

  // --- New Feature Handlers ---

  const handleImageAnalysis = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const newAutomaton = await analyzeImage(imageData);
      setEnfa(newAutomaton);
      setActiveTool('none');
    } catch (e) {
      alert("Failed to analyze image. Please ensure your API Key is set and the image is clear.");
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVoiceCommand = async (transcript: string) => {
    setIsProcessingVoice(true);
    try {
      const updatedNfa = await parseVoiceCommand(transcript, enfa);
      setEnfa(updatedNfa);
    } catch (e) {
      alert("Failed to process voice command.");
      console.error(e);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Handle ESC key to close overlay
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeTool !== 'none') {
        setActiveTool('none');
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeTool]);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <header className="max-w-7xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 flex items-center justify-center gap-3">
          <i className="fas fa-project-diagram text-blue-600"></i>
          ε-NFA to NFA Converter
        </h1>
        <p className="mt-3 text-slate-600 max-w-2xl mx-auto text-lg underline skip-underline decoration-transparent">
          Master the ε-closure algorithm with AI-powered tools.
        </p>

        {/* AI Tools Navbar */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <button
            onClick={() => setActiveTool('draw')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 ${activeTool === 'draw' ? 'bg-indigo-700 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            <i className="fas fa-paint-brush"></i> Draw
          </button>
          <button
            onClick={() => setActiveTool('voice')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 ${activeTool === 'voice' ? 'bg-purple-700 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
          >
            <i className="fas fa-microphone"></i> Voice
          </button>
          <button
            onClick={() => setActiveTool('upload')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 ${activeTool === 'upload' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            <i className="fas fa-file-upload"></i> Upload
          </button>
        </div>
      </header>

      {/* Full Screen AI Tools Overlay */}
      {activeTool !== 'none' && (
        <div
          className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-0 md:p-4 backdrop-blur-md animate-in fade-in zoom-in duration-300"
          onClick={() => setActiveTool('none')}
        >
          <div
            className="bg-white/5 w-full h-full md:h-auto md:max-w-5xl md:rounded-3xl shadow-2xl overflow-hidden relative border border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Overlay Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                {activeTool === 'draw' && <><i className="fas fa-paint-brush text-indigo-400"></i> Sketch Your Automaton</>}
                {activeTool === 'voice' && <><i className="fas fa-microphone text-purple-400"></i> Voice Control</>}
                {activeTool === 'upload' && <><i className="fas fa-file-upload text-blue-400"></i> Analysis & Upload</>}
              </h2>
              <button
                onClick={() => setActiveTool('none')}
                className="w-12 h-12 rounded-full bg-red-500/20 text-white flex items-center justify-center hover:bg-red-500/40 transition-all border-2 border-red-400/50 hover:border-red-300 shadow-lg hover:scale-110 active:scale-95"
                aria-label="Close"
                title="Close (ESC)"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Overlay Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-10 flex flex-col items-center justify-center">
              {activeTool === 'draw' && (
                <div className="w-full max-w-4xl animate-in slide-in-from-bottom-5">
                  <SketchPad onAnalyze={handleImageAnalysis} isAnalyzing={isAnalyzing} onClose={() => setActiveTool('none')} />
                  <div className="mt-8 bg-indigo-900/40 p-6 rounded-2xl border border-indigo-500/30 text-indigo-100">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-indigo-300">
                      <i className="fas fa-lightbulb"></i> Pro Tips
                    </h4>
                    <ul className="text-sm space-y-2 list-disc list-inside opacity-90">
                      <li>Use clear circles for states and bold arrows for transitions.</li>
                      <li>Label your states (e.g., A, B, C) and transitions (e.g., 0, 1, ε).</li>
                      <li>The AI will interpret the geometry and labels into a formal automaton.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTool === 'voice' && (
                <div className="w-full max-w-2xl animate-in slide-in-from-bottom-5">
                  <VoiceControl onCommand={handleVoiceCommand} isProcessing={isProcessingVoice} />
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                      <h4 className="font-bold text-purple-300 mb-3 text-sm">Command Examples:</h4>
                      <ul className="text-xs text-slate-300 space-y-3">
                        <li className="bg-white/5 p-2 rounded-lg">"Add state <b>q2</b>"</li>
                        <li className="bg-white/5 p-2 rounded-lg">"Connect <b>q0</b> to <b>q1</b> with <b>0</b>"</li>
                        <li className="bg-white/5 p-2 rounded-lg">"Remove state <b>B</b>"</li>
                      </ul>
                    </div>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                      <h4 className="font-bold text-purple-300 mb-3 text-sm">Status:</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Speak clearly. The AI processes your natural language and updates the configuration in real-time.
                      </p>
                      <button
                        onClick={() => setActiveTool('none')}
                        className="mt-4 w-full py-2 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all border border-white/10 text-xs"
                      >
                        <i className="fas fa-arrow-left mr-2"></i> Close Voice Panel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'upload' && (
                <div className="w-full max-w-xl animate-in slide-in-from-bottom-5">
                  <div className="bg-white/10 p-8 rounded-3xl border-2 border-dashed border-white/20 text-center group hover:border-blue-400 transition-all cursor-pointer relative"
                    onPaste={(e) => {
                      const item = e.clipboardData.items[0];
                      if (item?.type.includes('image')) {
                        const file = item.getAsFile();
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            handleImageAnalysis(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }}>
                    <i className="fas fa-cloud-upload-alt text-6xl text-blue-400 mb-6 group-hover:scale-110 transition-transform"></i>
                    <h3 className="text-xl font-bold text-white mb-2">Upload Diagram Image</h3>
                    <p className="text-slate-400 mb-8 text-sm">
                      Drag and drop, browse, or paste an image of your automaton.
                    </p>

                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            handleImageAnalysis(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-900/20"
                    >
                      Browse Files
                    </label>
                    <button
                      onClick={() => setActiveTool('none')}
                      className="ml-4 inline-block bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10"
                    >
                      Cancel
                    </button>
                    <p className="mt-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Supported formats: PNG, JPG, WEBP
                    </p>
                  </div>

                  <div className="mt-10 bg-blue-900/40 p-6 rounded-2xl border border-blue-500/30">
                    <h4 className="font-bold text-blue-300 mb-2 flex items-center gap-2">
                      <i className="fas fa-paste"></i> Clipboard Support
                    </h4>
                    <p className="text-xs text-blue-100 opacity-80 leading-relaxed">
                      You can also use <kbd className="bg-blue-800 px-1.5 py-0.5 rounded text-white font-mono">Ctrl + V</kbd> while this screen is open to analyze a screenshot directly.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Overlay Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10 text-center text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
              AI Vision & Voice Powered by Gemini
            </div>
          </div>
        </div>
      )}


      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Controls */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-cog text-blue-500"></i> Configuration
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={exportState}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                >
                  <i className="fas fa-file-import"></i> JSON
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-xs font-bold text-red-500 hover:text-red-700 underline flex items-center gap-1"
                >
                  <i className="fas fa-trash-alt"></i> Clear All
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* Initial State Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start State (q₀)</label>
                <select
                  value={enfa.initialState}
                  onChange={(e) => setInitialState(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-blue-600"
                  title="Select Initial State"
                  aria-label="Initial State"
                >
                  {enfa.states.length > 0 ? (
                    enfa.states.map(s => <option key={s} value={s}>{s}</option>)
                  ) : (
                    <option value="">No states available</option>
                  )}
                </select>
              </div>

              {/* States Management */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">States (Q)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text" value={newStateName} onChange={e => setNewStateName(e.target.value)}
                    placeholder="New State..." className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addState()}
                  />
                  <button onClick={addState} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {enfa.states.map(s => (
                    <span key={s} className="group relative flex items-center bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-xs font-bold border border-slate-200">
                      {s}
                      <button onClick={() => removeState(s)} className="ml-1 text-slate-400 hover:text-red-500" title={`Remove state ${s}`} aria-label={`Remove state ${s}`}><i className="fas fa-times"></i></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Alphabet Management */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alphabet (Σ)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text" value={newSymbolName} onChange={e => setNewSymbolName(e.target.value)}
                    placeholder="New Symbol..." className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
                  />
                  <button onClick={addSymbol} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {enfa.alphabet.map(a => (
                    <span key={a} className="flex items-center bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-xs font-bold border border-slate-200">
                      {a || 'ε'}
                      {a !== 'ε' && (
                        <button onClick={() => removeSymbol(a)} className="ml-1 text-slate-400 hover:text-red-500" title={`Remove symbol ${a}`} aria-label={`Remove symbol ${a}`}><i className="fas fa-times"></i></button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Transitions Management */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Add Transition (δ)</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <select
                    value={newTrans.from} onChange={e => setNewTrans(prev => ({ ...prev, from: e.target.value }))}
                    className="px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    title="Source State"
                    aria-label="Source State"
                  >
                    <option value="">Origin</option>
                    {enfa.states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    value={newTrans.symbol} onChange={e => setNewTrans(prev => ({ ...prev, symbol: e.target.value }))}
                    className="px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    title="Transition Symbol"
                    aria-label="Transition Symbol"
                  >
                    <option value="">Sym</option>
                    {enfa.alphabet.map(a => <option key={a} value={a}>{a || 'ε'}</option>)}
                  </select>
                  <select
                    value={newTrans.to} onChange={e => setNewTrans(prev => ({ ...prev, to: e.target.value }))}
                    className="px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    title="Target State"
                    aria-label="Target State"
                  >
                    <option value="">Dest</option>
                    {enfa.states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button
                  onClick={addTransition}
                  disabled={!newTrans.from || !newTrans.to}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  Confirm Transition
                </button>
              </div>

              <hr className="border-slate-100" />

              {/* Final States Management */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Accepting States (F)</label>
                <div className="flex flex-wrap gap-2">
                  {enfa.states.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleFinalState(s)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${enfa.finalStates.includes(s)
                        ? 'bg-red-50 text-red-600 border-red-200 ring-2 ring-red-100'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      {s} {enfa.finalStates.includes(s) && '✓'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* JSON Overlay / Input */}
          {showJsonInput && (
            <div className="bg-blue-50 p-6 rounded-2xl shadow-inner border-2 border-dashed border-blue-200 animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-blue-800 tracking-tight">Bulk Input / Output</h3>
                <button onClick={() => setShowJsonInput(false)} className="text-blue-500 hover:text-blue-700" title="Close" aria-label="Close"><i className="fas fa-times"></i></button>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-48 p-3 bg-white border border-blue-200 rounded-xl text-xs font-mono mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder='Paste ε-NFA JSON here...'
              />
              <button
                onClick={handleJsonImport}
                className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md"
              >
                Apply Entire State
              </button>
            </div>
          )}

          {/* Transition List */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              Active Transitions
              <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{enfa.transitions.length}</span>
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {enfa.transitions.length === 0 && <p className="text-center text-slate-400 py-4 text-sm italic">No transitions added yet.</p>}
              {enfa.transitions.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                  <span className="text-sm font-medium text-slate-700">
                    <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{t.from}</span>
                    <span className="mx-2 text-slate-400">─({t.symbol || 'ε'})─▶</span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{t.to}</span>
                  </span>
                  <button onClick={() => removeTransition(i)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1" title="Remove transition" aria-label="Remove transition">
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Output Visualizer & Logic */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit shadow-inner">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'visual' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Interactive Diagrams
            </button>
            <button
              onClick={() => setActiveTab('logic')}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'logic' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Algorithm Analysis
            </button>
          </div>

          {activeTab === 'visual' ? (
            <div className="flex flex-col gap-10">
              <AutomatonVisualizer id="enfa" title="Phase 1: Your Input ε-NFA" automaton={enfa} />

              {/* Simulation Panel added here */}
              <SimulationPanel automaton={enfa} />

              <div className="flex justify-center">
                <div className="bg-blue-600 text-white p-3 rounded-full shadow-lg animate-bounce">
                  <i className="fas fa-arrow-down"></i>
                </div>
              </div>
              <AutomatonVisualizer id="nfa" title="Phase 2: Converted Resulting NFA" automaton={nfa} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Closures Table */}
              <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">1</span>
                  ε-Closure Computation
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-xs font-bold">
                      <tr>
                        <th className="px-6 py-4 border-b">State (q)</th>
                        <th className="px-6 py-4 border-b">Epsilon Closure [ ε-closure(q) ]</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.entries(closures) as [string, string[]][]).map(([state, closure]) => (
                        <tr key={state} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-blue-600 text-base">{state}</td>
                          <td className="px-6 py-4">
                            <span className="flex flex-wrap gap-2">
                              {closure.map(s => (
                                <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-semibold shadow-sm">{s}</span>
                              ))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transition Table */}
              <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">2</span>
                  Final State-Transition Map
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-xs font-bold">
                      <tr>
                        <th className="px-6 py-4 border border-slate-200">State</th>
                        {nfa.alphabet.map(a => (
                          <th key={a} className="px-6 py-4 border border-slate-200 text-center">δ' (q, {a})</th>
                        ))}
                        <th className="px-6 py-4 border border-slate-200 text-center">Accepting?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nfa.states.map(state => (
                        <tr key={state} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 border border-slate-200 font-bold bg-slate-50/50">
                            {state} {state === nfa.initialState && <span className="text-blue-500 ml-2" title="Initial State">➔</span>}
                          </td>
                          {nfa.alphabet.map(a => {
                            const targets: string[] = nfa.transitions
                              .filter(t => t.from === state && t.symbol === a)
                              .map(t => t.to);
                            return (
                              <td key={a} className="px-6 py-4 border border-slate-200 text-center">
                                {targets.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5 justify-center">
                                    {targets.map(t => <span key={t} className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg font-bold text-xs shadow-sm">{t}</span>)}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 font-mono italic">Ø</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 border border-slate-200 text-center">
                            {nfa.finalStates.includes(state) ? (
                              <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg font-extrabold text-xs shadow-sm border border-red-200">YES</span>
                            ) : (
                              <span className="text-slate-300 text-xs font-medium uppercase tracking-tighter">no</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-8 p-5 bg-blue-50 rounded-2xl border border-blue-100 text-sm text-blue-900 leading-relaxed shadow-sm">
                  <div className="flex gap-3">
                    <i className="fas fa-info-circle mt-1 text-blue-600 text-lg"></i>
                    <div>
                      <h4 className="font-bold mb-1">Conversion Logic Summary:</h4>
                      <p>The new NFA transition function is defined as: <strong>δ'(q, a) = ε-closure( δ(ε-closure(q), a) )</strong>.</p>
                      <p className="mt-1">A state in the NFA is final if its ε-closure in the original ε-NFA contains at least one state from the original final set.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-7xl mx-auto mt-20 pb-10 text-center text-slate-400 text-sm">
        <div className="h-px bg-slate-200 w-24 mx-auto mb-6"></div>
        <p>Interactive Educational Tool for Formal Language Theory.</p>
        <p className="mt-2 font-medium">ε-NFA ➔ NFA Step-by-Step Processor</p>
      </footer>
    </div>
  );
};

export default App;
