import { useState } from 'react';
import { Search, MapPin, Clock, Users, Map } from 'lucide-react';
import TicketResult from '../components/TicketResult';

export default function SmartTicket() {
  const [pnr, setPnr] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (pnr.length !== 10) {
      setError('PNR must be 10 digits');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Phase 1: Mock fetch from backend
      // Using an arbitrary valid token structure, since we haven't implemented full auth context yet
      // For testing, we might need to bypass token or just use the backend response. Let's assume backend accepts it or we mock here.
      // Actually, since auth is required on backend, let's just simulate the backend response right here if not logged in, 
      // but let's try calling it first (assuming user is logged in later).
      // For now, let's mock it purely in UI for demonstration of the feature.
      
      setTimeout(() => {
        setTicket({
          pnr: pnr,
          train_number: "12621",
          train_name: "TAMIL NADU EXP",
          boarding_station: "MAS (Chennai Central)",
          destination_station: "NDLS (New Delhi)",
          date_of_journey: "2026-06-18",
          passengers: [
            {"name": "Passenger 1", "age": 45, "status": "CNF", "coach": "B4", "seat": "32", "berth": "SU"}
          ],
          chart_status: "Prepared"
        });
        setLoading(false);
      }, 1000);

    } catch {
      setError('Failed to fetch ticket. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Smart Ticket Assistant</h1>
        <p className="text-gray-500 mb-8">Enter your 10-digit PNR number to get live AI guidance for your journey.</p>
        
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Enter 10-digit PNR Number" 
              value={pnr}
              onChange={(e) => setPnr(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-lg font-medium"
              style={{ '--tw-ring-color': '#0ea5e9' }}
              maxLength={10}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            style={{ background: '#0284c7', color: '#fff', padding: '1rem 2rem', borderRadius: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}
          >
            {loading ? 'Searching...' : 'Find Ticket'}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
      </div>

      {ticket && (
        <>
          <TicketResult data={{
            coach: ticket.passengers[0]?.coach ?? 'N/A',
            platform: ticket.platform,
            direction: ticket.direction,
            distance: ticket.distance
          }} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{ticket.train_name}</h2>
                    <p style={{ color: '#0284c7', fontWeight: 600 }}>Train No: {ticket.train_number}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                    Chart {ticket.chart_status}
                  </span>
                </div>
                
                <div className="flex items-center gap-8 py-6 border-y border-gray-100 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Boarding</p>
                    <p className="font-bold text-gray-900">{ticket.boarding_station}</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-full h-px bg-gray-300 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Destination</p>
                    <p className="font-bold text-gray-900">{ticket.destination_station}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" /> Passenger Details
                  </h3>
                  <div className="space-y-3">
                    {ticket.passengers.map((p, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-4 flex justify-between items-center border border-gray-100">
                        <div>
                          <p className="font-bold text-gray-900">{p.name}</p>
                          <p className="text-sm text-gray-500">Age: {p.age}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-2 mb-1">
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.85rem', fontWeight: 700 }}>{p.coach}</span>
                            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-sm font-bold">{p.seat} {p.berth}</span>
                          </div>
                          <p className="text-sm font-bold text-green-600">{p.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-md text-white">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> Coach Position
                </h3>
                <p className="text-indigo-100 text-sm mb-4">Your coach is likely located near the middle of the train. Platform 4.</p>
                <button className="w-full bg-white text-indigo-600 font-bold py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                  View Platform Map
                </button>
              </div>

              <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                  <Map className="w-5 h-5 text-orange-500" /> Destination Alarm
                </h3>
                <p className="text-orange-600 text-sm mb-4">Set an alarm to wake you up 15 mins before {ticket.destination_station}.</p>
                <button className="w-full bg-orange-500 text-white font-bold py-2 rounded-lg hover:bg-orange-600 transition-colors">
                  Enable Alarm
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
