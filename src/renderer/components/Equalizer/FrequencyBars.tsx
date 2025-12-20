import { useAudioStore } from '../../store/audioStore'
import { SliderControl } from './SliderControl'

export function FrequencyBars() {
    const bands = useAudioStore(state => state.bands)
    const setBandGain = useAudioStore(state => state.setBandGain)
    const applyGenrePreset = useAudioStore(state => state.applyGenrePreset)

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const genre = e.target.value;
        if (genre !== 'custom') {
            applyGenrePreset(genre);
            // Reset select to custom/placeholder if desired, but keeping it visible is ok
            // actually better to keep it to show what was last applied?
            // But if user moves slider, it's misleading.
            // Let's reset it visually or just leave it. Leaving it is standard.
        }
    };

    return (
        <div className="w-full h-full flex flex-col gap-2">
            <div className="flex justify-between items-center px-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Frequency Spectrum</span>

                    {/* Genre Preset Selector */}
                    <select
                        className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-[10px] text-emerald-400 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                        onChange={handlePresetChange}
                        defaultValue="custom"
                    >
                        <option value="custom" disabled>⚡ Load Preset...</option>
                        <option value="Flat">Flat (Reset)</option>
                        <option value="Rock">🎸 Rock</option>
                        <option value="Pop">🎤 Pop</option>
                        <option value="Dangdut">🪘 Dangdut</option>
                        <option value="Jazz">🎷 Jazz</option>
                        <option value="Classical">🎻 Classical</option>
                        <option value="separator" disabled>──────────</option>
                        <option value="Acoustic">🎹 Acoustic</option>
                        <option value="Electronic">⚡ Electronic</option>
                        <option value="Hip-Hop">🧢 Hip-Hop</option>
                        <option value="Bass Booster">🔊 Bass Booster</option>
                        <option value="Bass Reducer">📉 Bass Reducer</option>
                        <option value="Loudness">📢 Loudness</option>
                        <option value="Vocal Booster">🗣️ Vocal Booster</option>
                        <option value="Spoken Word">🎙️ Spoken Word</option>
                        <option value="Gaming">🎮 Gaming</option>
                        <option value="Cinema">🍿 Cinema</option>
                    </select>
                </div>

                <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
                    <span>0dB Reference</span>
                    <span>Max +12dB</span>
                </div>
            </div>

            {/* Fixed Container for 100 bars - Fit to Width */}
            <div className="flex-1 overflow-hidden pb-1 w-full relative">
                <div className="flex flex-nowrap items-stretch justify-between h-full w-full gap-[1px]">
                    {bands.map(band => (
                        <div key={band.id} className="flex-1 min-w-0 h-full relative group/band">
                            <SliderControl
                                frequency={band.frequency}
                                gain={band.gain}
                                onChange={(val) => setBandGain(band.id, val)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
