export function speakGuidance(message, lang) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech Synthesis not supported in this browser');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = lang; // e.g., 'ta', 'en', 'hi'
  // Choose a voice matching the language if available
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith(lang));
  if (voice) {
    utterance.voice = voice;
  }
  window.speechSynthesis.speak(utterance);
}
