import { create } from 'zustand'

export interface EqualizerBand {
    id: number;
    frequency: string; // Label frekuensi (e.g., "30Hz", "1kHz")
    gain: number; // Nilai gain (-12dB to +12dB)
}

interface AudioState {
    bands: EqualizerBand[];
    bassBoost: number; // 0-100%
    subwooferGain: number; // 0-100%
    volume: number; // 0-100%
    preampGain: number; // 0-100% (Control Preamp Boost)
    vocalGain: number; // 0-100%
    trebleGain: number; // 0-100%
    midGain: number; // 0-100%
    loudnessGain: number; // 0-100%
    isBypass: boolean;
    _bypassSnapshot: { // Internal snapshot
        bands: EqualizerBand[];
        bassBoost: number;
        subwooferGain: number;
        preampGain: number;
    } | null;

    // Actions
    setBandGain: (id: number, gain: number) => void;
    setBassBoost: (val: number) => void;
    setSubwooferGain: (val: number) => void;
    setVolume: (val: number) => void;
    setPreampGain: (val: number) => void;
    setVocalGain: (val: number) => void;
    setTrebleGain: (val: number) => void;
    setMidGain: (val: number) => void;
    setLoudnessGain: (val: number) => void;
    toggleBypass: () => void;
    resetFlat: () => void;
    loadPreset: (preset: any) => void;
    applyGenrePreset: (genre: string) => void; // New Action

    // Sync Status
    syncStatus: 'idle' | 'saving' | 'synced' | 'error';
    configPath: string;
    setSyncStatus: (status: 'idle' | 'saving' | 'synced' | 'error', path?: string) => void;

    setConfigPath: (path: string) => void;
    promptConfigSelection: () => Promise<void>;
}

// Generate 100 bands default
// Generate 100 bands with custom non-linear distribution
const generateDefaultBands = (): EqualizerBand[] => {
    return Array.from({ length: 100 }, (_, i) => {
        let freqVal = 0;

        // Split distribution requested by user:
        // Bars 0-59 (60 bars): 10Hz - 1kHz
        // Bars 60-99 (40 bars): 1kHz - 20kHz
        if (i < 60) {
            // Range 1: 10Hz to 1000Hz over 60 steps
            const min = 10;
            const max = 1000;
            const progress = i / 60;
            freqVal = min + (progress * (max - min));
        } else {
            // Range 2: 1000Hz to 20000Hz over 40 steps
            const min = 1000;
            const max = 20000;
            const progress = (i - 60) / 40;
            freqVal = min + (progress * (max - min));
        }

        // Format label
        let label = '';
        if (freqVal >= 1000) {
            const kVal = freqVal / 1000;
            // Show decimal if needed, e.g. 1.5k, but keep it clean
            label = `${parseFloat(kVal.toFixed(1))}kHz`;
        } else {
            label = `${Math.round(freqVal)}Hz`;
        }

        return {
            id: i,
            frequency: label,
            gain: 0
        };
    });
};

