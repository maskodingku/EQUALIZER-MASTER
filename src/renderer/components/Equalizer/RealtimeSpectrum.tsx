import React, { useRef, useEffect } from 'react'
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer'
import { useAudioStore } from '../../store/audioStore'

export function RealtimeSpectrum() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { getFrequencyData } = useAudioAnalyzer(true)
    const bandCount = useAudioStore(state => state.bands.length) || 100

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Data array for frequency bin count (1024 for fft 2048)
        const bufferLength = 1024
        const dataArray = new Uint8Array(bufferLength)

        const draw = () => {
            requestAnimationFrame(draw)

            // Get current dimensions
            const width = canvas.width
            const height = canvas.height

            // Clear canvas
            ctx.clearRect(0, 0, width, height)

            // Get Real-time Data
            getFrequencyData(dataArray)

            // Downsample with CUSTOM MAPPING to match FrequencyBars
            const bars = bandCount
            const barWidth = (width / bars)

            // Audio Context Info (Assumed standard)
            const nyquist = 24000 // approx for 48k SR. 
            // Better: ctx.sampleRate / 2. But we don't have ctx here directly. 
            // dataArray length 1024 = 0 to Nyquist.
            const binSize = nyquist / bufferLength // ~23.4Hz

            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'

            for (let i = 0; i < bars; i++) {
                // 1. Determine Frequency Range for this Bar
                // From audioStore logic:
                // i < 60: 10Hz - 1000Hz. Range = 990Hz. Step = 990/60 = 16.5Hz
                // i >= 60: 1000Hz - 20000Hz. Range = 19000Hz. Step = 19000/40 = 475Hz

                let freq = 0;
                if (i < 60) {
                    freq = 10 + (i / 60) * 990;
                } else {
                    freq = 1000 + ((i - 60) / 40) * 19000;
                }

                // 2. Convert Frequency to FFT Bin Index
                // index = freq / binSize
                const binIndex = Math.min(Math.floor(freq / binSize), bufferLength - 1);

                // 3. Get Amplitude
                // Access direct bin or average neighbors?
                // Since low freqs (0-60) are 16.5Hz step vs 23.4Hz bin,
                // Multiple bars might share the same bin (aliasing). 
                // Creating a smooth curve is better by interpolation or simple taking the bin value.
                // Let's take the specific bin value for sharpness.

                // However, for high freqs (step 475Hz), we skip many bins. 
                // We should technically max/avg the bins between current freq and next freq.
                // But user wants "movement". Point sampling is fast and responsive. 
                // Let's try simple point sampling first, but maybe grab max of local neighborhood for highs.

                let value = dataArray[binIndex];

                // For High Freqs, grab Max of neighbor bins to ensure we don't miss peaks
                if (i >= 60) {
                    const nextFreq = 1000 + ((i + 1 - 60) / 40) * 19000;
                    const nextBin = Math.min(Math.floor(nextFreq / binSize), bufferLength - 1);
                    for (let k = binIndex; k <= nextBin; k++) {
                        if (dataArray[k] > value) value = dataArray[k];
                    }
                }

                // Draw
                const barHeight = (value / 255) * height
                ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
            }
        }

        draw()

        // Handle Resize ?? Canvas usually needs explicit size handling but w-full h-full + scale helps.
        // For sharp rendering on 2x screens we might need more logic, but MVP:
        const resize = () => {
            canvas.width = canvas.parentElement?.clientWidth || 300
            canvas.height = canvas.parentElement?.clientHeight || 100
        }
        window.addEventListener('resize', resize)
        resize() // Initial size

        return () => window.removeEventListener('resize', resize)

    }, [getFrequencyData, bandCount])

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full opacity-50"
        />
    )
}
