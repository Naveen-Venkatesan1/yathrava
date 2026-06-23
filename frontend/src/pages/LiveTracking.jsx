import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { 
  ArrowLeft, Search, Navigation, AlertTriangle, 
  Volume2, ShieldAlert, Play, Pause, RotateCcw, 
  ZoomIn, ZoomOut, Maximize, MapPin, Compass
} from "lucide-react";

// Default India Railway database seeding data
const defaultStations = [
  { code: "MAS", name: "Chennai Central", city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707 },
  { code: "BPL", name: "Bhopal Junction", city: "Bhopal", state: "Madhya Pradesh", lat: 23.2581, lon: 77.4126 },
  { code: "NDLS", name: "New Delhi Station", city: "New Delhi", state: "Delhi", lat: 28.6400, lon: 77.2200 },
  { code: "SBC", name: "Bangalore City", city: "Bengaluru", state: "Karnataka", lat: 12.9716, lon: 77.5937 },
  { code: "HWH", name: "Howrah Junction", city: "Kolkata", state: "West Bengal", lat: 22.5856, lon: 88.3462 }
];

const defaultRoutes = [
  {
    train_number: "12621",
    train_name: "TAMIL NADU EXP",
    type: "Express",
    stops: [
      { station_code: "MAS", arrival: "06:00", departure: "06:10", platform: "4", distance_km: 0, sequence: 1 },
      { station_code: "SBC", arrival: "11:20", departure: "11:30", platform: "3", distance_km: 360, sequence: 2 },
      { station_code: "BPL", arrival: "21:30", departure: "21:40", platform: "2", distance_km: 1400, sequence: 3 },
      { station_code: "NDLS", arrival: "07:00", departure: "07:15", platform: "1", distance_km: 2180, sequence: 4 }
    ]
  },
  {
    train_number: "12239",
    train_name: "WAYRAMPUR EXP",
    type: "Express",
    stops: [
      { station_code: "SBC", arrival: "05:00", departure: "05:10", platform: "5", distance_km: 0, sequence: 1 },
      { station_code: "MAS", arrival: "10:15", departure: "10:30", platform: "2", distance_km: 360, sequence: 2 },
      { station_code: "HWH", arrival: "22:45", departure: "22:55", platform: "3", distance_km: 1660, sequence: 3 },
      { station_code: "NDLS", arrival: "08:10", departure: "08:25", platform: "6", distance_km: 2500, sequence: 4 }
    ]
  }
];

