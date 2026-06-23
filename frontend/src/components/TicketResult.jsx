import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { speakGuidance } from '../utils/voiceGuidance';
import '../index.css';

export default function TicketResult({ data }) {
  const [langIndex, setLangIndex] = useState(0);
  const languages = [
    { code: 'ta', label: 'Tamil' },
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
  ];

  const currentLang = languages[langIndex];

  const handlePlay = () => {
    const { coach, platform, direction, distance } = data;
    const message = `Coach ${coach} is at platform ${platform}. Board from the ${direction} side. Distance to coach is ${distance} meters.`;
    speakGuidance(message, currentLang.code);
    setLangIndex((langIndex + 1) % languages.length);
  };

  return (
    <div className="ticket-result max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100 animate-fade-in">
      <div className="flex flex-col items-center space-y-4">
        {/* Green tick animation */}
        <CheckCircle className="w-16 h-16 text-green-500 animate-bounce-tick" />
        <h2 className="text-2xl font-bold text-gray-900">Safe to Board</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm text-gray-700 w-full">
          <dt className="font-medium">Coach</dt><dd>{data.coach}</dd>
          <dt className="font-medium">Platform</dt><dd>{data.platform}</dd>
          <dt className="font-medium">Direction</dt><dd>{data.direction}</dd>
          <dt className="font-medium">Distance (m)</dt><dd>{data.distance}</dd>
        </dl>
        <button
          onClick={handlePlay}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Play Voice Guidance ({currentLang.label})
        </button>
      </div>
    </div>
  );
}
