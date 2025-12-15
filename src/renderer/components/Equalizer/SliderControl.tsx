import { useRef, useEffect } from 'react'

interface SliderProps {
    frequency: string
    gain: number
    onChange: (val: number) => void
}

export function SliderControl({ frequency, gain, onChange }: SliderProps) {
    const trackRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)

    // Helper to calculate gain from mouse position
    const calculateGain = (clientY: number) => {
        if (!trackRef.current) return gain;

        const rect = trackRef.current.getBoundingClientRect();
        const height = rect.height;
        const bottom = rect.bottom;

        // Distance from bottom of the track
        let offsetY = bottom - clientY;

        // Clamp offset
        offsetY = Math.max(0, Math.min(offsetY, height));

        // Map 0-height to -12 to 12
        // Percentage 0-1
        const percent = offsetY / height;

        // Output range: 24dB (-12 to 12)
        // val = (percent * 24) - 12
        let newGain = (percent * 24) - 12;

        // Clamp -12 to 12
        newGain = Math.max(-12, Math.min(12, newGain));

        return newGain;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent text selection
        isDragging.current = true;

        // Initial click update
        const newGain = calculateGain(e.clientY);
        onChange(newGain);

        // Add global listeners
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'ns-resize'; // Change cursor globally
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const newGain = calculateGain(e.clientY);
        onChange(newGain);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = ''; // Reset cursor
    };

    // Wheel support (Scroll to change gain)
    const handleWheel = (e: React.WheelEvent) => {
        // Prevent default page scroll if we are hovering the slider
        // Note: e.preventDefault() in React synthetic event might not be enough for passive listeners
        // But let's try.

        // DeltaY > 0 means scroll down -> decrease gain
        // DeltaY < 0 means scroll up -> increase gain
        const step = 1; // 1dB per scroll step
        const delta = e.deltaY > 0 ? -step : step;

        let newGain = gain + delta;
        newGain = Math.max(-12, Math.min(12, newGain));
        onChange(newGain);
    };

    // Cleanup on unmount just in case
    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        }
    }, [])

    // Visulization percentage
    const percentage = ((gain + 12) / 24) * 100

    return (
        <div
            className="h-full flex flex-col items-center gap-1 group w-full"
            onWheel={handleWheel}
        >
            {/* The Track */}
            <div
                ref={trackRef}
                onMouseDown={handleMouseDown}
                className="relative flex-1 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 cursor-ns-resize hover:border-emerald-500/30 transition-colors"
            >
                {/* Background Grid Lines */}
                <div className="absolute inset-0 w-full h-full flex flex-col justify-between opacity-20 pointer-events-none">
                    <div className="w-full h-px bg-white/50" /> {/* +12 */}
                    <div className="w-full h-px bg-white/20" /> {/* +6 */}
                    <div className="w-full h-px bg-emerald-500/50" /> {/* 0 dB Center */}
                    <div className="w-full h-px bg-white/20" /> {/* -6 */}
                    <div className="w-full h-px bg-white/50" /> {/* -12 */}
                </div>

                {/* Active Fill Level */}
                <div
                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-emerald-900/80 via-emerald-500/80 to-emerald-400 transition-none rounded-t-sm pointer-events-none"
                    style={{ height: `${percentage}%` }}
                />

                {/* Value tooltip on hover (optional) */}
                <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white bg-black/80 px-0.5 rounded backdrop-blur-sm -rotate-90">
                        {gain > 0 ? '+' : ''}{Math.round(gain)}
                    </span>
                </div>
            </div>

            {/* Label */}
            <div className="text-[10px] text-slate-500 font-mono -rotate-90 w-full h-8 flex items-center justify-center whitespace-nowrap transform translate-y-2 group-hover:text-white transition-colors select-none font-medium">
                {frequency.replace('kHz', 'k').replace('Hz', '')}
            </div>
        </div>
    )
}
