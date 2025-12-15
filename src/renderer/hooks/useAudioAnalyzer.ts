import { useEffect, useRef } from 'react'

export function useAudioAnalyzer(isActive: boolean = true) {
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        if (!isActive) return

        const initAudio = async () => {
            try {
                // Request sources ID from Main Process
                const sources = await window.ipcRenderer.getDesktopSources()
                const sourceId = sources[0]?.id // Usually the first screen is the main display

                if (!sourceId) {
                    console.warn("No desktop source found");
                    return;
                }

                // Capture system audio (desktop loopback)
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: sourceId // Capture audio from this screen
                        }
                    } as any, // Cast to any because TS DOM types don't include Electron specifics
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: sourceId
                        }
                    } as any
                })

                // We only need the audio track
                const audioStream = new MediaStream([stream.getAudioTracks()[0]])

                // Init Audio Context
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext
                audioContextRef.current = new AudioContext()

                // Init Analyser
                analyserRef.current = audioContextRef.current.createAnalyser()
                analyserRef.current.fftSize = 2048 // Resolution
                analyserRef.current.smoothingTimeConstant = 0.8 // Smoother animation

                // Connect Source
                sourceRef.current = audioContextRef.current.createMediaStreamSource(audioStream)
                sourceRef.current.connect(analyserRef.current)

            } catch (err) {
                console.error("Failed to initialize system audio analyzer:", err)
            }
        }

        initAudio()

        return () => {
            // Cleanup
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }
            if (sourceRef.current) {
                sourceRef.current.mediaStream.getTracks().forEach(track => track.stop())
            }
        }
    }, [isActive])

    const getFrequencyData = (dataArray: Uint8Array) => {
        if (analyserRef.current) {
            // Cast to any to bypass strict ArrayBuffer vs SharedArrayBuffer check if needed, 
            // but standard Uint8Array usually works. The error suggests mismatch.
            // Simple fix: accept the array as is.
            analyserRef.current.getByteFrequencyData(dataArray as any)
        }
    }

    return { getFrequencyData }
}
