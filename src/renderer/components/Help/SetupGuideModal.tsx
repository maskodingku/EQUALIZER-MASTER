import React, { useRef } from 'react'
import { X, Copy, Check, FileText } from 'lucide-react'
import { useAudioStore } from '../../store/audioStore'

interface SetupGuideModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SetupGuideModal({ isOpen, onClose }: SetupGuideModalProps) {
    const { configPath } = useAudioStore()
    const [copied, setCopied] = React.useState(false)

    const handleCopy = () => {
        if (configPath) {
            navigator.clipboard.writeText(configPath)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl p-0 shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">🔊</span>
                            Setup Guide
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Connect this app to Windows Audio System (Equalizer APO)</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Step 1 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30">1</div>
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-white">Install Equalizer APO</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                This application acts as a controller for Equalizer APO. If you haven't installed it yet, please download it from SourceForge.
                            </p>
                            <a
                                href="https://sourceforge.net/projects/equalizerapo/"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-blue-400 text-sm hover:underline"
                            >
                                Download Equalizer APO ↗
                            </a>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">2</div>
                        <div className="space-y-4 w-full">
                            <h3 className="text-lg font-bold text-white">Link Configuration File</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Open <b>Configuration Editor</b> (from Equalizer APO), then add an Include command pointing to our generated config file.
                            </p>

                            <div className="bg-black/50 border border-white/10 rounded-xl p-4 space-y-3">
                                <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Your Config File Path</div>
                                <div className="flex gap-2">
                                    <code className="flex-1 bg-white/5 p-3 rounded-lg text-emerald-400 font-mono text-xs break-all border border-white/5">
                                        {configPath || "Running app to generate path..."}
                                    </code>
                                    <button
                                        onClick={handleCopy}
                                        className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-lg transition-colors"
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold border border-purple-500/30">3</div>
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-white">Verify Sound</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Play some music and move the sliders in this app. The sound should change immediately!
                            </p>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-black/20 text-center">
                    <button onClick={onClose} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">
                        I'm Ready!
                    </button>
                </div>
            </div>
        </div>
    )
}
