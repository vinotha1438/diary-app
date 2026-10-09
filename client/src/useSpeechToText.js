import { useCallback, useEffect, useRef, useState } from "react";

// Chrome / Edge / Android Chrome have this built in (Firefox does not)
const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const ERROR_TEXT = {
  "not-allowed": "Microphone is blocked. Allow it from the address bar and try again.",
  "service-not-allowed": "Microphone is blocked. Allow it from the address bar and try again.",
  "no-speech": "I didn't hear anything. Tap Speak and try again.",
  "audio-capture": "No microphone found.",
  network: "Voice typing needs an internet connection.",
  "language-not-supported": "This language is not supported on your browser.",
};

// onFinal(text) is called every time a sentence is finished.
// `interim` is the sentence that is still being spoken (for the live preview).
export default function useSpeechToText({ onFinal }) {
  const recRef = useRef(null);
  const onFinalRef = useRef(onFinal);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const start = useCallback((lang) => {
    if (!SpeechRecognition || recRef.current) return;

    const rec = new SpeechRecognition();
    rec.lang = lang; // "ta-IN" = Tamil, "en-IN" = English (India)
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => {
      setListening(true);
      setError("");
    };
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) onFinalRef.current?.(result[0].transcript);
        else live += result[0].transcript;
      }
      setInterim(live);
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      setError(ERROR_TEXT[e.error] || "Voice typing stopped. Please try again.");
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
      setInterim("");
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      recRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  // stop the mic if the page is closed
  useEffect(() => () => recRef.current?.abort(), []);

  return {
    supported: Boolean(SpeechRecognition),
    listening,
    interim,
    error,
    start,
    stop,
  };
}