// src/pages/Routes.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import RouteCard from "../components/RouteCard";
import { generateSampleRoutes } from "../utils/sampleData";

export default function Routes() {
  const [routes, setRoutes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState({ number: "", name: "", sourceDest: "" });

  // Load data – from Firestore first, fallback to generated sample data
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const querySnap = await getDocs(collection(db, "routes"));
        const data = querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (data.length === 0) {
          // No data in Firestore – generate local sample data
          const sample = generateSampleRoutes(100);
          setRoutes(sample);
          setFiltered(sample);
        } else {
          setRoutes(data);
          setFiltered(data);
        }
      } catch (e) {
        console.warn("Firestore unavailable, using sample data:", e.message);
        // Graceful degradation – show generated sample data, no error banner
        const sample = generateSampleRoutes(100);
        setRoutes(sample);
        setFiltered(sample);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  // Search handling
  useEffect(() => {
    const { number, name, sourceDest } = search;
    const loweredNumber = number.toLowerCase();
    const loweredName = name.toLowerCase();
    const loweredSourceDest = sourceDest.toLowerCase();
    const filteredList = routes.filter((r) => {
      const matchesNumber = loweredNumber && r.trainNumber?.toString().includes(loweredNumber);
      const matchesName = loweredName && r.trainName?.toLowerCase().includes(loweredName);
      const matchesSourceDest =
        loweredSourceDest &&
        (r.sourceStation?.toLowerCase().includes(loweredSourceDest) ||
          r.destinationStation?.toLowerCase().includes(loweredSourceDest));
      // If any field is filled, return true when it matches; otherwise show all
      if (loweredNumber || loweredName || loweredSourceDest) {
        return matchesNumber || matchesName || matchesSourceDest;
      }
      return true;
    });
    setFiltered(filteredList);
  }, [search, routes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearch((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-medium text-gray-700">Loading routes…</div>
      </div>
    );
  }

  // error state kept for future use but sample data is always shown as fallback
  // if (error) { ... }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Train Routes</h1>
      {/* Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          name="number"
          placeholder="Search by Train Number"
          value={search.number}
          onChange={handleChange}
          className="p-2 border rounded shadow-sm focus:outline-none"
        />
        <input
          type="text"
          name="name"
          placeholder="Search by Train Name"
          value={search.name}
          onChange={handleChange}
          className="p-2 border rounded shadow-sm focus:outline-none"
        />
        <input
          type="text"
          name="sourceDest"
          placeholder="Search by Source / Destination"
          value={search.sourceDest}
          onChange={handleChange}
          className="p-2 border rounded shadow-sm focus:outline-none"
        />
      </div>
      {/* Route List */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-600">No routes match your criteria.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      )}
    </div>
  );
}
