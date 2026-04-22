import { useState, useCallback, useEffect } from 'react';

/**
 * useVoice Hook - Monster Quality Voice Interface
 * Provides Speech-to-Text and Text-to-Speech capabilities.
 */
export const useVoice = (persona: 'emma' | 'carol' | 'jarvis' = 'jarvis') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Voice configurations
  const voiceConfigs = {
    emma: { lang: 'pt-BR', pitch: 1.2, rate: 1.1, volume: 1 }, // 16yo girl
    carol: { lang: 'pt-BR', pitch: 0.9, rate: 0.9, volume: 1 }, // 40yo woman
    jarvis: { lang: 'pt-BR', pitch: 0.8, rate: 1, volume: 1 },  // Digital assistant
  };

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const config = voiceConfigs[persona];

    utterance.lang = config.lang;
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    utterance.volume = config.volume;

    // Try to find a better voice if available
    const voices = window.speechSynthesis.getVoices();
    if (persona === 'emma') {
      const girlVoice = voices.find(v => v.lang.includes('pt-BR') && (v.name.includes('Luciana') || v.name.includes('Google')));
      if (girlVoice) utterance.voice = girlVoice;
    } else if (persona === 'carol') {
      const womanVoice = voices.find(v => v.lang.includes('pt-BR') && v.name.includes('Heloisa'));
      if (womanVoice) utterance.voice = womanVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [persona]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
    };

    recognition.start();
  }, []);

  return { isListening, transcript, startListening, speak, setTranscript };
};
