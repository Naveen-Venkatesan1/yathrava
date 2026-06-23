// src/context/AlertContext.jsx
import React, { createContext, useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';


export const AlertContext = createContext(null);

// Utility functions for alarm sound
const playLoudAlarm = (audioCtxRef, oscillatorRef, gainRef) => {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }
  const ctx = audioCtxRef.current;
  if (ctx.state === 'suspended') ctx.resume();
  if (oscillatorRef.current) {
    oscillatorRef.current.stop();
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
  oscillatorRef.current = osc;
  gainRef.current = gain;
};

const stopLoudAlarm = (oscillatorRef) => {
  if (oscillatorRef.current) {
    try { oscillatorRef.current.stop(); } catch (e) {}
  }
};

export const AlertProvider = ({ children }) => {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);

  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const intervalRef = useRef(null);
  const alarmLoopRef = useRef(null);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
      }
    } catch (err) {
      console.warn('Wake Lock error:', err);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLock) {
      wakeLock.release().then(() => setWakeLock(null));
    }
  };

  const startSimulation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
  }, []);

  // Helper: speak a message in selected language
  const speakMessage = (msg) => {
    try {
      const utter = new SpeechSynthesisUtterance(msg);
      utter.lang = language;
      utter.volume = 1;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  };

  // Message maps for alerts
  const messages = {
    en: {
      30: "Attention. Your destination {dest} is arriving in 30 minutes.",
      15: "Attention. Your destination {dest} is arriving in 15 minutes.",
      10: "Attention. Your destination {dest} is arriving in 10 minutes.",
      5: "Attention. Your destination {dest} is arriving in 5 minutes.",
      arrival: "You have arrived at your destination.",
      missed: "You have missed your stop.",
    },
    ta: {
      30: "கவனம். உங்கள் இலக்கு {dest} இன்னும் 30 நிமிடங்களில் வருகிறது.",
      15: "கவனம். உங்கள் இலக்கு {dest} இன்னும் 15 நிமிடங்களில் வருகிறது.",
      10: "கவனம். உங்கள் இலக்கு {dest} இன்னும் 10 நிமிடங்களில் வருகிறது.",
      5: "கவனம். உங்கள் இலக்கு {dest} இன்னும் 5 நிமிடங்களில் வருகிறது.",
      arrival: "நீங்கள் உங்கள் இலக்கில் வந்துவிட்டீர்கள்.",
      missed: "நீங்கள் உங்கள் நிலையத்தை தவற விட்டீர்கள்.",
    },
  };

  const triggerAlarm = (level) => {
    setCurrentAlert(level);
    setIsAlarmRinging(true);
    // Voice announcement
    const msgTemplate = messages[language][level] || '';
    const msg = msgTemplate.replace('{dest}', journey.destinationStation);
    speakMessage(msg);
    if (intervalRef.current) clearInterval(intervalRef.current);
    alarmLoopRef.current = setInterval(() => {
      playLoudAlarm(audioCtxRef, oscillatorRef, gainRef);
      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500]);
      }
    }, 2000);
  };

  // Stop all alerts immediately (used by "I'm Awake")
  const stopAllAlerts = () => {
    setIsAlarmRinging(false);
    setCurrentAlert(null);
    if (alarmLoopRef.current) clearInterval(alarmLoopRef.current);
    stopLoudAlarm(oscillatorRef);
    window.speechSynthesis.cancel();
  };

  const acknowledgeAlarm = () => {
    // This is used when user manually acknowledges (e.g., from toast)
    stopAllAlerts();
    toast.success('Alert acknowledged.');
    if (timeRemaining > 0) {
      startSimulation();
    } else {
      setIsActive(false);
      releaseWakeLock();
    }
  };

  // "I'm Awake" handler – stops everything and hides alert UI
  const handleAwake = () => {
    stopAllAlerts();
    setIsActive(false);
    releaseWakeLock();
    setTimeRemaining(45); // reset for next journey if needed
  };

  const toggleAlertSystem = () => {
    if (isActive) {
      setIsActive(false);
      releaseWakeLock();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (alarmLoopRef.current) clearInterval(alarmLoopRef.current);
      stopLoudAlarm(oscillatorRef);
      window.speechSynthesis.cancel();
      setTimeRemaining(45);
      setIsAlarmRinging(false);
      setCurrentAlert(null);
    } else {
      setIsActive(true);
      requestWakeLock();
      startSimulation();
    }
  };

  // Effect to monitor timeRemaining and trigger alerts
  useEffect(() => {
    if (isActive && !isAlarmRinging) {
      if (timeRemaining === 30) triggerAlarm(30);
      else if (timeRemaining === 15) triggerAlarm(15);
      else if (timeRemaining === 10) triggerAlarm(10);
      else if (timeRemaining === 5) triggerAlarm(5);
      else if (timeRemaining <= 0) {
        triggerAlarm('arrival');
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }
  }, [timeRemaining, isActive, isAlarmRinging]);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (alarmLoopRef.current) clearInterval(alarmLoopRef.current);
      releaseWakeLock();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Detect user language (English default, Tamil if locale starts with 'ta')
  const language = navigator.language && navigator.language.startsWith('ta') ? 'ta' : 'en';

  const journey = {
    train: '12639 - Brindavan Express',
    from: 'Chennai Central',
    to: 'Bangalore City',
    destinationStation: 'Bangalore Cantt',
    stationsLeft: timeRemaining > 30 ? 4 : timeRemaining > 15 ? 2 : timeRemaining > 5 ? 1 : 0,
    currentStation: timeRemaining > 30 ? 'Jolarpettai' : timeRemaining > 15 ? 'Kuppam' : timeRemaining > 5 ? 'Krishnarajapuram' : 'Arriving',
  };

  return (
    <AlertContext.Provider
      value={{
        isActive,
        timeRemaining,
        setTimeRemaining,
        currentAlert,
        isAlarmRinging,
        journey,
        toggleAlertSystem,
        acknowledgeAlarm,
        // expose raw refs if needed
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};
