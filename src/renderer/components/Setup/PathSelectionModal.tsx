import React from 'react'
import { FileText, FolderOpen, AlertTriangle } from 'lucide-react'
import { useAudioStore } from '../../store/audioStore'

export function PathSelectionModal() {
    const { configPath, promptConfigSelection } = useAudioStore()

    // Only show if configPath is empty
    // We check string length
    if (configPath && configPath.length > 0) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.1)] text-center">

                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                    <FileText size={32} className="text-emerald-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Equalizer Master</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    To start controlling your audio, please select the configuration file you want to target (e.g., <code>config.txt</code> utilized by Equalizer APO).
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => promptConfigSelection()}
                        className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                    >
                        <FolderOpen size={20} />
                        Select Config File
                    </button>

                    <p className="text-xs text-slate-500">
                        You can change this later in settings.
                    </p>
                </div>

            </div>
        </div>
    )
}
