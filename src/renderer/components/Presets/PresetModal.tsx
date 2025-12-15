import React, { useState, useEffect } from 'react'
import { X, Save, Upload, Trash2 } from 'lucide-react'
import { useAudioStore } from '../../store/audioStore'

interface PresetModalProps {
    type: 'save' | 'load'
    isOpen: boolean
    onClose: () => void
}

// Define interface locally or import from types.d.ts if module resolution works perfect
interface Preset {
    name: string
    bands: any[]
    bassBoost: number
    subwooferGain: number
    volume: number
}

export function PresetModal({ type, isOpen, onClose }: PresetModalProps) {
    const [presetName, setPresetName] = useState('')
    const [presets, setPresets] = useState<Preset[]>([])
    const { bands, bassBoost, subwooferGain, volume, loadPreset } = useAudioStore()

    const fetchPresets = () => {
        window.ipcRenderer.getPresets().then((data: any) => {
            if (Array.isArray(data)) setPresets(data)
        })
    }

    useEffect(() => {
        if (isOpen) {
            // Load presets from IPC when modal opens
            fetchPresets()
        }
    }, [isOpen])

    const handleSave = async () => {
        if (!presetName) return
        const newPreset: Preset = {
            name: presetName,
            bands,
            bassBoost,
            subwooferGain,
            volume
        }
        await window.ipcRenderer.savePreset(newPreset)
        onClose()
    }

    const handleLoad = (preset: Preset) => {
        loadPreset(preset)
        onClose()
    }

    const handleDelete = async (e: React.MouseEvent, name: string) => {
        e.stopPropagation() // Prevent triggering load
        if (confirm(`Are you sure you want to delete preset "${name}"?`)) {
            await window.ipcRenderer.deletePreset(name)
            fetchPresets() // Refresh list
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {type === 'save' ? <Save className="text-emerald-400" /> : <Upload className="text-blue-400" />}
                        {type === 'save' ? 'Save New Preset' : 'Load Preset'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {type === 'save' ? (
                    <div className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Enter preset name..."
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                            autoFocus
                        />
                        <button
                            onClick={handleSave}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            Save Preset
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {presets.length === 0 ? (
                            <div className="text-center text-slate-500 py-8">No presets found.</div>
                        ) : (
                            presets.map((p, idx) => (
                                presets.map((p, idx) => (
                                    <div
                                        key={idx}
                                        className="w-full flex justify-between items-center bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-transparent hover:border-blue-500/30 transition-all group"
                                    >
                                        <button
                                            onClick={() => handleLoad(p)}
                                            className="flex-1 text-left"
                                        >
                                            <div className="font-bold text-white group-hover:text-blue-400">{p.name}</div>
                                            <div className="text-[10px] text-slate-500">
                                                Bass: {Math.round(p.bassBoost)}% • Sub: {Math.round(p.subwooferGain)}%
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, p.name)}
                                            className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                                            title="Delete Preset"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