export const useAudioStore = create<AudioState>((set) => ({
    bands: generateDefaultBands(),
    bassBoost: 0,
    subwooferGain: 50,
    volume: 80,
    preampGain: 50, // Default Center (0dB if mapped -12 to +12)
    vocalGain: 0,
    trebleGain: 0,
    midGain: 0,
    loudnessGain: 0,
    isBypass: false,
    _bypassSnapshot: null,

    setBandGain: (id, gain) => set((state) => ({
        bands: state.bands.map(b => b.id === id ? { ...b, gain } : b)
    })),
    setBassBoost: (val) => set({ bassBoost: val }),
    setSubwooferGain: (val) => set({ subwooferGain: val }),
    setPreampGain: (val) => set({ preampGain: val }),
    setVocalGain: (val) => set({ vocalGain: val }),
    setTrebleGain: (val) => set({ trebleGain: val }),
    setMidGain: (val) => set({ midGain: val }),
    setLoudnessGain: (val) => set({ loudnessGain: val }),
    setVolume: (val) => set({ volume: val }), // Volume always adjustable

    toggleBypass: () => set((state) => ({ isBypass: !state.isBypass })),

    resetFlat: () => set({
        bands: generateDefaultBands(),
        bassBoost: 0,
        subwooferGain: 0, // Reset to 0 (No boost) instead of 50? Wait, old default was 50?
        // Let's check init state: subwooferGain: 50. 
        // If 50 means +7.5dB, then resetFlat to 50 is NOT flat. 
        // Let's fix resetFlat to actual 0 (Flat).
        volume: 80,
        preampGain: 50,
        vocalGain: 0,
        trebleGain: 0,
        midGain: 0,
        loudnessGain: 0,
        isBypass: false,
    }),
    loadPreset: (preset) => set({
        bands: preset.bands,
        bassBoost: preset.bassBoost || 0,
        subwooferGain: preset.subwooferGain || 50, // Keep legacy default if missing, or 0? 
        volume: preset.volume || 80,
        preampGain: preset.preampGain || 50,
        isBypass: false, // Loading preset disables bypass
        _bypassSnapshot: null
    }),

    applyGenrePreset: (genre) => set((state) => {
        // Linear Interpolation Helper
        const interpolate = (freq: number, points: { f: number, g: number }[]) => {
            if (points.length === 0) return 0;
            // Sort points just in case
            // points.sort((a, b) => a.f - b.f); // Assumed sorted for performance

            // Lower boundary
            if (freq <= points[0].f) return points[0].g;
            // Upper boundary
            if (freq >= points[points.length - 1].f) return points[points.length - 1].g;

            // Find segment
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                if (freq >= p1.f && freq <= p2.f) {
                    const range = p2.f - p1.f;
                    const ratio = (freq - p1.f) / range;
                    return p1.g + (ratio * (p2.g - p1.g));
                }
            }
            return 0;
        };

        // Define Control Points for Curves
        let points: { f: number, g: number }[] = [];

        switch (genre) {
            case 'Rock':
                // V-Shape: Boost Lows, Cut Mids, Boost Highs
                points = [
                    { f: 20, g: 5 }, { f: 60, g: 7 }, { f: 150, g: 3 },
                    { f: 500, g: -4 }, { f: 1000, g: -4 },
                    { f: 3000, g: 2 }, { f: 8000, g: 6 }, { f: 16000, g: 7 }
                ];
                break;
            case 'Pop':
                // W-Shape: Punchy Bass, Clear Vocals
                points = [
                    { f: 30, g: 3 }, { f: 100, g: 4 }, { f: 250, g: 3 },
                    { f: 1000, g: 0 },
                    { f: 3000, g: -2 }, // Avoid harshness
                    { f: 6000, g: -1 }, { f: 12000, g: 4 }, { f: 18000, g: 4 }
                ];
                break;
            case 'Dangdut':
                // "Gendang" Kick (60-100Hz) & "Tak" (3-5kHz)
                points = [
                    { f: 30, g: 5 }, { f: 60, g: 8 }, { f: 105, g: 8 },
                    { f: 250, g: 3 }, { f: 500, g: -1 }, { f: 800, g: -3 },
                    { f: 2500, g: 2 }, { f: 4000, g: 6 }, // The 'Tak'
                    { f: 6000, g: 4 }, { f: 10000, g: 2 }, { f: 16000, g: 3 }
                ];
                break;
            case 'Jazz':
                // Warm, Relaxed highs
                points = [
                    { f: 30, g: 3 }, { f: 150, g: 3 }, { f: 500, g: 1 },
                    { f: 1000, g: 0 }, { f: 2500, g: -2 },
                    { f: 5000, g: -1 }, { f: 10000, g: -2 }, { f: 20000, g: -4 }
                ];
                break;
            case 'Classical':
                // Arch: Mid Focus
                points = [
                    { f: 30, g: 0 }, { f: 200, g: 1 }, { f: 1000, g: 2 },
                    { f: 5000, g: 1 }, { f: 15000, g: -1 }
                ];
                break;
            // --- NEW PRESETS ---
            case 'Acoustic':
                points = [
                    { f: 50, g: 1 }, { f: 200, g: 2 }, { f: 1000, g: 3 },
                    { f: 4000, g: 4 }, { f: 10000, g: 2 }
                ];
                break;
            case 'Bass Booster':
                points = [
                    { f: 30, g: 6 }, { f: 60, g: 9 }, { f: 100, g: 6 },
                    { f: 250, g: 2 }, { f: 500, g: 0 }
                ];
                break;
            case 'Bass Reducer':
                points = [
                    { f: 30, g: -8 }, { f: 80, g: -5 }, { f: 200, g: -2 },
                    { f: 500, g: 0 }
                ];
                break;
            case 'Electronic':
                points = [
                    { f: 30, g: 5 }, { f: 80, g: 6 }, { f: 200, g: 1 },
                    { f: 1000, g: -2 }, { f: 5000, g: 3 }, { f: 12000, g: 5 }
                ];
                break;
            case 'Hip-Hop':
                points = [
                    { f: 40, g: 7 }, { f: 80, g: 5 }, { f: 250, g: 1 },
                    { f: 1000, g: -2 }, { f: 4000, g: 2 }, { f: 10000, g: 3 }
                ];
                break;
            case 'Spoken Word':
                points = [
                    { f: 60, g: -6 }, { f: 200, g: -2 }, { f: 500, g: 2 },
                    { f: 1000, g: 4 }, { f: 3000, g: 4 }, { f: 8000, g: -2 }
                ];
                break;
            case 'Loudness':
                points = [
                    { f: 30, g: 7 }, { f: 100, g: 4 }, { f: 500, g: -2 },
                    { f: 2000, g: 0 }, { f: 8000, g: 5 }, { f: 16000, g: 8 }
                ];
                break;
            case 'Vocal Booster':
                points = [
                    { f: 200, g: -3 }, { f: 500, g: 2 }, { f: 1000, g: 5 },
                    { f: 3000, g: 5 }, { f: 8000, g: 2 }
                ];
                break;
            case 'Gaming':
                points = [
                    { f: 40, g: 5 }, { f: 100, g: 3 }, { f: 500, g: -3 },
                    { f: 2000, g: 4 }, { f: 6000, g: 6 }, { f: 12000, g: 5 }
                ];
                break;
            case 'Cinema':
                points = [
                    { f: 30, g: 5 }, { f: 80, g: 4 }, { f: 300, g: -2 },
                    { f: 1000, g: 0 }, { f: 5000, g: 3 }, { f: 12000, g: 6 }
                ];
                break;
            case 'Flat':
            default:
                points = [{ f: 0, g: 0 }, { f: 20000, g: 0 }];
                break;
        }

        const newBands = state.bands.map(band => {
            // Parse frequency
            let freq = 0;
            const str = band.frequency.toLowerCase();
            if (str.includes('k')) {
                freq = parseFloat(str.replace('k', '').replace('hz', '')) * 1000;
            } else {
                freq = parseFloat(str.replace('hz', ''));
            }

            const gain = interpolate(freq, points);
            return { ...band, gain };
        });

        return {
            bands: newBands,
            isBypass: false
        };
    }),

    // Status State
    syncStatus: 'idle',
    configPath: '',
    setSyncStatus: (status, path) => set((state) => ({
        syncStatus: status,
        configPath: path || state.configPath // Only update path if provided, otherwise keep existing
    })),

    // Settings Actions
    setConfigPath: (path) => set({ configPath: path }),
    promptConfigSelection: async () => {
        if (window.ipcRenderer) {
            const path = await window.ipcRenderer.selectConfigFile();
            if (path) {
                set({ configPath: path });
            }
        }
    }
}))

