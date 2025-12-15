import React from 'react'
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import { useAudioStore } from '../../store/audioStore'

import { RealtimeSpectrum } from './RealtimeSpectrum'

export function VisualizerGraph() {
    const bands = useAudioStore(state => state.bands)

    // Data preparation: Recharts needs simple array of objects
    // bands already is { id, frequency, gain } which works perfectly.

    return (
        <div className="w-full h-full relative">

            {/* Real-time Audio Spectrum (Background Layer) */}
            <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen pointer-events-none">
                <RealtimeSpectrum />
            </div>

            {/* Background Grid Lines (Custom Overlay) - Aligned with Chart Margin Top 35px */}
            <div className="absolute top-[35px] bottom-0 left-0 right-0 flex flex-col justify-between text-[9px] text-slate-600 font-mono pointer-events-none z-0">
                <div className="border-b border-white/5 w-full flex justify-between px-2"><span>+12dB</span></div>
                <div className="border-b border-emerald-500/20 w-full flex justify-between px-2 text-emerald-500/50"><span>0dB</span></div>
                <div className="border-b border-white/5 w-full flex justify-between px-2"><span>-12dB</span></div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bands} margin={{ top: 35, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <YAxis
                        domain={[-12, 12]}
                        hide={true}
                    />

                    <Area
                        type="monotone"
                        dataKey="gain"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorGain)"
                        isAnimationActive={false} // Disable animation for instant drag response
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