export default function LiveTracking() {
  const navigate = useNavigate();

  // Seeding and Database states
  const [seeding, setSeeding] = useState(false);
  const [stations, setStations] = useState([]);
  const [routes, setRoutes] = useState([]);
  
  // Search and UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [selectedStartStation, setSelectedStartStation] = useState("");
  
  // Map zoom and pan states
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Journey Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const simIntervalRef = useRef(null);

  // Auto-seed Firestore collections on mount
  useEffect(() => {
    const fetchAndSeed = async () => {
      setSeeding(true);
      try {
        // Fetch Stations
        const stationSnap = await getDocs(collection(db, "stations"));
        let loadedStations = [];
        if (stationSnap.empty) {
          for (const s of defaultStations) {
            await setDoc(doc(db, "stations", s.code), s);
            loadedStations.push(s);
          }
          console.log("Seeded default stations in Firestore.");
        } else {
          stationSnap.forEach(d => loadedStations.push(d.data()));
        }
        setStations(loadedStations);

        // Fetch Routes
        const routeSnap = await getDocs(collection(db, "routes"));
        let loadedRoutes = [];
        if (routeSnap.empty) {
          for (const r of defaultRoutes) {
            await setDoc(doc(db, "routes", r.train_number), r);
            loadedRoutes.push(r);
          }
          console.log("Seeded default routes in Firestore.");
        } else {
          routeSnap.forEach(d => loadedRoutes.push(d.data()));
        }
        setRoutes(loadedRoutes);
      } catch (err) {
        console.error("Firebase seeding failed:", err);
      } finally {
        setSeeding(false);
      }
    };
    fetchAndSeed();
  }, []);

  // Map projection: Latitude & Longitude to SVG coordinate space (600x500 viewport)
  const projectCoords = (lat, lon) => {
    // Latitude (India: approx 8° N to 36° N)
    // Longitude (India: approx 68° E to 98° E)
    const minLat = 7.0;
    const maxLat = 37.0;
    const minLon = 67.0;
    const maxLon = 99.0;
    
    // Scale viewport
    const width = 500;
    const height = 450;
    
    const x = ((lon - minLon) / (maxLon - minLon)) * width + 50;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * height + 50;
    return { x, y };
  };

  // Drag and drop map panning handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom handlers
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Filter routes based on query
  const filteredRoutes = routes.filter(r => 
    r.train_number.includes(searchQuery) || 
    r.train_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic calculations based on selected train and simulation progress
  let activeStops = [];
  let trainPos = { x: 0, y: 0 };
  let currentStop = null;
  let nextStop = null;
  let remainingStopsCount = 0;
  let etaMinutes = 0;
  let isWrongTrain = false;

  if (selectedTrain) {
    // Get ordered stops
    activeStops = selectedTrain.stops.sort((a, b) => a.sequence - b.sequence);
    
    // Check Wrong Train Condition:
    // If the user selected a boarding station that does not exist in the train's route
    if (selectedStartStation && !activeStops.some(s => s.station_code === selectedStartStation)) {
      isWrongTrain = true;
    }

    // Determine segments
    const segmentCount = activeStops.length - 1;
    const progressPerSegment = 100 / segmentCount;
    
    const segmentIndex = Math.min(
      Math.floor(progress / progressPerSegment),
      segmentCount - 1
    );

    // Get current and next station coordinates
    const s1 = stations.find(s => s.code === activeStops[segmentIndex].station_code);
    const s2 = stations.find(s => s.code === activeStops[segmentIndex + 1].station_code);

    if (s1 && s2) {
      const p1 = projectCoords(s1.lat, s1.lon);
      const p2 = projectCoords(s2.lat, s2.lon);
      
      // Calculate fraction of current segment progress
      const segmentProgress = (progress % progressPerSegment) / progressPerSegment;
      
      // Interpolate coordinates
      trainPos = {
        x: p1.x + (p2.x - p1.x) * segmentProgress,
        y: p1.y + (p2.y - p1.y) * segmentProgress
      };
      
      currentStop = s1;
      nextStop = s2;
      remainingStopsCount = activeStops.length - (segmentIndex + 1);
      
      // Estimated Time Arrival (simple simulation calculation)
      const totalKm = s2.distance_km || 100;
      const leftPercent = 1 - segmentProgress;
      etaMinutes = Math.max(1, Math.round(leftPercent * totalKm * 0.8));
    }
  }

  // Simulation play/pause control loop
  const startSimulation = () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setIsSimulating(true);

    // Trigger starting voice announcement
    if (selectedTrain && currentStop) {
      speakAnnouncement(
        `Train ${selectedTrain.train_number} is departing ${currentStop.name}. The next station is ${nextStop ? nextStop.name : 'your destination'}.`,
        `ரயில் வண்டி ${selectedTrain.train_number} தற்போது ${currentStop.name} லிருந்து புறப்படுகிறது. அடுத்த நிலையம் ${nextStop ? nextStop.name : 'சேருமிடம்'}.`
      );
    }

    simIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(simIntervalRef.current);
          setIsSimulating(false);
          // Play final arrived speech
          speakAnnouncement(
            "Welcome! You have arrived at your destination station.",
            "வரவேற்கிறோம்! நீங்கள் உங்களது சேருமிட நிலையத்திற்கு வந்து சேர்ந்தீர்கள்."
          );
          return 100;
        }
        return prev + 1;
      });
    }, 450); // Increment 1% every 450ms
  };

  const stopSimulation = () => {
    clearInterval(simIntervalRef.current);
    setIsSimulating(false);
  };

  const resetSimulation = () => {
    stopSimulation();
    setProgress(0);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearInterval(simIntervalRef.current);
  }, []);

  // Bilingual announcement trigger using Web Speech API
  const speakAnnouncement = (enText, taText) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const utteranceEn = new SpeechSynthesisUtterance(enText);
    utteranceEn.lang = "en-IN";
    utteranceEn.rate = 0.95;

    const utteranceTa = new SpeechSynthesisUtterance(taText);
    utteranceTa.lang = "ta-IN";
    utteranceTa.rate = 0.85;

    window.speechSynthesis.speak(utteranceEn);
    window.speechSynthesis.speak(utteranceTa);
  };

  const triggerVoiceUpdate = () => {
    if (!selectedTrain || !currentStop || !nextStop) return;
    const en = `Your train is currently travelling between ${currentStop.name} and ${nextStop.name}. Estimated arrival time is in ${etaMinutes} minutes.`;
    const ta = `உங்களது ரயில் தற்போது ${currentStop.name} மற்றும் ${nextStop.name} இடையே சென்று கொண்டிருக்கிறது. தோராயமாக இன்னும் ${etaMinutes} நிமிடங்களில் வந்தடையும்.`;
    speakAnnouncement(en, ta);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "90vh", fontFamily: "system-ui, sans-serif" }}>
      
      {/* Back to Dashboard Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "50%", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyCenter: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
        >
          <ArrowLeft style={{ margin: "auto", color: "#0f172a" }} size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>Route & Live Journey Map</h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>Live tracking and railway visualizer for Indian Railways</p>
        </div>
      </div>

      {seeding ? (
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
          <Loader2 className="animate-spin text-[#3b82f6]" size={40} />
          <p style={{ fontWeight: 600, color: "#475569" }}>Seeding database with routes and stations...</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", lg: "repeat(12, 1fr)", gap: "1.5rem", width: "100%", flex: 1 }}>
          
          {/* LEFT COLUMN: Search & Map Interface */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", gridColumn: "span 8" }}>
            
            {/* Train Route Search Box */}
            <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "1.25rem", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Search size={18} className="text-[#3b82f6]" /> Search Train Route
              </h2>
              
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
                  <input 
                    type="text"
                    placeholder="Enter train number or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "0.75rem", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                  <Search size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                </div>
              </div>

              {/* Suggestions */}
              {searchQuery && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem", background: "#f8fafc", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
                  <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0, fontWeight: 700 }}>MATCHING TRAINS:</p>
                  {filteredRoutes.length > 0 ? (
                    filteredRoutes.map(route => (
                      <button
                        key={route.train_number}
                        onClick={() => {
                          setSelectedTrain(route);
                          setSearchQuery("");
                          setProgress(0);
                          setIsSimulating(false);
                        }}
                        style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.5rem", cursor: "pointer", textAlign: "left" }}
                      >
                        <div>
                          <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>{route.train_name}</strong>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.5rem" }}>({route.train_number})</span>
                        </div>
                        <span style={{ fontSize: "0.75rem", background: "#dbeafe", color: "#1d4ed8", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 600 }}>{route.type}</span>
                      </button>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No matching trains found. Try "12621" or "12239"</span>
                  )}
                </div>
              )}

              {/* Available Trains quick links */}
              {!selectedTrain && (
                <div style={{ marginTop: "1rem" }}>
                  <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0 0 0.5rem 0", fontWeight: 700 }}>SELECT A TRAIN ROUTE TO TRACK:</p>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {routes.map(r => (
                      <button
                        key={r.train_number}
                        onClick={() => {
                          setSelectedTrain(r);
                          setProgress(0);
                          setIsSimulating(false);
                        }}
                        style={{ padding: "0.75rem 1rem", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "0.75rem", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "160px" }}
                      >
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>{r.train_name}</span>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Train No: {r.train_number}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Railway Map Panel */}
            <div 
              style={{ 
                background: "#0f172a", 
                borderRadius: "1.25rem", 
                boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)", 
                position: "relative",
                height: "480px",
                overflow: "hidden",
                border: "2px solid #1e293b",
                display: "flex",
                flexDirection: "column"
              }}
            >
              
              {/* Map Header Controls */}
              <div style={{ position: "absolute", top: "1rem", left: "1rem", zIndex: 10, display: "flex", gap: "0.5rem" }}>
                <button onClick={zoomIn} style={{ background: "rgba(30, 41, 59, 0.8)", border: "1px solid #334155", color: "#fff", padding: "0.5rem", borderRadius: "8px", cursor: "pointer", display: "flex", backdropFilter: "blur(4px)" }} title="Zoom In">
                  <ZoomIn size={18} />
                </button>
                <button onClick={zoomOut} style={{ background: "rgba(30, 41, 59, 0.8)", border: "1px solid #334155", color: "#fff", padding: "0.5rem", borderRadius: "8px", cursor: "pointer", display: "flex", backdropFilter: "blur(4px)" }} title="Zoom Out">
                  <ZoomOut size={18} />
                </button>
                <button onClick={resetZoom} style={{ background: "rgba(30, 41, 59, 0.8)", border: "1px solid #334155", color: "#fff", padding: "0.5rem 0.75rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, display: "flex", backdropFilter: "blur(4px)" }}>
                  Reset Map
                </button>
              </div>

              {/* Compass Indicator */}
              <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10, display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(15, 23, 42, 0.6)", padding: "0.4rem 0.8rem", borderRadius: "999px", border: "1px solid #1e293b" }}>
                <Compass size={16} className="text-[#3b82f6] animate-pulse" />
                <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>LIVE RADAR</span>
              </div>

              {/* Map Canvas */}
              <div 
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ 
                  flex: 1, 
                  cursor: isDragging ? "grabbing" : "grab",
                  position: "relative"
                }}
              >
                <svg 
                  width="100%" 
                  height="100%" 
                  viewBox="0 0 600 500" 
                  style={{ 
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: "center center",
                    transition: isDragging ? "none" : "transform 0.15s ease-out"
                  }}
                >
                  {/* Grid Lines Pattern */}
                  <defs>
                    <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <rect width="40" height="40" fill="none" />
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  
                  <rect width="100%" height="100%" fill="url(#radarGrid)" />

                  {/* Stylized background boundary for India */}
                  <path 
                    d="M 150 70 L 320 60 L 380 120 L 450 160 L 490 220 L 410 260 L 420 310 L 320 480 L 250 480 L 190 320 L 120 220 L 110 140 Z" 
                    fill="#111827" 
                    stroke="#1e293b" 
                    strokeWidth="2" 
                    opacity="0.8" 
                  />

                  {/* Render ALL stations in the database as base nodes */}
                  {stations.map(st => {
                    const pos = projectCoords(st.lat, st.lon);
                    return (
                      <g key={st.code}>
                        <circle 
                          cx={pos.x} 
                          cy={pos.y} 
                          r="6" 
                          fill="#1e293b" 
                          stroke="#475569" 
                          strokeWidth="1.5" 
                        />
                        <text 
                          x={pos.x + 8} 
                          y={pos.y + 3} 
                          fill="#475569" 
                          fontSize="9" 
                          fontWeight="700"
                        >
                          {st.code}
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw the selected train route path */}
                  {selectedTrain && activeStops.length > 1 && (
                    <>
                      {/* Base Track Line */}
                      <path
                        d={activeStops.map((stop, i) => {
                          const st = stations.find(s => s.code === stop.station_code);
                          if (!st) return "";
                          const pos = projectCoords(st.lat, st.lon);
                          return `${i === 0 ? "M" : "L"} ${pos.x} ${pos.y}`;
                        }).join(" ")}
                        fill="none"
                        stroke="#334155"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      
                      {/* Active Route Pulse Track */}
                      <path
                        d={activeStops.map((stop, i) => {
                          const st = stations.find(s => s.code === stop.station_code);
                          if (!st) return "";
                          const pos = projectCoords(st.lat, st.lon);
                          return `${i === 0 ? "M" : "L"} ${pos.x} ${pos.y}`;
                        }).join(" ")}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeDasharray="8 4"
                        strokeLinecap="round"
                        className="active-route"
                        style={{
                          animation: "dash 30s linear infinite"
                        }}
                      />

                      {/* Route Station Dots */}
                      {activeStops.map(stop => {
                        const st = stations.find(s => s.code === stop.station_code);
                        if (!st) return null;
                        const pos = projectCoords(st.lat, st.lon);
                        return (
                          <g key={stop.station_code}>
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r="8"
                              fill="#0f172a"
                              stroke="#3b82f6"
                              strokeWidth="2"
                            />
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r="4"
                              fill="#60a5fa"
                            />
                            <text
                              x={pos.x - 12}
                              y={pos.y - 12}
                              fill="#fff"
                              fontSize="10"
                              fontWeight="800"
                              style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
                            >
                              {st.name}
                            </text>
                          </g>
                        );
                      })}

                      {/* Animated Moving Train Marker */}
                      {trainPos.x !== 0 && (
                        <g>
                          {/* Pulse wave ring */}
                          <circle
                            cx={trainPos.x}
                            cy={trainPos.y}
                            r="15"
                            fill="rgba(59, 130, 246, 0.2)"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            className="ping-ring"
                            style={{
                              animation: "pulse-marker 1.5s ease-out infinite"
                            }}
                          />
                          <circle
                            cx={trainPos.x}
                            cy={trainPos.y}
                            r="9"
                            fill="#ef4444"
                            stroke="#fff"
                            strokeWidth="2"
                            boxShadow="0 4px 10px rgba(0,0,0,0.5)"
                          />
                        </g>
                      )}
                    </>
                  )}
                </svg>
              </div>

              {/* SVG Animations Style Inject */}
              <style>{`
                @keyframes dash {
                  to { stroke-dashoffset: -1000; }
                }
                @keyframes pulse-marker {
                  0% { transform: scale(0.9); opacity: 1; }
                  100% { transform: scale(1.4); opacity: 0; }
                }
                .ping-ring {
                  transform-origin: center;
                }
              `}</style>

              {/* Map Footer Help */}
              <div style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem", background: "rgba(15,23,42,0.8)", padding: "0.3rem 0.6rem", borderRadius: "6px", border: "1px solid #1e293b" }}>
                <span style={{ fontSize: "0.68rem", color: "#64748b" }}>💡 Pinch/Use scrollwheel to Zoom. Click & Drag to Move map.</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Journey Tracking & Station List Panel */}
          <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {selectedTrain ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Simulation Control Card */}
                <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "1.25rem", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1e293b" }}>{selectedTrain.train_name}</h3>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>Train Number: {selectedTrain.train_number}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedTrain(null);
                        setSelectedStartStation("");
                        resetSimulation();
                      }}
                      style={{ border: "none", background: "none", color: "#ef4444", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      Clear Train
                    </button>
                  </div>

                  {/* Wrong Train Guard Select */}
                  <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.3rem" }}>Select Your Boarding Station:</label>
                    <select
                      value={selectedStartStation}
                      onChange={(e) => setSelectedStartStation(e.target.value)}
                      style={{ width: "100%", padding: "0.4rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#fff" }}
                    >
                      <option value="">-- Choose Boarding Point --</option>
                      {stations.map(s => (
                        <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Wrong Train Alert Banner */}
                  {isWrongTrain && (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "#fef2f2", border: "1px solid #fee2e2", padding: "0.75rem", borderRadius: "0.75rem", color: "#dc2626", marginBottom: "1rem", animation: "pulse 2s infinite" }}>
                      <AlertTriangle size={24} style={{ flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: "0.8rem", display: "block" }}>WRONG TRAIN DETECTED</strong>
                        <span style={{ fontSize: "0.72rem" }}>This train does not go to your boarded station ({selectedStartStation})!</span>
                      </div>
                    </div>
                  )}

                  {/* Simulation Controls */}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {isSimulating ? (
                      <button 
                        onClick={stopSimulation}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyCenter: "center", gap: "0.4rem", padding: "0.6rem", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem" }}
                      >
                        <Pause size={14} style={{ margin: "auto 0" }} /> Pause
                      </button>
                    ) : (
                      <button 
                        onClick={startSimulation}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyCenter: "center", gap: "0.4rem", padding: "0.6rem", background: "#22c55e", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem" }}
                      >
                        <Play size={14} style={{ margin: "auto 0" }} /> Track Live
                      </button>
                    )}
                    <button 
                      onClick={resetSimulation}
                      style={{ padding: "0.6rem", background: "#cbd5e1", color: "#475569", border: "none", borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center" }}
                      title="Reset Tracker"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>

                  {/* Simulation Progress Input Range */}
                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ display: "flex", justifyBetween: "space-between", fontSize: "0.7rem", color: "#64748b", marginBottom: "0.25rem" }}>
                      <span>Manual Progress Simulator:</span>
                      <span style={{ marginLeft: "auto", fontWeight: 700 }}>{progress}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => {
                        stopSimulation();
                        setProgress(parseInt(e.target.value));
                      }}
                      style={{ width: "100%", cursor: "pointer" }}
                    />
                  </div>
                </div>

                {/* Chalo-Style Journey tracking sheet */}
                <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "1.25rem", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  
                  {/* Progress Header */}
                  <div style={{ borderBottom: "1px solid #f1f5f9", pb: "1rem", mb: "1rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Journey Progress</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", margin: "0.25rem 0 0.5rem" }}>
                      <span style={{ fontSize: "2rem", fontWeight: 900, color: "#1e293b", lineHeight: 1 }}>{progress}%</span>
                      <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 700 }}>completed</span>
                    </div>

                    <div style={{ width: "100%", background: "#f1f5f9", borderRadius: "999px", height: "8px", overflow: "hidden", marginBottom: "1rem" }}>
                      <div style={{ width: `${progress}%`, background: "#3b82f6", height: "100%", borderRadius: "999px", transition: "width 0.3s ease-out" }} />
                    </div>
                  </div>

                  {/* Live Tracking Information Sheet */}
                  {currentStop && nextStop ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "#f8fafc", padding: "1rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700 }}>CURRENT STATION</span>
                          <strong style={{ fontSize: "0.95rem", display: "block", color: "#0f172a" }}>{currentStop.name} ({currentStop.code})</strong>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700 }}>NEXT STATION</span>
                          <strong style={{ fontSize: "0.95rem", display: "block", color: "#0f172a" }}>{nextStop.name} ({nextStop.code})</strong>
                        </div>
                      </div>

                      <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "0.75rem", display: "flex", justifyBetween: "space-between" }}>
                        <div>
                          <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700 }}>STATIONS REMAINING</span>
                          <strong style={{ fontSize: "1rem", display: "block", color: "#0f172a" }}>{remainingStopsCount}</strong>
                        </div>
                        <div style={{ textAlign: "right", marginLeft: "auto" }}>
                          <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700 }}>ESTIMATED ARRIVAL</span>
                          <strong style={{ fontSize: "1.1rem", display: "block", color: "#ea580c" }}>~{etaMinutes} mins</strong>
                        </div>
                      </div>
                      
                      {/* Bilingual voice updates button */}
                      <button
                        onClick={triggerVoiceUpdate}
                        style={{ display: "flex", alignItems: "center", justifyCenter: "center", gap: "0.5rem", padding: "0.5rem", background: "#eff6ff", border: "1px solid #dbeafe", color: "#1d4ed8", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}
                      >
                        <Volume2 size={16} /> Speak Journey Update (Bilingual)
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "1.5rem", color: "#64748b", background: "#f8fafc", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
                      🎉 Journey Completed! You have reached your final destination.
                    </div>
                  )}

                  {/* Vertical Station List Checklist */}
                  <div style={{ display: "flex", flexDirection: "column", position: "relative", paddingLeft: "1.5rem" }}>
                    <div style={{ position: "absolute", left: "4px", top: "8px", bottom: "8px", width: "3px", background: "#cbd5e1" }} />
                    
                    {activeStops.map((stop, index) => {
                      const st = stations.find(s => s.code === stop.station_code);
                      if (!st) return null;
                      
                      // Calculate if stop is passed
                      const segmentCount = activeStops.length - 1;
                      const segmentProgressVal = 100 / segmentCount;
                      const stopProgressPos = index * segmentProgressVal;
                      const isPassed = progress > stopProgressPos;
                      const isCurrent = progress === stopProgressPos || 
                        (progress > (index - 1) * segmentProgressVal && progress < index * segmentProgressVal);
                      
                      return (
                        <div key={stop.station_code} style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", position: "relative" }}>
                          {/* Dot indicator over line */}
                          <div 
                            style={{ 
                              position: "absolute", 
                              left: "-26px", 
                              top: "4px", 
                              width: "12px", 
                              height: "12px", 
                              borderRadius: "50%", 
                              background: isPassed ? "#22c55e" : isCurrent ? "#3b82f6" : "#cbd5e1",
                              border: `2px solid ${isPassed ? "#dcfce7" : isCurrent ? "#dbeafe" : "#fff"}`,
                              zIndex: 1
                            }} 
                          />

                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <strong style={{ fontSize: "0.85rem", color: isPassed ? "#22c55e" : "#0f172a" }}>{st.name}</strong>
                              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>{stop.station_code}</span>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.7rem", color: "#64748b", marginTop: "0.15rem" }}>
                              <span>Platform: {stop.platform || "1"}</span>
                              <span>·</span>
                              <span>Distance: {stop.distance_km} km</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* SOS and Alert Shortcut buttons */}
                  <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "1.25rem", display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                    <button
                      onClick={() => alert("🚨 SOS Alert sent to RPF and your emergency family contacts.")}
                      style={{ flex: 1, padding: "0.6rem", background: "#fef2f2", border: "1px solid #fee2e2", color: "#ef4444", borderRadius: "0.5rem", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", justifyCenter: "center", gap: "0.3rem" }}
                    >
                      <ShieldAlert size={14} style={{ margin: "auto 0" }} /> Emergency SOS
                    </button>
                    <button
                      onClick={() => navigate("/station-alert")}
                      style={{ flex: 1, padding: "0.6rem", background: "#f0fdf4", border: "1px solid #dcfce7", color: "#15803d", borderRadius: "0.5rem", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", justifyCenter: "center", gap: "0.3rem" }}
                    >
                      <MapPin size={14} style={{ margin: "auto 0" }} /> Destination Alarm
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              <div style={{ background: "#fff", padding: "2rem 1.5rem", borderRadius: "1.25rem", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", textAlign: "center" }}>
                <Navigation size={36} className="text-[#3b82f6] animate-bounce" style={{ margin: "0 auto 1rem" }} />
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#1e293b", fontWeight: 700 }}>Select a Route to Begin Tracking</h3>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>Choose from the available routes or search for a specific train to load the live India railway map overlay and station checklist.</p>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
