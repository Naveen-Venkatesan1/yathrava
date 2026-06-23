// src/components/RouteCard.jsx
import React, { useState } from "react";

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    overflow: "hidden",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
    border: "1px solid #e2e8f0",
  },
  cardHover: {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 32px rgba(2,132,199,0.15)",
  },
  header: {
    background: "linear-gradient(135deg, #003366 0%, #0284c7 100%)",
    padding: "16px 20px",
    color: "#fff",
  },
  trainNumber: {
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    opacity: 0.8,
    textTransform: "uppercase",
  },
  trainName: {
    fontSize: "1.1rem",
    fontWeight: 700,
    marginTop: "2px",
  },
  badge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "20px",
    padding: "2px 10px",
    fontSize: "0.7rem",
    fontWeight: 600,
    marginTop: "6px",
  },
  body: {
    padding: "16px 20px",
  },
  routeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  station: {
    flex: 1,
    minWidth: 0,
  },
  stationLabel: {
    fontSize: "0.65rem",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  stationName: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#0f172a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  stationCode: {
    fontSize: "0.7rem",
    color: "#94a3b8",
  },
  arrow: {
    flexShrink: 0,
    color: "#0284c7",
    fontSize: "1.2rem",
  },
  metaRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "0.78rem",
    color: "#475569",
  },
  metaIcon: { fontSize: "0.85rem" },
  expandBtn: {
    width: "100%",
    background: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    fontSize: "0.78rem",
    color: "#0284c7",
    fontWeight: 600,
    transition: "background 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
  },
  // Timeline
  timelineWrapper: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #f1f5f9",
  },
  timelineTitle: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "12px",
  },
  stationRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "0",
  },
  dotColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "16px",
    flexShrink: 0,
  },
  dot: (isFirst, isLast) => ({
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: isFirst ? "#003366" : isLast ? "#ef4444" : "#0284c7",
    border: "2px solid #fff",
    boxShadow: "0 0 0 2px " + (isFirst ? "#003366" : isLast ? "#ef4444" : "#0284c7"),
    flexShrink: 0,
    zIndex: 1,
  }),
  line: {
    width: "2px",
    flex: 1,
    background: "linear-gradient(#0284c7, #bae6fd)",
    minHeight: "20px",
  },
  stationInfo: {
    paddingBottom: "16px",
    flex: 1,
  },
  stnName: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#0f172a",
  },
  stnTimes: {
    fontSize: "0.7rem",
    color: "#64748b",
    marginTop: "2px",
  },
  stnCode: {
    fontSize: "0.65rem",
    color: "#94a3b8",
  },
};

export default function RouteCard({ route }) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const {
    trainNumber,
    trainName,
    trainType,
    sourceStation,
    sourceCode,
    destinationStation,
    destinationCode,
    distance,
    duration,
    daysOfRun,
    stations = [],
  } = route;

  const cardStyle = hovered
    ? { ...styles.card, ...styles.cardHover }
    : styles.card;

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.trainNumber}>#{trainNumber}</div>
        <div style={styles.trainName}>{trainName}</div>
        {trainType && <span style={styles.badge}>{trainType}</span>}
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Route row */}
        <div style={styles.routeRow}>
          <div style={styles.station}>
            <div style={styles.stationLabel}>From</div>
            <div style={styles.stationName}>{sourceStation}</div>
            {sourceCode && <div style={styles.stationCode}>{sourceCode}</div>}
          </div>
          <div style={styles.arrow}>→</div>
          <div style={{ ...styles.station, textAlign: "right" }}>
            <div style={styles.stationLabel}>To</div>
            <div style={styles.stationName}>{destinationStation}</div>
            {destinationCode && (
              <div style={styles.stationCode}>{destinationCode}</div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div style={styles.metaRow}>
          {distance && (
            <span style={styles.metaItem}>
              <span style={styles.metaIcon}>📏</span> {distance} km
            </span>
          )}
          {duration && (
            <span style={styles.metaItem}>
              <span style={styles.metaIcon}>⏱</span> {duration}
            </span>
          )}
          {daysOfRun && (
            <span style={styles.metaItem}>
              <span style={styles.metaIcon}>📅</span> {daysOfRun}
            </span>
          )}
          {stations.length > 0 && (
            <span style={styles.metaItem}>
              <span style={styles.metaIcon}>🚉</span> {stations.length} stops
            </span>
          )}
        </div>

        {/* Expand button */}
        {stations.length > 0 && (
          <button
            style={styles.expandBtn}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? "▲ Hide Stations" : "▼ Show All Stations"}
          </button>
        )}

        {/* Station Timeline */}
        {expanded && stations.length > 0 && (
          <div style={styles.timelineWrapper}>
            <div style={styles.timelineTitle}>Station Timeline</div>
            {stations.map((stn, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === stations.length - 1;
              return (
                <div key={`${stn.code}-${idx}`} style={styles.stationRow}>
                  <div style={styles.dotColumn}>
                    <div style={styles.dot(isFirst, isLast)} />
                    {!isLast && <div style={styles.line} />}
                  </div>
                  <div style={styles.stationInfo}>
                    <div style={styles.stnName}>{stn.name}</div>
                    {stn.code && (
                      <div style={styles.stnCode}>{stn.code}</div>
                    )}
                    <div style={styles.stnTimes}>
                      {isFirst
                        ? `Dep: ${stn.departure || "—"}`
                        : isLast
                        ? `Arr: ${stn.arrival || "—"}`
                        : `Arr: ${stn.arrival || "—"}  |  Dep: ${stn.departure || "—"}`}
                      {stn.halt > 0 && ` (${stn.halt} min halt)`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
