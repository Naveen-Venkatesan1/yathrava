import { useEffect, useState } from 'react';
import i18n from '../i18n';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Supported language codes and display names
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
];

export default function LanguageSelector() {
  const { user } = useAuth();
  const [current, setCurrent] = useState(i18n.language || 'en');

  // Load persisted language from Firestore on mount (if logged in)
  useEffect(() => {
    async function loadUserLanguage() {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().language) {
            const savedLang = userSnap.data().language;
            setCurrent(savedLang);
            i18n.changeLanguage(savedLang);
          }
        } catch (error) {
          console.error('Error loading language from Firestore:', error);
        }
      }
    }
    loadUserLanguage();
  }, [user]);

  const handleChange = async (e) => {
    const newLang = e.target.value;
    setCurrent(newLang);
    i18n.changeLanguage(newLang);

    // Save to Firestore if user is logged in
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { language: newLang });
      } catch (error) {
        console.error('Error saving language to Firestore:', error);
      }
    }
  };

  return (
    <select
      value={current}
      onChange={handleChange}
      style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        border: '1px solid #ccc',
        cursor: 'pointer',
      }}
      aria-label="Language selector"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
