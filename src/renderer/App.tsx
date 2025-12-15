import React, { useState } from 'react'
import { MainLayout } from './components/Layout/MainLayout'
import { FrequencyBars } from './components/Equalizer/FrequencyBars'
import { VisualizerGraph } from './components/Equalizer/VisualizerGraph'
import { Knob } from './components/Controls/Knob'
import { useAudioStore } from './store/audioStore'
import { PresetModal } from './components/Presets/PresetModal'
import { SetupGuideModal } from './components/Help/SetupGuideModal'
import { PathSelectionModal } from './components/Setup/PathSelectionModal'
import { Power, Save, FolderOpen, RefreshCcw, HelpCircle, CheckCircle2, AlertCircle, Loader2, FileCog, Settings } from 'lucide-react'

function App() {
    const { bassBoost, subwooferGain, volume, preampGain, isBypass, setBassBoost, setSubwooferGain, setVolume, setPreampGain, toggleBypass, resetFlat, syncStatus, configPath, promptConfigSelection } = useAudioStore()

    const [modalType, setModalType] = useState<'save' | 'load' | null>(null)
    const [showHelp, setShowHelp] = useState(false)
    // Settings modal removed per user request

    // Status Indicator Component
    const StatusBadge = () => {
        return (
            <div
                onClick={promptConfigSelection}
                className="group flex flex-col items-center gap-2 cursor-pointer transition-all bg-white/5 hover:bg-white/10 px-4 py-3 rounded-xl border border-white/5 hover:border-white/20 w-full"
                title={`Target: ${configPath || 'None'}`}
            >
                <div className="flex items-center gap-2">
                    {syncStatus === 'synced' && <CheckCircle2 size={16} className="text-emerald-400" />}
                    {syncStatus === 'saving' && <Loader2 size={16} className="animate-spin text-blue-400" />}
                    {syncStatus === 'error' && <AlertCircle size={16} className="text-red-400" />}
                    {syncStatus === 'idle' && <div className="w-2 h-2 rounded-full bg-slate-500" />}
                    <span className={`text-[10px] font-bold ${syncStatus === 'synced' ? 'text-emerald-400' :
                        syncStatus === 'saving' ? 'text-blue-400' :
                            syncStatus === 'error' ? 'text-red-400' : 'text-slate-500'
                        }`}>
                        {syncStatus === 'synced' ? 'SYNCED' :
                            syncStatus === 'saving' ? 'SAVING...' :
                                syncStatus === 'error' ? 'ERROR' : 'IDLE'}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-slate-500">
                    <FileCog size={10} />
                    <span>Config</span>
                </div>
            </div>
        )
    }

    return (
        <MainLayout>
            <PathSelectionModal />

            <PresetModal
                type={modalType || 'save'}
                isOpen={!!modalType}
                onClose={() => setModalType(null)}
            />

            <SetupGuideModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
            />

            {/* Main Layout Container (Row) */}
            <div className="h-full flex gap-1 p-2">

                {/* Left Column: Graph + Equalizer Sliders */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">

                    {/* Top: Visualizer Graph + Preset Controls */}
                    <div className="h-[35%] glass-panel relative overflow-hidden flex gap-4 pr-4">
                        {/* The Graph */}
                        <div className="flex-1 relative flex flex-col h-full">
                            <div className="absolute top-2 left-4 text-xs font-bold text-slate-500 tracking-widest z-20">
                                FREQUENCY RESPONSE
                            </div>
                            <VisualizerGraph />
                        </div>

                        {/* Preset Buttons (Embedded Side by Side) */}
                        <div className="w-[140px] flex flex-col justify-center gap-2 py-4 border-l border-white/5 pl-4 my-2">
                            <button
                                onClick={() => setModalType('save')}
                                className="w-full py-2 px-3 bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-lg flex items-center gap-3 transition-all group"
                            >
                                <Save size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                <div className="text-left">
                                    <div className="text-[10px] font-bold text-white">Save</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setModalType('load')}
                                className="w-full py-2 px-3 bg-white/5 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 rounded-lg flex items-center gap-3 transition-colors group"
                            >
                                <FolderOpen size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                <div className="text-left">
                                    <div className="text-[10px] font-bold text-white">Load</div>
                                </div>
                            </button>

                            <button
                                onClick={resetFlat}
                                className="w-full py-2 px-3 bg-transparent hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg flex items-center justify-center gap-2 transition-colors text-[10px] text-slate-500 hover:text-red-400"
                            >
                                <RefreshCcw size={12} />
                                Reset Flat
                            </button>
                        </div>
                    </div>

                    {/* Bottom: Frequency Sliders */}
                    <div className="h-[65%] glass-panel p-1 relative overflow-hidden flex flex-col">
                        <FrequencyBars />
                    </div>
                </div>


                {/* Right Column: Sidebar Controls */}
                <div className="w-[200px] glass-panel p-4 flex flex-col gap-6 shrink-0 h-full overflow-y-auto custom-scrollbar">

                    {/* Header Controls */}
                    <div className="flex justify-between items-center">
                        <div className="text-xs font-bold text-slate-300 tracking-widest">MASTER</div>
                        <button
                            onClick={() => setShowHelp(true)}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <HelpCircle size={16} />
                        </button>
                    </div>

                    {/* Status Button */}
                    <StatusBadge />

                    <div className="w-full h-px bg-white/5" />

                    {/* Volume Knob */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={toggleBypass}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-[10px] font-bold border ${isBypass
                                ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                                : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10 hover:border-white/20'}`}
                        >
                            <Power size={12} />
                            {isBypass ? 'BYPASS ACTIVE' : 'BYPASS'}
                        </button>

                        <Knob
                            label="VOLUME"
                            value={volume}
                            onChange={setVolume}
                            size={90}
                            max={100}
                        />
                        <div className="flex flex-col items-center gap-2">
                            <Knob
                                label="PREAMP"
                                value={preampGain}
                                onChange={setPreampGain}
                                size={60}
                                max={100}
                            />
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Bass & Sub */}
                    <div className="flex flex-col items-center gap-6">
                        <Knob
                            label="BASS BOOST"
                            value={bassBoost}
                            onChange={setBassBoost}
                            size={70}
                        />
                        <Knob
                            label="SUBWOOFER"
                            value={subwooferGain}
                            onChange={setSubwooferGain}
                            size={70}
                        />
                    </div>

                </div>

            </div>
        </MainLayout>
    )
}

export default App
