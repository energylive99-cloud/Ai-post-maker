
import { useState, useRef, useCallback, useEffect } from 'react';

// Polyfill for browsers that use webkitSpeechRecognition
const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

interface UseTranscriptionProps {
  onTranscript: (transcript: string) => void;
}

export const useTranscription = ({ onTranscript }: UseTranscriptionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API is not supported in this browser.');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      const fullTranscript = transcript + finalTranscript + interimTranscript;
      onTranscript(fullTranscript); // Update parent state live
    };

    recognition.onend = () => {
      if (isListening) {
        // Restart recognition if it stops unexpectedly while still in listening mode
        recognition.start();
      }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onTranscript, isListening, transcript]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript(''); // Reset transcript on new start
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
};
