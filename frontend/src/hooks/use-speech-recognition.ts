"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface SpeechState {
  isListening: boolean
  interimTranscript: string
  finalTranscript: string
  error: string | null
}

type BrowserSpeechRecognition = typeof window.SpeechRecognition

const getSpeechRecognitionCtor = (): BrowserSpeechRecognition | null => {
  if (typeof window === "undefined") {
    return null
  }

  return (
    window.SpeechRecognition ||
    (window as Window & typeof globalThis).webkitSpeechRecognition ||
    null
  )
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [state, setState] = useState<SpeechState>({
    isListening: false,
    interimTranscript: "",
    finalTranscript: "",
    error: null,
  })

  useEffect(() => {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor()
    if (!SpeechRecognitionCtor) {
      return
    }

    setIsSupported(true)

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = "pl-PL"
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setState({
        isListening: true,
        error: null,
        interimTranscript: "",
        finalTranscript: "",
      })
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = ""
      let finalText = ""

      for (const result of event.results) {
        const transcript = result[0]?.transcript ?? ""
        if (result.isFinal) {
          finalText += transcript
        } else {
          interimText += transcript
        }
      }

      setState((prev) => ({
        ...prev,
        interimTranscript: interimText.trim(),
        finalTranscript: finalText.trim(),
      }))
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setState((prev) => ({
        ...prev,
        isListening: false,
        error: event.error || "unknown",
      }))
    }

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }))
    }

    recognitionRef.current = recognition

    return () => {
      recognitionRef.current?.stop()
      recognitionRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    try {
      recognitionRef.current?.start()
    } catch {
      setState((prev) => ({
        ...prev,
        isListening: false,
        error: "start-failed",
      }))
    }
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      interimTranscript: "",
      finalTranscript: "",
      error: null,
    }))
  }, [])

  return {
    ...state,
    isSupported,
    start,
    stop,
    reset,
  }
}
