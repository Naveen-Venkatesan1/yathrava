// src/App.jsx (updated)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import Navigation from './components/Navigation';
import BottomNav from './components/BottomNav'; // new import
import VoiceAssistant from './components/VoiceAssistant';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import SmartTicket from './pages/SmartTicket';
import Scanner from './pages/Scanner';
import StationAlert from './pages/StationAlert';
import TrainRoutesPage from './pages/Routes';
import ProfilePage from './pages/Profile';
import FamilyLocator from './pages/FamilyLocator';
import EmergencyContacts from './pages/EmergencyContacts';
import { SafetyProvider } from './context/SafetyContext';
import SOSOverlay from './components/SOSOverlay';

function App() {
  return (
    <AuthProvider>
      <SafetyProvider>
        <AlertProvider>
          <Router>
            <SOSOverlay />
            <Navigation />
            <main className="pb-[60px]">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/smart-ticket" element={<div className="max-w-[80rem] mx-auto w-full p-4 md:px-6 md:py-8"><SmartTicket /></div>} />
              <Route path="/scanner" element={<div className="max-w-[80rem] mx-auto w-full p-4 md:px-6 md:py-8"><Scanner /></div>} />
              <Route path="/station-alert" element={<div className="max-w-[80rem] mx-auto w-full p-4 md:px-6 md:py-8"><StationAlert /></div>} />
              <Route path="/routes" element={<TrainRoutesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/family-locator" element={<div className="max-w-[80rem] mx-auto w-full p-4 md:px-6 md:py-8"><FamilyLocator /></div>} />
              <Route path="/emergency-contacts" element={<div className="max-w-[80rem] mx-auto w-full p-4 md:px-6 md:py-8"><EmergencyContacts /></div>} />
            </Routes>
          </main>
          <VoiceAssistant />
          <BottomNav />
        </Router>
      </AlertProvider>
      </SafetyProvider>
    </AuthProvider>
  );
}

export default App;
