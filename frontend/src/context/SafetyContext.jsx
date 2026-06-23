// src/context/SafetyContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

const SafetyContext = createContext(null);

export const SafetyProvider = ({ children }) => {
  const { user } = useAuth();
  
  // ---------- Core States ----------
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [safetyStatus, setSafetyStatus] = useState('Safe'); // 'Safe' or 'Emergency'
  const [locationSharingActive, setLocationSharingActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: 13.0827, lng: 80.2707 }); // Chennai default
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine ? 'online' : 'offline');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isBatteryLow, setIsBatteryLow] = useState(false);

  // ---------- Lists ----------
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // ---------- Refs & Audio ----------
  const watchIdRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sirenIntervalRef = useRef(null);

  // ---------- Offline Mock Seeds (if no DB or fallback) ----------
  const defaultContacts = [
    { id: 'c1', name: 'Ravi (Father)', phone: '+919876543210', priority: true },
    { id: 'c2', name: 'Railway Police (RPF)', phone: '139', priority: true },
    { id: 'c3', name: 'Meena (Sister)', phone: '+918765432109', priority: false }
  ];

  const defaultFamily = [
    { 
      id: 'f1', 
      name: 'Aisha (Wife)', 
      phone: '+919988776655', 
      lat: 13.0850, 
      lng: 80.2720, 
      battery: 82, 
      network: 'online', 
      lastSeen: 'Just now', 
      safetyStatus: 'Safe' 
    },
    { 
      id: 'f2', 
      name: 'Ramesh (Father)', 
      phone: '+918877665544', 
      lat: 13.0790, 
      lng: 80.2680, 
      battery: 45, 
      network: 'online', 
      lastSeen: '5 mins ago', 
      safetyStatus: 'Safe' 
    },
    { 
      id: 'f3', 
      name: 'Sneha (Daughter)', 
      phone: '+917766554433', 
      lat: 12.9716, 
      lng: 77.5946, // Bangalore
      battery: 15, 
      network: 'offline', 
      lastSeen: '1 hour ago', 
      safetyStatus: 'Safe' 
    }
  ];

  const defaultActivities = [
    { id: 'a1', type: 'info', text: 'Safety system initialized', time: 'Just now' },
    { id: 'a2', type: 'warning', text: 'Sneha\'s battery is low (15%)', time: '1 hour ago' },
    { id: 'a3', type: 'info', text: 'Aisha shared live location', time: '2 hours ago' }
  ];

  // ---------- Sync with DB or LocalStorage ----------
  useEffect(() => {
    // 1. Setup default local storage fallback if empty
    const localContacts = localStorage.getItem('emergencyContacts');
    const localFamily = localStorage.getItem('familyMembers');
    const localActivity = localStorage.getItem('recentActivity');

    if (!localContacts) localStorage.setItem('emergencyContacts', JSON.stringify(defaultContacts));
    if (!localFamily) localStorage.setItem('familyMembers', JSON.stringify(defaultFamily));
    if (!localActivity) localStorage.setItem('recentActivity', JSON.stringify(defaultActivities));

    setEmergencyContacts(JSON.parse(localContacts || JSON.stringify(defaultContacts)));
    setFamilyMembers(JSON.parse(localFamily || JSON.stringify(defaultFamily)));
    setRecentActivity(JSON.parse(localActivity || JSON.stringify(defaultActivities)));

    // 2. If Firebase user is logged in, sync with firestore
    if (user) {
      const userSafetyRef = doc(db, 'safety', user.uid);
      const unsubscribe = onSnapshot(userSafetyRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.emergencyContacts) setEmergencyContacts(data.emergencyContacts);
          if (data.familyMembers) setFamilyMembers(data.familyMembers);
          if (data.recentActivity) setRecentActivity(data.recentActivity);
          if (data.safetyStatus) {
            setSafetyStatus(data.safetyStatus);
            setIsSOSActive(data.safetyStatus === 'Emergency');
          }
        } else {
          // Initialize Firestore safety doc with default local values
          setDoc(userSafetyRef, {
            emergencyContacts: JSON.parse(localContacts || JSON.stringify(defaultContacts)),
            familyMembers: JSON.parse(localFamily || JSON.stringify(defaultFamily)),
            recentActivity: JSON.parse(localActivity || JSON.stringify(defaultActivities)),
            safetyStatus: 'Safe',
            batteryLevel,
            networkStatus
          }).catch(err => console.error("Error creating safety doc:", err));
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  // ---------- Network Monitoring ----------
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online');
      addLog('system', 'Internet connection restored');
    };
    const handleOffline = () => {
      setNetworkStatus('offline');
      addLog('warning', 'Internet connection lost. Safety systems operating offline.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ---------- Battery Monitoring ----------
  useEffect(() => {
    if (!('getBattery' in navigator)) return;

    let batteryInstance = null;
    const updateBattery = (battery) => {
      const lvl = Math.round(battery.level * 100);
      setBatteryLevel(lvl);
      
      const isLow = lvl <= 20 && !battery.charging;
      setIsBatteryLow(isLow);
      
      if (isLow && !isBatteryLow) {
        addLog('warning', `Low battery alert! Phone is at ${lvl}% and discharging.`);
        // Simulating auto-notifying family
        addLog('info', `Sent low battery notification to emergency contacts.`);
      }
    };

    navigator.getBattery().then((battery) => {
      batteryInstance = battery;
      updateBattery(battery);
      battery.addEventListener('levelchange', () => updateBattery(battery));
      battery.addEventListener('chargingchange', () => updateBattery(battery));
    });

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', () => {});
        batteryInstance.removeEventListener('chargingchange', () => {});
      }
    };
  }, [isBatteryLow]);

  // ---------- Helper: Add Activity Log ----------
  const addLog = useCallback(async (type, text) => {
    const newLog = {
      id: 'act_' + Date.now(),
      type, // 'info', 'warning', 'emergency', 'system'
      text,
      time: 'Just now'
    };

    setRecentActivity(prev => {
      const updated = [newLog, ...prev.slice(0, 19)]; // Keep last 20
      localStorage.setItem('recentActivity', JSON.stringify(updated));
      return updated;
    });

    if (user) {
      const userSafetyRef = doc(db, 'safety', user.uid);
      try {
        await updateDoc(userSafetyRef, {
          recentActivity: arrayUnion(newLog)
        });
      } catch (err) {
        console.warn("Could not sync activity to Firebase:", err);
      }
    }
  }, [user]);

  // ---------- Geolocation Actions ----------
  const startLocationWatcher = () => {
    if (!('geolocation' in navigator)) return;

    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        // Simulating updating user location on Firebase
        if (user && locationSharingActive) {
          const userSafetyRef = doc(db, 'safety', user.uid);
          updateDoc(userSafetyRef, {
            userLocation: { lat: latitude, lng: longitude, updatedAt: new Date().toISOString() }
          }).catch(e => console.warn(e));
        }
      },
      (err) => {
        console.warn('Geolocation watch error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopLocationWatcher = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Toggle Live Location Sharing
  const toggleLocationSharing = () => {
    setLocationSharingActive(prev => {
      const next = !prev;
      if (next) {
        startLocationWatcher();
        addLog('info', 'Live location sharing activated');
      } else {
        stopLocationWatcher();
        addLog('info', 'Live location sharing deactivated');
      }
      return next;
    });
  };

  // ---------- Siren Sound Maker (Web Audio) ----------
  const playSiren = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    let oscState = true;
    sirenIntervalRef.current = setInterval(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(oscState ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
      
      oscState = !oscState;
    }, 500);
  };

  const stopSiren = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
  };

  // ---------- SOS Core Trigger ----------
  const triggerSOS = useCallback(() => {
    setIsSOSActive(true);
    setSafetyStatus('Emergency');
    playSiren();
    addLog('emergency', '🔴 SOS EMERGENCY TRIGGERED! Alerts sent to all contacts.');

    // Speech announcement for Tamil & English
    try {
      const utterance = new SpeechSynthesisUtterance("Emergency alert triggered. Contacts are being notified.");
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } catch(e) {}

    // Vibrate phone if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([1000, 500, 1000, 500, 1000]);
    }

    if (user) {
      const userSafetyRef = doc(db, 'safety', user.uid);
      updateDoc(userSafetyRef, {
        safetyStatus: 'Emergency'
      }).catch(err => console.warn(err));
    }
  }, [user, addLog]);

  const cancelSOS = useCallback(() => {
    setIsSOSActive(false);
    setSafetyStatus('Safe');
    stopSiren();
    addLog('info', '🟢 SOS Cancelled. Safety status returned to Normal.');

    try {
      const utterance = new SpeechSynthesisUtterance("SOS mode cancelled. Safety status restored.");
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } catch(e) {}

    if (user) {
      const userSafetyRef = doc(db, 'safety', user.uid);
      updateDoc(userSafetyRef, {
        safetyStatus: 'Safe'
      }).catch(err => console.warn(err));
    }
  }, [user, addLog]);

  // ---------- Contact Management ----------
  const addEmergencyContact = async (contact) => {
    const newContact = {
      id: 'c_' + Date.now(),
      ...contact
    };

    setEmergencyContacts(prev => {
      const updated = [...prev, newContact];
      localStorage.setItem('emergencyContacts', JSON.stringify(updated));
      return updated;
    });

    addLog('info', `Added emergency contact: ${contact.name}`);

    if (user) {
      const userSafetyRef = doc(db, 'safety', user.uid);
      try {
        await updateDoc(userSafetyRef, {
          emergencyContacts: arrayUnion(newContact)
        });
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const deleteEmergencyContact = async (id) => {
    const contactToRemove = emergencyContacts.find(c => c.id === id);
    if (!contactToRemove) return;

    setEmergencyContacts(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('emergencyContacts', JSON.stringify(updated));
      return updated;
    });

    addLog('info', `Removed emergency contact: ${contactToRemove.name}`);

    if (user) {
      const userSafetyRef = doc(db, 'safety', user.uid);
      try {
        await updateDoc(userSafetyRef, {
          emergencyContacts: arrayRemove(contactToRemove)
        });
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // ---------- Family Management ----------
  const addFamilyMember = async (member) => {
    const newMember = {
      id: 'f_' + Date.now(),
      lat: 13.0827 + (Math.random() - 0.5) * 0.02, // Chennai near
      lng: 80.2707 + (Math.random() - 0.5) * 0.02,
      battery: 100,
      network: 'online',
      lastSeen: 'Just now',
      safetyStatus: 'Safe',
      ...member
    };

    setFamilyMembers(prev => {
      const updated = [...prev, newMember];
      localStorage.setItem('familyMembers', JSON.stringify(updated));
      return updated;
    });

    addLog('info', `Added family member: ${member.name}`);

    if (user) {
      const userSafetyRef = doc(db, 'safety', user.uid);
      try {
        await updateDoc(userSafetyRef, {
          familyMembers: arrayUnion(newMember)
        });
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const deleteFamilyMember = async (id) => {
    const memberToRemove = familyMembers.find(f => f.id === id);
    if (!memberToRemove) return;

    setFamilyMembers(prev => {
      const updated = prev.filter(f => f.id !== id);
      localStorage.setItem('familyMembers', JSON.stringify(updated));
      return updated;
    });

    addLog('info', `Removed family member: ${memberToRemove.name}`);

    if (user) {
      const userSafetyRef = doc(db, 'safety', user.uid);
      try {
        await updateDoc(userSafetyRef, {
          familyMembers: arrayRemove(memberToRemove)
        });
      } catch (err) {
        console.warn(err);
      }
    }
  };

  return (
    <SafetyContext.Provider
      value={{
        isSOSActive,
        safetyStatus,
        locationSharingActive,
        currentLocation,
        networkStatus,
        batteryLevel,
        isBatteryLow,
        emergencyContacts,
        familyMembers,
        recentActivity,
        triggerSOS,
        cancelSOS,
        toggleLocationSharing,
        addEmergencyContact,
        deleteEmergencyContact,
        addFamilyMember,
        deleteFamilyMember,
        addLog
      }}
    >
      {children}
    </SafetyContext.Provider>
  );
};

export const useSafety = () => {
  const context = useContext(SafetyContext);
  if (!context) throw new Error('useSafety must be used within SafetyProvider');
  return context;
};
