export interface Preset {
    name: string
    bands: { id: number; gain: number; frequency: string }[]
    bassBoost: number
    subwooferGain: number
    volume: number
}

declare global {
    interface Window {
        ipcRenderer: {
            on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
            off: (channel: string, ...args: any[]) => void
            send: (channel: string, ...args: any[]) => void
            invoke: (channel: string, ...args: any[]) => Promise<any>
            getPresets: () => Promise<Preset[]>
            savePreset: (preset: Preset) => Promise<{ success: boolean }>
            deletePreset: (name: string) => Promise<any>
            updateLiveEQ: (data: any) => void
            getLastState: () => Promise<any>
            saveLastState: (state: any) => Promise<void>
            getDesktopSources: () => Promise<Array<{ id: string, name: string }>>
            selectConfigFile: () => Promise<string | null>
            getConfigPath: () => Promise<string>
        }
    }
}

declare module '*.png' {
    const value: string;
    export default value;
}
declare module '*.jpg';
declare module '*.svg';
