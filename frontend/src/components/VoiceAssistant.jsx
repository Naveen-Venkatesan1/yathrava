import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, Trash2 } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';

export default function VoiceAssistant() {
  const { triggerSOS } = useSafety();
  // ---------- State ----------
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sttLang, setSttLang] = useState('en-IN'); // Default to Indian English / Tanglish
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [micPermission, setMicPermission] = useState(null);
  const [sttSupported, setSttSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ---------- Auto‑scroll ----------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // ---------- Speech Synthesis ----------
  const speak = useCallback((text, lang = 'en-IN') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  // ---------- Permission & Capability Checks ----------
  useEffect(() => {
    // Microphone permission
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' }).then((result) => {
        setMicPermission(result.state);
        result.onchange = () => setMicPermission(result.state);
      }).catch(() => setMicPermission('unknown'));
    } else {
      setMicPermission('unsupported');
    }
    // Speech‑to‑text support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) setSttSupported(false);
    // Text‑to‑speech support
    if (!('speechSynthesis' in window)) setTtsSupported(false);
  }, []);

  // ---------- Backend Health Check (informational only, never blocks requests) ----------
  const checkBackendHealth = useCallback(async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      const res = await fetch(`${apiUrl}/health`);
      setBackendHealthy(res.ok);
    } catch (e) {
      setBackendHealthy(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  // ---------- Intent Handling ----------
  const handleIntent = useCallback(async (text) => {
    setIsProcessing(true);
    const maxRetries = 3;
    const timeoutDuration = 8000;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = `${apiUrl}/chat/intent`;

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
        speak(data.response, data.lang || 'en-IN');
        
        if (data.action === 'TRIGGER_SOS') {
          triggerSOS();
        }
        
        setIsProcessing(false);
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
          speak(reason, 'en-IN');
        } else {
          await new Promise(r => setTimeout(r, 1000 * attempt)); // 1s, 2s back-off
        }
      }
    }
    setIsProcessing(false);
  }, [speak]);

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

    recognition.onstart = () => setIsListening(true);
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
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [sttLang, handleIntent]);

  const toggleListening = () => {
    if (!sttSupported) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (micPermission && micPermission !== 'granted') {
      alert('Microphone permission is not granted. Please enable it in your browser settings.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // ---------- UI ----------
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {(messages.length > 0 || isProcessing) && (
        <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 mb-4 w-80 max-w-[calc(100vw-3rem)] transform transition-all flex flex-col">
          {/* Header & Controls */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
            <span className="text-xs text-[#1da1f2] font-extrabold uppercase tracking-wider">Yathrava Assistant</span>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-0.5 text-[10px] font-bold">
                <button
                  onClick={() => setSttLang('en-IN')}
                  className={`px-1.5 py-0.5 rounded-md transition-all ${sttLang === 'en-IN' ? 'bg-[#1da1f2] text-white' : 'text-gray-500'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setSttLang('ta-IN')}
                  className={`px-1.5 py-0.5 rounded-md transition-all ${sttLang === 'ta-IN' ? 'bg-[#1da1f2] text-white' : 'text-gray-500'}`}
                >
                  தமிழ்
                </button>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {/* Message History */}
          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end ml-auto' : 'items-start mr-auto'}`}
              >
                <span className="text-[10px] text-gray-400 font-semibold mb-0.5">
                  {msg.sender === 'user' ? 'You' : 'Yathrava AI'}
                </span>
                <p
                  className={`text-xs p-2.5 rounded-2xl ${msg.sender === 'user' ? 'bg-[#1da1f2] text-white rounded-tr-none' : msg.isError ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none' : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'}`}
                >
                  {msg.text}
                </p>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-[#1da1f2] text-xs font-bold py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Yathrava AI is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
      {/* Microphone Button */}
      <button
        onClick={toggleListening}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-[#1da1f2] hover:bg-[#1a91da]'}`}
      >
        {isListening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
      </button>
    </div>
  );
}