// Listen for sync events from Main Process
if (window.ipcRenderer) {
    window.ipcRenderer.on('eq-sync-status', (_: any, data: any) => {
        useAudioStore.getState().setSyncStatus(data.status, data.filepath);
    });
}

// Custom debounce function (simple implementation to avoid extra dependencies if possible, or usually we'd use lodash)
const debounce = (func: Function, wait: number) => {
    let timeout: any;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const debouncedSave = debounce((state: AudioState) => {
    if (window.ipcRenderer) {
        // 1. Update Live EQ (Config File)
        window.ipcRenderer.updateLiveEQ({
            bands: state.bands,
            bassBoost: state.bassBoost,
            subwooferGain: state.subwooferGain,
            volume: state.volume,
            preampGain: state.preampGain,
            vocalGain: state.vocalGain,
            trebleGain: state.trebleGain,
            midGain: state.midGain,
            loudnessGain: state.loudnessGain,
            isBypass: state.isBypass
        });

        // 2. Persist State (Last Session)
        window.ipcRenderer.saveLastState({
            bands: state.bands,
            bassBoost: state.bassBoost,
            subwooferGain: state.subwooferGain,
            volume: state.volume,
            preampGain: state.preampGain,
            vocalGain: state.vocalGain,
            trebleGain: state.trebleGain,
            midGain: state.midGain,
            loudnessGain: state.loudnessGain,
            isBypass: state.isBypass
        });
    }
}, 200); // Wait 200ms after last change

// Subscribe and Debounce
// This subscribe fires on ANY state change.
// It should only fire when AUDIO PARAMS change.
// To avoid infinite loops (change -> save -> status 'saving' -> change -> save...)
// we must filter what we watch.

useAudioStore.subscribe((state, prevState) => {
    // Check if any AUDIO param changed
    const audioChanged = (
        state.bands !== prevState.bands ||
        state.bassBoost !== prevState.bassBoost ||
        state.subwooferGain !== prevState.subwooferGain ||
        state.volume !== prevState.volume ||
        state.preampGain !== prevState.preampGain ||
        state.vocalGain !== prevState.vocalGain ||
        state.trebleGain !== prevState.trebleGain ||
        state.midGain !== prevState.midGain ||
        state.loudnessGain !== prevState.loudnessGain ||
        state.isBypass !== prevState.isBypass
    );

    if (!audioChanged) return;

    // Trigger saving status
    useAudioStore.getState().setSyncStatus('saving');

    // Call debounced save
    debouncedSave(state);
});

// Initialize Loading Initial State
if (window.ipcRenderer) {
    window.ipcRenderer.getLastState().then((savedState: any) => {
        if (savedState) {
            useAudioStore.setState({
                bands: savedState.bands || generateDefaultBands(),
                bassBoost: savedState.bassBoost || 0,
                subwooferGain: savedState.subwooferGain || 50,
                volume: savedState.volume || 80,
                preampGain: savedState.preampGain || 50,
                vocalGain: savedState.vocalGain || 0,
                trebleGain: savedState.trebleGain || 0,
                midGain: savedState.midGain || 0,
                loudnessGain: savedState.loudnessGain || 0
            });
            // Force first sync immediately
            window.ipcRenderer.updateLiveEQ(savedState);
        }
    });
}
