import React from 'react'
import { cn } from '../../lib/utils'

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
                        <h1 className="font-bold text-xl tracking-wider text-neon text-white">
                            EQUALIZER <span className="text-emerald-400">MASTER</span>
                        </h1>
                    </div>
                    <div className="text-xs text-white/50 font-mono">
                        v1.0.0-dev
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden relative">
                    {children}
                </main>
            </div>
        </div>
    )
}
