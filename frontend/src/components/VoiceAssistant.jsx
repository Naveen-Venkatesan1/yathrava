import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, Trash2, X, MessageSquare, Volume2, WifiOff } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { API_ENDPOINTS, IS_BACKEND_CONFIGURED } from '../config/api';

export default function VoiceAssistant() {
  const { triggerSOS } = useSafety();
  
  // ---------- State ----------
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Ready'); // Ready, Listening..., Processing..., Speaking..., Error
  const [messages, setMessages] = useState([]);
  const [sttLang, setSttLang] = useState('en-IN'); // Default to Indian English / Tanglish
  const [sttSupported, setSttSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ---------- Auto‑scroll ----------
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, status, isOpen]);

  // ---------- Capability Checks ----------
  useEffect(() => {
    // Speech‑to‑text support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) setSttSupported(false);
    // Text‑to‑speech support
    if (!('speechSynthesis' in window)) setTtsSupported(false);
  }, []);

  // ---------- Speech Synthesis ----------
  const speak = useCallback((text, lang = 'en-IN') => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    setStatus('Speaking...');
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setStatus('Ready');
    };
    
    utterance.onerror = () => {
      setStatus('Ready');
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // ---------- Intent Handling ----------
  const handleIntent = useCallback(async (text) => {
    setStatus('Processing...');
    const url = API_ENDPOINTS.chatIntent();

    if (!url) {
      const msg = 'AI service is not connected. Please set VITE_API_URL in your Vercel environment variables to a deployed backend URL.';
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: msg, isError: true }]);
      setStatus('No Backend');
      return;
    }

    const maxRetries = 3;
    const timeoutDuration = 8000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Server error ${res.status}: ${errText}`);
        }
        const data = await res.json();
        if (!data || !data.response) {
          throw new Error('Empty response from server');
        }
        setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: data.response }]);
        
        if (data.action === 'TRIGGER_SOS') {
          triggerSOS();
        }
        
        speak(data.response, data.lang || 'en-IN');
        return; // success — stop retrying
      } catch (error) {
        clearTimeout(timeoutId);
        const isAbort = error.name === 'AbortError';
        console.warn(`[VoiceAssistant] Attempt ${attempt}/${maxRetries} failed (${isAbort ? 'timeout' : error.message})`);
        
        if (attempt === maxRetries) {
          // All retries exhausted — show specific error
          const reason = isAbort
            ? 'Request timed out. The AI service may be slow or down.'
            : `Could not reach the AI service: ${error.message}`;
          setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reason, isError: true }]);
          setStatus('Error');
          speak(reason, 'en-IN');
        } else {
          await new Promise(r => setTimeout(r, 1000 * attempt)); // 1s, 2s back-off
        }
      }
    }
  }, [speak, triggerSOS]);

  // ---------- Speech Recognition Setup ----------
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = sttLang;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('Listening...');
    };

    recognition.onresult = async (event) => {
      const currentTranscript = event.results[0][0].transcript;
      if (!currentTranscript.trim()) return;
      
      setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: currentTranscript }]);
      setIsListening(false);
      await handleIntent(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setStatus(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatus(prev => prev === 'Listening...' ? 'Ready' : prev);
    };

    recognitionRef.current = recognition;
    
    return () => recognition.abort();
  }, [sttLang, handleIntent]);

  const toggleListening = async () => {
    if (!sttSupported) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setStatus('Ready');
    } else {
      try {
        // Explicitly request microphone permissions
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // After permission is granted, start listening immediately
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Microphone permission error:', err);
        setStatus('Permission Denied');
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'ai', 
          text: `Microphone access error: ${err.message}. Please check your browser settings.`, 
          isError: true 
        }]);
      }
    }
  };

  // Status badge coloring
  const getStatusColor = () => {
    if (status === 'Listening...') return 'bg-red-100 text-red-600 border-red-200 animate-pulse';
    if (status === 'Processing...') return 'bg-blue-100 text-blue-600 border-blue-200';
    if (status === 'Speaking...') return 'bg-green-100 text-green-600 border-green-200';
    if (status === 'No Backend') return 'bg-orange-100 text-orange-600 border-orange-200';
    if (status.includes('Error') || status === 'Permission Denied') return 'bg-orange-100 text-orange-600 border-orange-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  // ---------- UI ----------
  return (
    <>
      {/* Assistant Panel */}
      <div 
        className={`fixed bottom-[85px] md:bottom-6 right-[2.5vw] md:right-6 z-[99999] w-[95vw] md:w-[420px] lg:w-[450px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-200 flex flex-col transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ maxHeight: '600px', height: 'auto' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1da1f2] flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-800">Yathrava Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Clear history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* No-backend warning banner */}
        {!IS_BACKEND_CONFIGURED && (
          <div className="flex items-start gap-2 bg-orange-50 border-b border-orange-100 px-4 py-2">
            <WifiOff className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-orange-700 leading-snug">
              <span className="font-bold">No backend connected.</span> Voice responses are disabled. Set <code className="font-mono bg-orange-100 px-1 rounded">VITE_API_URL</code> in Vercel to enable AI replies.
            </p>
          </div>
        )}

        {/* Status Bar & Controls */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-gray-50">
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor()}`}>
            {status}
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5 text-[10px] font-bold">
            <button
              onClick={() => setSttLang('en-IN')}
              className={`px-2 py-1 rounded-md transition-all ${sttLang === 'en-IN' ? 'bg-[#1da1f2] text-white shadow-sm' : 'text-gray-500'}`}
            >
              EN
            </button>
            <button
              onClick={() => setSttLang('ta-IN')}
              className={`px-2 py-1 rounded-md transition-all ${sttLang === 'ta-IN' ? 'bg-[#1da1f2] text-white shadow-sm' : 'text-gray-500'}`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[200px] max-h-[350px] bg-white">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-xs mt-10">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Hi! Ask me about your journey, tickets, or stations.</p>
              <p className="mt-1">Tap "Start Listening" below.</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end ml-auto' : 'items-start mr-auto'}`}
            >
              <span className="text-[10px] text-gray-400 font-semibold mb-0.5 px-1">
                {msg.sender === 'user' ? 'You' : 'Yathrava AI'}
              </span>
              <p
                className={`text-[13px] p-3 rounded-2xl shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-[#1da1f2] text-white rounded-tr-none' 
                    : msg.isError 
                      ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none' 
                      : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </p>
            </div>
          ))}
          
          {status === 'Processing...' && (
            <div className="flex items-center gap-2 text-[#1da1f2] text-xs font-bold py-2 ml-1">
              <Loader2 className="w-4 h-4 animate-spin" /> Yathrava AI is thinking...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <button
            onClick={toggleListening}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-md transition-all ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-[#1da1f2] hover:bg-[#1a91da]'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" /> Stop Listening
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" /> Start Listening
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => {
          console.log(`[VoiceAssistant] FAB clicked. Current state: ${isOpen}. Toggling to: ${!isOpen}`);
          setIsOpen(!isOpen);
        }}
        className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[100000] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-2 ${
          isOpen 
            ? 'bg-white border-[#1da1f2] text-[#1da1f2] rotate-180 scale-0 opacity-0 pointer-events-none' 
            : 'bg-[#1da1f2] border-transparent text-white hover:bg-[#1a91da] hover:scale-105'
        }`}
        aria-label="Open Voice Assistant"
      >
        <Volume2 className="w-6 h-6" />
      </button>
    </>
  );
}
