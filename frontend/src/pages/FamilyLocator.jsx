// src/pages/FamilyLocator.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafety } from '../context/SafetyContext';
import { 
  Shield, 
  ShieldAlert, 
  Plus, 
  Phone, 
  MessageSquare, 
  Share2, 
  MapPin, 
  Battery, 
  Wifi, 
  WifiOff, 
  Clock, 
  Trash2, 
  UserPlus, 
  AlertTriangle, 
  Heart, 
  Info, 
  Navigation,
  CheckCircle,
  X,
  PhoneCall
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function FamilyLocator() {
  const navigate = useNavigate();
  const {
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
  } = useSafety();

  // ---------- Form States ----------
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [famName, setFamName] = useState('');
  const [famPhone, setFamPhone] = useState('');
  const [famRel, setFamRel] = useState('Spouse');

  const [showAddContact, setShowAddContact] = useState(false);
  const [conName, setConName] = useState('');
  const [conPhone, setConPhone] = useState('');
  const [conPriority, setConPriority] = useState(false);

  // ---------- Map Refs ----------
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // ---------- Center on Member ----------
  const centerOnCoord = (lat, lng, name) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 14, { animate: true });
      if (markersRef.current[name]) {
        markersRef.current[name].openPopup();
      }
      // Scroll map into view
      mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // ---------- Leaflet Map Setup & Updates ----------
  useEffect(() => {
    // 1. Initialize Map once
    if (!mapInstanceRef.current && mapContainerRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [currentLocation.lat, currentLocation.lng],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers to prevent duplicates
    Object.values(markersRef.current).forEach(marker => map.removeLayer(marker));
    markersRef.current = {};

    // 2. Add User Marker (You)
    const userHtml = `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-60"></div>
        <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md"></div>
      </div>
    `;
    const userIcon = L.divIcon({
      html: userHtml,
      className: 'custom-user-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const userMarker = L.marker([currentLocation.lat, currentLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(`<strong>You (Traveler)</strong><br/>Battery: ${batteryLevel}%<br/>Network: ${networkStatus}`);
    
    markersRef.current['You'] = userMarker;

    // 3. Add Family Member Markers
    familyMembers.forEach(member => {
      const isEmerg = member.safetyStatus === 'Emergency';
      const color = isEmerg ? 'red' : 'green';
      
      const memberHtml = `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 bg-${color}-500 rounded-full ${isEmerg ? 'animate-ping' : ''} opacity-40"></div>
          <div class="relative w-7 h-7 bg-white border-2 border-${color}-500 rounded-full flex items-center justify-center text-[10px] font-black text-slate-800 shadow-md">
            ${member.name.substring(0, 2).toUpperCase()}
          </div>
        </div>
      `;

      const memberIcon = L.divIcon({
        html: memberHtml,
        className: `custom-member-${member.id}`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const popupHtml = `
        <div style="font-family: sans-serif; font-size: 13px;">
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #1e293b;">${member.name}</h4>
          <p style="margin: 0; color: #64748b;">Relation: ${member.relation || 'Family'}</p>
          <p style="margin: 2px 0 0 0; color: ${member.safetyStatus === 'Emergency' ? '#ef4444' : '#10b981'}; font-weight: bold;">
            Status: ${member.safetyStatus}
          </p>
          <p style="margin: 2px 0 0 0; color: #64748b;">Battery: ${member.battery}% · ${member.network}</p>
          <p style="margin: 2px 0 0 0; font-size: 10px; color: #94a3b8;">Last seen: ${member.lastSeen}</p>
        </div>
      `;

      const marker = L.marker([member.lat, member.lng], { icon: memberIcon })
        .addTo(map)
        .bindPopup(popupHtml);

      markersRef.current[member.name] = marker;
    });

  }, [currentLocation, familyMembers, batteryLevel, networkStatus]);

  // ---------- Action Handlers ----------
  const handleAddFamily = (e) => {
    e.preventDefault();
    if (!famName || !famPhone) return;
    addFamilyMember({
      name: famName,
      phone: famPhone,
      relation: famRel
    });
    setFamName('');
    setFamPhone('');
    setShowAddFamily(false);
  };

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!conName || !conPhone) return;
    addEmergencyContact({
      name: conName,
      phone: conPhone,
      priority: conPriority
    });
    setConName('');
    setConPhone('');
    setConPriority(false);
    setShowAddContact(false);
  };

  const simulateAlert = () => {
    addLog('info', 'Simulated emergency alert sent to all family members');
    alert('SMS alerts sent successfully! Check the Recent Activity log.');
  };

  const simulateCall = (contactName, contactPhone) => {
    addLog('info', `Initiated emergency voice call to ${contactName} (${contactPhone})`);
    alert(`Calling ${contactName} at ${contactPhone}...\n[Simulated Call Active]`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto px-4 pb-12">
      
      {/* ── SAFETY STATUS HEADER BANNER ── */}
      <div className={`rounded-3xl p-6 border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 ${
        isSOSActive 
          ? 'bg-red-50 border-red-200 text-red-950' 
          : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100 text-emerald-950'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${isSOSActive ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
            {isSOSActive ? <ShieldAlert className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Safety Shield</div>
            <h1 className="text-2xl font-black mt-0.5">
              Status: {isSOSActive ? 'EMERGENCY MODE ACTIVE' : 'SECURE & SHARING'}
            </h1>
            <p className="text-sm mt-1 text-slate-600">
              {isSOSActive 
                ? 'Your emergency contacts and RPF have been alerted with your coordinates.' 
                : 'Your family is currently receiving your real-time GPS coordinates.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Device Diagnostics</span>
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5 justify-end">
              <Battery className="w-3.5 h-3.5" /> {batteryLevel}% 
              {networkStatus === 'online' ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-red-500" />} 
              <span className="capitalize">{networkStatus}</span>
            </span>
          </div>
          
          {isSOSActive && (
            <button 
              onClick={cancelSOS}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg shadow-red-200 uppercase tracking-wider"
            >
              Cancel SOS
            </button>
          )}
        </div>
      </div>

      {/* ── TWO-COLUMN DASHBOARD ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: SOS, Map, Quick Actions */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* SOS button Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">In Case of Emergency</div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-6">One-Tap SOS Broadcast</h2>
            
            {/* The Giant SOS Button */}
            <button
              onClick={triggerSOS}
              className="w-44 h-44 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-2xl flex flex-col items-center justify-center shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95 transition-all duration-300 relative group"
            >
              <div className="absolute inset-0 rounded-full border-8 border-white/20 animate-ping pointer-events-none group-hover:scale-110" />
              <ShieldAlert className="w-10 h-10 mb-1" />
              <span>SOS</span>
              <span className="text-[9px] uppercase tracking-wider text-red-200 mt-1">Tap to Trigger</span>
            </button>

            <p className="text-xs text-slate-400 mt-6 max-w-sm">
              Pressing this button activates a loud alarm, broadcasts your GPS coordinates to all family members, and relays alerts to RPF.
            </p>
          </div>

          {/* Map Section */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center px-2">
              <div>
                <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-5 h-5 text-blue-600" /> Live Safety Map
                </h3>
                <p className="text-xs text-slate-400">View real-time coordinates of your circle</p>
              </div>
              <button 
                onClick={() => centerOnCoord(currentLocation.lat, currentLocation.lng, 'You')}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 text-blue-600 flex items-center gap-1 text-xs font-bold"
                title="Locate Myself"
              >
                <Navigation className="w-3.5 h-3.5" /> Locate Me
              </button>
            </div>

            {/* Map Container */}
            <div 
              ref={mapContainerRef} 
              className="w-full h-80 rounded-2xl overflow-hidden border border-slate-100 shadow-inner relative z-10"
              style={{ minHeight: '320px' }}
            />
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-extrabold text-slate-800 mb-4">Quick Safety Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <button
                onClick={toggleLocationSharing}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-4 transition-all ${
                  locationSharingActive 
                    ? 'bg-blue-50/50 border-blue-200 text-blue-900' 
                    : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Share2 className={`w-5 h-5 ${locationSharingActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">Live Sharing</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {locationSharingActive ? 'Active (Tap to pause)' : 'Inactive (Tap to start)'}
                  </div>
                </div>
              </button>

              <button
                onClick={simulateAlert}
                className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 text-slate-700 text-left flex flex-col justify-between gap-4 transition-all"
              >
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">Send SMS Alert</div>
                  <div className="text-[11px] text-slate-500 mt-1">Simulate blast SMS to contacts</div>
                </div>
              </button>

              <div className="relative">
                <button
                  onClick={() => {
                    const priority = emergencyContacts.find(c => c.priority);
                    if (priority) {
                      simulateCall(priority.name, priority.phone);
                    } else if (emergencyContacts.length > 0) {
                      simulateCall(emergencyContacts[0].name, emergencyContacts[0].phone);
                    } else {
                      alert('Please add an emergency contact first!');
                    }
                  }}
                  className="w-full p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 text-slate-700 text-left flex flex-col justify-between gap-4 h-full transition-all"
                >
                  <PhoneCall className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider">Speed Dial SOS</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {emergencyContacts.find(c => c.priority)
                        ? `Call ${emergencyContacts.find(c => c.priority).name}`
                        : 'Call priority contact'}
                    </div>
                  </div>
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Family Circle, Contacts, Activity Logs, Tips */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Family Circle Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800">Family Members</h3>
                <p className="text-[10px] text-slate-400">Track and view safety of loved ones</p>
              </div>
              <button 
                onClick={() => setShowAddFamily(!showAddFamily)}
                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Add Family Member"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add Family Member Form */}
            {showAddFamily && (
              <form onSubmit={handleAddFamily} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2.5 animate-fade-in">
                <div className="text-xs font-bold text-slate-700">New Family Member</div>
                <input 
                  type="text" placeholder="Name (e.g. Meena)" value={famName} onChange={e => setFamName(e.target.value)} required
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input 
                  type="tel" placeholder="Phone Number" value={famPhone} onChange={e => setFamPhone(e.target.value)} required
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-500">Relation</span>
                  <select 
                    value={famRel} onChange={e => setFamRel(e.target.value)}
                    className="text-xs p-1 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-1">
                  <button type="button" onClick={() => setShowAddFamily(false)} className="w-full py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">Cancel</button>
                  <button type="submit" className="w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg">Save</button>
                </div>
              </form>
            )}

            {/* Family List */}
            <div className="flex flex-col gap-3">
              {familyMembers.length === 0 ? (
                <div className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No family members added.
                </div>
              ) : (
                familyMembers.map(member => {
                  const isEmerg = member.safetyStatus === 'Emergency';
                  return (
                    <div 
                      key={member.id} 
                      className={`p-3 rounded-2xl border transition-all ${
                        isEmerg ? 'bg-red-50 border-red-200' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black uppercase text-slate-800 ${
                            isEmerg ? 'bg-red-200 text-red-950 border border-red-300' : 'bg-blue-100'
                          }`}>
                            {member.name.substring(0, 2)}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                              {member.name}
                              <span className="text-[9px] bg-slate-200/80 px-1.5 py-0.5 rounded-full text-slate-500 font-semibold">{member.relation}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{member.phone}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteFamilyMember(member.id)}
                          className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Status / Metadata */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Battery className={`w-3 h-3 ${member.battery <= 20 ? 'text-red-500' : 'text-slate-400'}`} />
                          {member.battery}%
                        </span>
                        <span className="flex items-center gap-1">
                          {member.network === 'online' ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-red-400" />}
                          <span className="capitalize">{member.network}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          {member.lastSeen}
                        </span>
                      </div>

                      {/* Locate Button */}
                      <button
                        onClick={() => centerOnCoord(member.lat, member.lng, member.name)}
                        className="w-full mt-2.5 py-1.5 bg-white border border-slate-100 hover:bg-slate-50 text-[10px] font-bold text-blue-600 rounded-lg shadow-sm flex items-center justify-center gap-1 transition-colors"
                      >
                        <MapPin className="w-3 h-3" /> Locate on Map
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Emergency Contacts Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800">Emergency Contacts</h3>
                <p className="text-[10px] text-slate-400">Priority numbers called first in SOS</p>
              </div>
              <button 
                onClick={() => setShowAddContact(!showAddContact)}
                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Add Contact"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add Contact Form */}
            {showAddContact && (
              <form onSubmit={handleAddContact} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2.5 animate-fade-in">
                <div className="text-xs font-bold text-slate-700">New Emergency Contact</div>
                <input 
                  type="text" placeholder="Contact Name (e.g. Sister)" value={conName} onChange={e => setConName(e.target.value)} required
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input 
                  type="tel" placeholder="Phone Number" value={conPhone} onChange={e => setConPhone(e.target.value)} required
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <label className="flex items-center gap-1.5 text-[10px] text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={conPriority} onChange={e => setConPriority(e.target.checked)} className="accent-blue-600" />
                  Make Priority (Auto-call)
                </label>
                <div className="flex gap-2 mt-1">
                  <button type="button" onClick={() => setShowAddContact(false)} className="w-full py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">Cancel</button>
                  <button type="submit" className="w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg">Save</button>
                </div>
              </form>
            )}

            {/* Contact List */}
            <div className="flex flex-col gap-2.5">
              {emergencyContacts.length === 0 ? (
                <div className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No emergency contacts.
                </div>
              ) : (
                emergencyContacts.map(contact => (
                  <div key={contact.id} className="p-3 bg-slate-50/50 border border-slate-100 hover:bg-slate-50 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        contact.priority ? 'bg-red-100 text-red-600 font-extrabold' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {contact.priority ? '★' : <Phone className="w-3.5 h-3.5" />}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                          {contact.name}
                          {contact.priority && <span className="text-[8px] bg-red-100 text-red-700 px-1 py-0.2 rounded-md font-extrabold tracking-wider uppercase">Priority</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{contact.phone}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => simulateCall(contact.name, contact.phone)}
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-100 text-emerald-600 rounded-lg transition-colors"
                        title="Simulate Call"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteEmergencyContact(contact.id)}
                        className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800">Recent Activity Log</h3>
              <p className="text-[10px] text-slate-400">Chronological history of safety alerts</p>
            </div>
            
            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
              {recentActivity.length === 0 ? (
                <div className="text-xs text-slate-400 italic text-center py-4">No safety activity logged.</div>
              ) : (
                recentActivity.map(act => (
                  <div key={act.id} className="flex gap-2.5 items-start">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${
                      act.type === 'emergency' ? 'bg-red-500 animate-ping' :
                      act.type === 'warning' ? 'bg-amber-500' :
                      act.type === 'system' ? 'bg-blue-500' : 'bg-slate-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-normal ${
                        act.type === 'emergency' ? 'font-black text-red-600' : 'text-slate-600'
                      }`}>
                        {act.text}
                      </p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{act.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Railway Safety Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-slate-800 flex items-center gap-1.5 text-sm mb-4">
              <Info className="w-4 h-4 text-blue-600" /> Railway Safety Tips
            </h3>
            
            <div className="flex flex-col gap-3.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p>Keep the Indian Railways official helpline number <strong>139</strong> saved. It coordinates medical, security, and cleaning issues.</p>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p>Never share your <strong>PNR number</strong> or ticket screenshot on social media or with strangers. This protects your boarding location details.</p>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p>Use Yathrava's <strong>Voice Assistant</strong> ("Help Me" or "Emergency" or "உதவி வேண்டும்") for hands-free SOS triggers when you cannot reach your phone.</p>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p>Set a <strong>Missed Station Alert</strong> in the app before you sleep. The alarm will ring loudly before your destination arrives.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
