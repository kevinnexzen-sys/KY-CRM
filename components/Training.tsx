
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Mic, MicOff, Play, Square, Award, MessageSquare, User, AlertCircle } from 'lucide-react';

export const Training: React.FC = () => {
  const { addTrainingSession } = useData();
  const [activePersona, setActivePersona] = useState<'HVAC' | 'Plumber' | 'Electrician' | 'Handyman'>('HVAC');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcript, setTranscript] = useState<{sender: 'User' | 'AI', text: string}[]>([]);
  const [persuasionScore, setPersuasionScore] = useState(50);
  
  // Simulation State
  const [stage, setStage] = useState(0);

  const startSession = () => {
    setIsSessionActive(true);
    setTranscript([]);
    setPersuasionScore(50);
    setStage(0);
    
    // Initial AI Message
    setTimeout(() => {
        addMessage('AI', `Yeah, this is Mike the ${activePersona} guy. I'm pretty busy on a job site. What do you want?`);
    }, 1000);
  };

  const endSession = () => {
    setIsSessionActive(false);
    const passed = persuasionScore > 70;
    addTrainingSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        scenario: `Hiring ${activePersona}`,
        technicianPersona: activePersona,
        score: persuasionScore,
        status: passed ? 'Pass' : 'Fail',
        transcript: transcript.map(t => `${t.sender}: ${t.text}`)
    });
    alert(`Session Ended. You ${passed ? 'PASSED' : 'FAILED'} with a score of ${persuasionScore}.`);
  };

  const addMessage = (sender: 'User' | 'AI', text: string) => {
    setTranscript(prev => [...prev, { sender, text }]);
  };

  const handleUserResponse = (text: string) => {
    addMessage('User', text);
    
    // Simple mock logic for AI response based on keywords
    setTimeout(() => {
        let aiResponse = "";
        let scoreChange = 0;
        const lowerText = text.toLowerCase();

        if (stage === 0) {
            if (lowerText.includes('job') || lowerText.includes('work') || lowerText.includes('hiring')) {
                aiResponse = "I've got a lot of work already. Where is this job located? Is it far?";
                setStage(1);
            } else {
                aiResponse = "Look, I don't have time for chit-chat. Are you offering work or what?";
                scoreChange = -5;
            }
        } else if (stage === 1) {
            if (lowerText.includes('pay') || lowerText.includes('$') || lowerText.includes('rate')) {
                aiResponse = "Alright, the money sounds okay. But what exactly is the issue? I don't do commercial stuff right now.";
                scoreChange = 10;
                setStage(2);
            } else if (lowerText.includes('close') || lowerText.includes('miles')) {
                aiResponse = "Location is fine. But you haven't talked money yet. What's the rate?";
                scoreChange = 5;
            } else {
                aiResponse = "That sounds vague. I need to know the pay.";
                scoreChange = -5;
            }
        } else {
            if (lowerText.includes('email') || lowerText.includes('send')) {
                aiResponse = "Fine. Send me the work order. I'll take a look tonight. Consider it done.";
                scoreChange = 20;
                setTimeout(endSession, 2000);
            } else {
                aiResponse = "I'm still on the fence. Send me the details and I'll think about it.";
            }
        }

        addMessage('AI', aiResponse);
        setPersuasionScore(prev => Math.min(100, Math.max(0, prev + scoreChange)));

    }, 1500);
  };

  // Mock Voice Input
  const handleVoiceInput = () => {
    const mockInputs = [
        "I have a job for you downtown, simple repair.",
        "We pay $85 service fee plus hourly labor.",
        "It's a residential HVAC unit not cooling.",
        "I'll send you the work order email right now."
    ];
    const randomInput = mockInputs[Math.floor(Math.random() * mockInputs.length)];
    handleUserResponse(randomInput);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">AI Voice Training</h2>
                <p className="text-sm text-slate-500">Practice recruiting technicians with our AI simulator.</p>
            </div>
            <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Persuasion Score</p>
                <div className="text-2xl font-bold text-emerald-600">{persuasionScore}/100</div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* Controls */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 h-fit space-y-6">
                <h3 className="font-bold text-slate-900 border-b pb-2">Session Setup</h3>
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Technician Persona</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['HVAC', 'Plumber', 'Electrician', 'Handyman'].map((p) => (
                            <button 
                                key={p}
                                onClick={() => setActivePersona(p as any)}
                                disabled={isSessionActive}
                                className={`px-3 py-2 text-sm rounded-lg border transition-all ${activePersona === p ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <h4 className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                        <AlertCircle className="w-4 h-4" /> Objective
                    </h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                        Convince "Mike", a busy {activePersona}, to accept a new work order. You must clarify <strong>Location, Pay, and Job Scope</strong>.
                    </p>
                </div>

                {!isSessionActive ? (
                    <button onClick={startSession} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-sm">
                        <Play className="w-5 h-5" /> Start Simulation
                    </button>
                ) : (
                    <button onClick={endSession} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex items-center justify-center gap-2 shadow-sm">
                        <Square className="w-5 h-5" /> End Session
                    </button>
                )}
            </div>

            {/* Conversation Area */}
            <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden relative">
                {/* Audio Visualizer Mock */}
                <div className="h-32 bg-slate-800 flex items-center justify-center border-b border-slate-700 relative overflow-hidden">
                    {isSessionActive && (
                        <div className="flex gap-1 items-center h-10">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDuration: '0.5s' }}></div>
                            ))}
                        </div>
                    )}
                    <div className="absolute top-4 left-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">M</div>
                        <div>
                            <p className="text-white font-bold text-sm">Mike ({activePersona})</p>
                            <p className="text-slate-400 text-xs">{isSessionActive ? 'Speaking...' : 'Offline'}</p>
                        </div>
                    </div>
                </div>

                {/* Transcript */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {transcript.map((t, idx) => (
                        <div key={idx} className={`flex ${t.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                                t.sender === 'User' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'
                            }`}>
                                <p className="font-bold text-xs opacity-50 mb-1">{t.sender}</p>
                                {t.text}
                            </div>
                        </div>
                    ))}
                    {transcript.length === 0 && (
                        <div className="text-center text-slate-600 mt-10">
                            Start the session to begin the simulation.
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-center gap-4">
                    <button 
                        onClick={handleVoiceInput}
                        disabled={!isSessionActive}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isSessionActive ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                    >
                        <Mic className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-6 right-6 text-slate-500 text-xs">
                        * Microphone Simulated
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
