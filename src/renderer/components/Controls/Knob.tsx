import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils'; // Assuming you have utility for classnames

interface KnobProps {
    value: number; // 0 - 100
    min?: number;
    max?: number;
    onChange: (value: number) => void;
    label: string;
    size?: number;
}

export function Knob({ value, onChange, label, min = 0, max = 100, size = 80 }: KnobProps) {
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef<number>(0);
    const startValue = useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        startY.current = e.clientY;
        startValue.current = value;
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const deltaY = startY.current - e.clientY;
            // Sensitivity divider, higher is slower
            const change = deltaY * 0.5;

            let newValue = startValue.current + change;
            newValue = Math.max(min, Math.min(max, newValue));

            onChange(newValue);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, min, max, onChange]);

    const handleWheel = (e: React.WheelEvent) => {
        const step = 5;
        const delta = e.deltaY > 0 ? -step : step;
        let newValue = value + delta;
        newValue = Math.max(min, Math.min(max, newValue));
        onChange(newValue);
    };

    // Calculate rotation angle
    // Map 0-100 to -135deg to +135deg (total 270deg sweep)
    const percentage = (value - min) / (max - min);
    const angle = -135 + (percentage * 270);

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            <div
                className="relative rounded-full bg-gray-800 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] cursor-ns-resize group"
                style={{ width: size, height: size }}
                onMouseDown={handleMouseDown}
                onWheel={handleWheel}
            >
                {/* Indicator Glow */}
                <div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                        boxShadow: `0 0 15px rgba(52, 211, 153, ${0.3 + (percentage * 0.4)})`
                    }}
                />

                {/* The Rotating Cap */}
                <div
                    className="absolute w-full h-full rounded-full border-2 border-slate-700/50 bg-gradient-to-b from-slate-700 to-slate-900 flex justify-center"
                    style={{ transform: `rotate(${angle}deg)` }}
                >
                    {/* Marker Line */}
                    <div className="w-1.5 h-1/2 bg-emerald-500 rounded-b-sm shadow-[0_0_8px_rgba(52,211,153,0.8)] mt-1" />
                </div>

                {/* Center Cap decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full bg-slate-900 shadow-[0_2px_5px_rgba(0,0,0,0.8)] bg-gradient-to-br from-slate-800 to-black" />
            </div>

            <div className="text-center group-hover:text-emerald-400 transition-colors">
                <div className="text-xs font-bold tracking-widest text-slate-400">{label}</div>
                <div className="text-[10px] text-slate-500 font-mono">{Math.round(value)}%</div>
            </div>
        </div>
    );
}
