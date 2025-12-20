import React from 'react'
import { cn } from '../../lib/utils'
import { Github, Facebook, Globe } from 'lucide-react'

import logo from '../../assets/logo.png'

interface MainLayoutProps {
    children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center relative bg-black/50">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className={cn(
                "w-full h-full",
                "flex flex-col"
            )}>
                {/* Header Area */}
                <header className="flex justify-between items-center glass-panel px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-md z-50">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="App Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <div className="flex flex-col items-center">
                            <h1 className="font-bold text-xl tracking-wider text-neon text-white leading-none">
                                EQUALIZER <span className="text-emerald-400">MASTER</span>
                            </h1>
                            <div className="flex gap-3 mt-1.5">
                                <button
                                    onClick={() => window.open('https://github.com/maskodingku/EQUALIZER-MASTER', '_blank')}
                                    className="text-white/60 hover:text-white transition-colors"
                                    title="GitHub"
                                >
                                    <Github size={16} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => window.open('https://www.facebook.com/maskodingku/', '_blank')}
                                    className="text-white/60 hover:text-blue-400 transition-colors"
                                    title="Facebook"
                                >
                                    <Facebook size={16} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => window.open('https://www.maskoding.com/', '_blank')}
                                    className="text-white/60 hover:text-emerald-400 transition-colors"
                                    title="Website"
                                >
                                    <Globe size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-white/50 font-mono">
                        v1.2.0
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden relative">
                    {children}
                </main>
            </div >
        </div >
    )
}
