export interface AudioData {
    bands: { frequency: string; gain: number }[];
    bassBoost: number;
    subwooferGain: number;
    volume: number;
    preampGain: number;
    isBypass?: boolean;
}

export function generateAPOConfig(data: AudioData): string {
    const lines: string[] = [];

    // Header
    lines.push(`# Equalizer Master Configuration`);
    lines.push(`# Generated automatically. Do not edit manually.`);
    lines.push(``);

    // Prefix helper
    const p = data.isBypass ? '# [BYPASS] ' : '';

    // 4. Preamp Calculation
    // Volume Factor: 20 * log10(volume/100)
    // Plus Preamp Knob Factor: Map 0-100 to -12dB to +12dB (Center 50 = 0dB)

    let volumeDB = -100;
    if (data.volume > 0) {
        volumeDB = 20 * Math.log10(data.volume / 100);
    }

    let preampBoostDB = 0;
    // Map data.preampGain (0-100) to -12 to 12
    // If undefined, default to 0
    const prGain = data.preampGain !== undefined ? data.preampGain : 50;
    // (prGain - 50) / 50 * 12 ?? 
    // Wait, simplier: (prGain / 100 * 24) - 12
    preampBoostDB = (prGain / 100 * 24) - 12;

    const totalPreamp = volumeDB + preampBoostDB;

    // Safety clamp (don't go too crazy positive, maybe +20dB max?)
    // APO handles positive gain fine, user beware clipping.

    lines.push(`${p}Preamp: ${totalPreamp.toFixed(2)} dB`);
    lines.push(``);

    // 2. Bass Boost (Low Shelf Filter)
    // Bass Boost value 0-100 maps to Gain 0dB - 12dB at 100Hz
    if (data.bassBoost > 0) {
        const bassGain = (data.bassBoost / 100) * 12;
        lines.push(`# Bass Boost`);
        lines.push(`${p}Filter: ON LS Fc 100 Hz Gain ${bassGain.toFixed(1)} dB Q 1.0`);
        lines.push(``);
    }

    // 3. Subwoofer (Peaking Filter at very low freq)
    if (data.subwooferGain > 0) {
        // Map 0-100 to 0-15dB at 50Hz
        const subGain = (data.subwooferGain / 100) * 15;
        lines.push(`# Subwoofer Boost`);
        lines.push(`${p}Filter: ON PK Fc 50 Hz Gain ${subGain.toFixed(1)} dB Q 2.0`);
        lines.push(``);
    }

    // 4. Graphic EQ (100 Bands)
    // Format: GraphicEQ: 20 -1.5; 25 2.0; ...
    const eqEntries = data.bands.map(band => {
        let freqStr = band.frequency.toLowerCase().replace('hz', ''); // Remove Hz
        let freqVal = 0;

        if (freqStr.includes('k')) {
            freqStr = freqStr.replace('k', '');
            freqVal = parseFloat(freqStr) * 1000;
        } else {
            freqVal = parseFloat(freqStr);
        }

        return `${freqVal} ${band.gain.toFixed(2)}`;
    });

    lines.push(`${p}GraphicEQ: ${eqEntries.join('; ')}`);

    return lines.join('\n');
}
