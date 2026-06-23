import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserQRCodeReader } from "@zxing/browser";
import {
  ArrowLeft,
  Flashlight,
  FlashlightOff,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function Scanner() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [scanActive, setScanActive] = useState(true);

  useEffect(() => {
    let currentTrack = null;
    let isMounted = true;
    let controls = null;

    async function initCamera() {
      try {
        const codeReader = new BrowserQRCodeReader();
        codeReaderRef.current = codeReader;

        const videoElem = videoRef.current;
        if (!videoElem) throw new Error("Video element not found");

        const devices = await BrowserQRCodeReader.listVideoInputDevices();
        if (!devices || devices.length === 0) {
          throw new Error("No camera found on this device.");
        }

        const constraints = {
          video: { facingMode: "environment" }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        videoElem.srcObject = stream;
        videoElem.setAttribute("playsinline", true);
        await videoElem.play();

        currentTrack = stream.getVideoTracks()[0];
        
        const capabilities = currentTrack.getCapabilities ? currentTrack.getCapabilities() : {};
        if (capabilities.torch) {
          setTorchSupported(true);
        }

        setLoading(false);

        codeReader.decodeFromVideoDevice(
          undefined,
          videoElem,
          (res, err) => {
            if (res && isMounted && scanActive) {
              handleSuccess(res.getText());
            }
          }
        ).then(c => {
           controls = c;
        }).catch(err => {
           console.error("Scanning error:", err);
        });

      } catch (err) {
        console.error("Camera init error:", err);
        if (isMounted) {
          setError(err.message || "Camera permission denied or unavailable.");
          setLoading(false);
        }
      }
    }

    if (scanActive) {
      initCamera();
    }

    return () => {
      isMounted = false;
      if (controls) controls.stop();
      if (currentTrack) currentTrack.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanActive]);

  const handleSuccess = (decodedText) => {
    setResult(decodedText);
    setScanActive(false);
    playBeep();
    if ("vibrate" in navigator) {
      navigator.vibrate([200]);
    }
  };

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("AudioContext not supported");
    }
  };

  const toggleTorch = async () => {
    if (!torchSupported || !videoRef.current?.srcObject) return;
    try {
      const track = videoRef.current.srcObject.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.warn("Failed to toggle flashlight:", err);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError("");
    setLoading(true);
    setScanActive(true);
  };

  return (
    <div style={styles.container}>
      {/* Live Camera View */}
      <video ref={videoRef} style={styles.video} muted playsInline />

      {/* Top Navigation */}
      <div style={styles.topBar}>
        <button onClick={() => navigate(-1)} style={styles.iconButton}>
          <ArrowLeft size={24} color="#fff" />
        </button>
        <span style={styles.title}>Scan Ticket</span>
        <div style={{ width: 40 }} />
      </div>

      {/* States Overlays */}
      {loading && (
        <div style={styles.overlayCenter}>
          <div style={styles.spinner} />
          <p style={styles.overlayText}>Initializing camera...</p>
        </div>
      )}

      {error && (
        <div style={{ ...styles.overlayCenter, background: "#000" }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <p style={styles.errorText}>{error}</p>
          <button onClick={resetScanner} style={styles.primaryButton}>Retry Camera</button>
        </div>
      )}

      {/* GPay Style Scanner Interface */}
      {!loading && !error && (
        <div style={styles.scannerOverlay}>
          {/* Top dark region */}
          <div style={styles.darkRegion} />
          
          {/* Middle region with transparent square */}
          <div style={styles.middleRow}>
            <div style={styles.darkRegion} />
            
            {/* The Scanning Square */}
            <div style={styles.targetBox}>
              <div style={{ ...styles.corner, ...styles.topLeft }} />
              <div style={{ ...styles.corner, ...styles.topRight }} />
              <div style={{ ...styles.corner, ...styles.bottomLeft }} />
              <div style={{ ...styles.corner, ...styles.bottomRight }} />
              {scanActive && <div style={styles.laser} />}
            </div>
            
            <div style={styles.darkRegion} />
          </div>
          
          {/* Bottom dark region */}
          <div style={{ ...styles.darkRegion, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 32 }}>
            {scanActive && <p style={styles.instructionText}>Align QR code inside the frame to scan</p>}
          </div>
        </div>
      )}

      {/* Bottom Controls (Flashlight) */}
      {!loading && !error && scanActive && (
        <div style={styles.bottomBar}>
          {torchSupported && (
            <button onClick={toggleTorch} style={styles.torchButton}>
              {torchOn ? <FlashlightOff size={28} color="#fff" /> : <Flashlight size={28} color="#fff" />}
            </button>
          )}
        </div>
      )}

      {/* Success Bottom Sheet */}
      {result && (
        <div style={styles.bottomSheetWrapper}>
          <div style={styles.bottomSheet}>
            <div style={styles.bottomSheetIndicator} />
            <div style={styles.successIconWrapper}>
              <CheckCircle size={40} color="#10b981" />
            </div>
            <h2 style={styles.successTitle}>Ticket Scanned</h2>
            <div style={styles.resultContainer}>
              <p style={styles.resultText}>{result}</p>
            </div>
            <button onClick={resetScanner} style={styles.primaryButtonBlock}>Scan Another</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spinScanner { 
          to { transform: rotate(360deg); } 
        }
        @keyframes scanLaserAnim {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(240px); opacity: 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes glowFrame {
          0% { box-shadow: 0 0 5px rgba(59,130,246,0.2); }
          50% { box-shadow: 0 0 20px rgba(59,130,246,0.8); }
          100% { box-shadow: 0 0 5px rgba(59,130,246,0.2); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    width: "100vw", height: "100vh",
    backgroundColor: "#000",
    overflow: "hidden",
    fontFamily: "system-ui, -apple-system, sans-serif",
    zIndex: 99999,
  },
  video: {
    width: "100%", height: "100%",
    objectFit: "cover",
  },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    padding: "16px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)",
    zIndex: 20,
  },
  iconButton: {
    background: "rgba(255,255,255,0.2)",
    border: "none", borderRadius: "50%",
    width: 40, height: 40,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", backdropFilter: "blur(4px)",
  },
  title: {
    color: "#fff", fontSize: "1.2rem", fontWeight: "600",
  },
  overlayCenter: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.8)",
    zIndex: 30, padding: "24px", textAlign: "center",
  },
  spinner: {
    width: 48, height: 48,
    border: "4px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%",
    animation: "spinScanner 1s linear infinite", marginBottom: 16,
  },
  overlayText: { color: "#fff", fontSize: "1rem" },
  errorText: { color: "#f87171", fontSize: "1.1rem", marginBottom: 24 },
  primaryButton: {
    background: "#3b82f6", color: "#fff",
    border: "none", padding: "12px 24px", borderRadius: 8,
    fontSize: "1rem", fontWeight: "600", cursor: "pointer",
  },
  primaryButtonBlock: {
    background: "#3b82f6", color: "#fff",
    border: "none", padding: "16px", borderRadius: 12,
    fontSize: "1.1rem", fontWeight: "600", cursor: "pointer",
    width: "100%", marginTop: 16,
  },
  scannerOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    display: "flex", flexDirection: "column",
    zIndex: 10, pointerEvents: "none",
  },
  darkRegion: { flex: 1, background: "rgba(0,0,0,0.6)" },
  middleRow: { display: "flex", flexDirection: "row", height: 250 },
  targetBox: {
    position: "relative",
    width: 250, height: 250,
    background: "transparent",
    animation: "glowFrame 2s infinite alternate",
    borderRadius: 24,
  },
  corner: {
    position: "absolute", width: 40, height: 40,
    borderColor: "#3b82f6", borderStyle: "solid",
  },
  topLeft: { top: -2, left: -2, borderWidth: "4px 0 0 4px", borderTopLeftRadius: 24 },
  topRight: { top: -2, right: -2, borderWidth: "4px 4px 0 0", borderTopRightRadius: 24 },
  bottomLeft: { bottom: -2, left: -2, borderWidth: "0 0 4px 4px", borderBottomLeftRadius: 24 },
  bottomRight: { bottom: -2, right: -2, borderWidth: "0 4px 4px 0", borderBottomRightRadius: 24 },
  laser: {
    position: "absolute", top: 0, left: "5%",
    width: "90%", height: 2,
    background: "#3b82f6",
    boxShadow: "0 0 10px #3b82f6, 0 0 20px #3b82f6",
    animation: "scanLaserAnim 2s infinite linear",
    borderRadius: "50%",
  },
  instructionText: {
    color: "#fff", fontSize: "0.95rem", fontWeight: "500",
    background: "rgba(0,0,0,0.5)", padding: "8px 20px", borderRadius: 20,
    letterSpacing: "0.5px",
  },
  bottomBar: {
    position: "absolute", bottom: 40, left: 0, right: 0,
    display: "flex", justifyContent: "center", alignItems: "center",
    zIndex: 20,
  },
  torchButton: {
    background: "rgba(255,255,255,0.2)",
    border: "none", borderRadius: "50%",
    width: 64, height: 64,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", backdropFilter: "blur(4px)",
  },
  bottomSheetWrapper: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex", flexDirection: "column", justifyContent: "flex-end",
    zIndex: 40,
  },
  bottomSheet: {
    background: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: "24px",
    display: "flex", flexDirection: "column", alignItems: "center",
    animation: "slideUp 0.3s ease-out",
  },
  bottomSheetIndicator: {
    width: 40, height: 4,
    background: "#e5e7eb", borderRadius: 2,
    marginBottom: 20,
  },
  successIconWrapper: {
    width: 64, height: 64,
    background: "#d1fae5", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    color: "#111827", fontSize: "1.5rem", fontWeight: "700",
    margin: "0 0 16px 0",
  },
  resultContainer: {
    background: "#f3f4f6",
    borderRadius: 12, padding: "16px",
    width: "100%", marginBottom: 16,
  },
  resultText: {
    color: "#374151", fontSize: "1rem", fontFamily: "monospace",
    margin: 0, wordBreak: "break-all", textAlign: "center",
  }
};
