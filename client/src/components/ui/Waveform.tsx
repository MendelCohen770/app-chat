import React from 'react';

interface WaveformProps {
    levels: number[];
    /** Progress in [0, 1] for the active portion coloring. */
    progress?: number;
    color?: string;
    activeColor?: string;
    onSeek?: (ratio: number) => void;
    ariaLabel?: string;
    /** Fixed height of the waveform in px. Defaults to 24. */
    height?: number;
}

/**
 * A small SVG waveform renderer used by the voice recorder preview and the
 * in-chat voice message player. Bars to the left of `progress` are tinted with
 * `activeColor`, making it double as a progress indicator.
 */
const Waveform: React.FC<WaveformProps> = ({
    levels,
    progress,
    color = '#94a3b8',
    activeColor = '#fb923c',
    onSeek,
    ariaLabel,
    height = 24,
}) => {
    const n = Math.max(1, levels.length);
    const BAR_SPACING = 3;
    const BAR_WIDTH = 2;
    const width = n * BAR_SPACING;

    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!onSeek) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        onSeek(ratio);
    };

    const handleKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
        if (!onSeek || progress == null) return;
        const step = 0.05;
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            onSeek(Math.min(1, progress + step));
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onSeek(Math.max(0, progress - step));
        } else if (e.key === 'Home') {
            e.preventDefault();
            onSeek(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            onSeek(1);
        }
    };

    return (
        <svg
            role={onSeek ? 'slider' : 'img'}
            aria-label={ariaLabel}
            aria-valuemin={onSeek ? 0 : undefined}
            aria-valuemax={onSeek ? 1 : undefined}
            aria-valuenow={onSeek && progress != null ? Number(progress.toFixed(2)) : undefined}
            tabIndex={onSeek ? 0 : undefined}
            preserveAspectRatio="none"
            viewBox={`0 0 ${width} ${height}`}
            style={{ height, direction: 'ltr' }}
            className={[
                'block flex-1 min-w-0',
                onSeek ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-sm' : '',
            ].join(' ')}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            {levels.map((lvl, i) => {
                const h = Math.max(2, lvl * height);
                const y = (height - h) / 2;
                const x = i * BAR_SPACING + (BAR_SPACING - BAR_WIDTH) / 2;
                const isActive = progress != null && (i + 0.5) / n <= progress;
                return (
                    <rect
                        key={i}
                        x={x}
                        y={y}
                        width={BAR_WIDTH}
                        height={h}
                        rx={1}
                        ry={1}
                        fill={isActive ? activeColor : color}
                    />
                );
            })}
        </svg>
    );
};

export const normalizeLevels = (levels: number[]): number[] => {
    if (levels.length === 0) return [];
    const max = levels.reduce((m, v) => (v > m ? v : m), 0);
    if (max <= 0.01) return levels.map(() => 0.08);
    return levels.map((v) => Math.max(0.08, Math.min(1, v / max)));
};

export const buildPreviewBars = (samples: number[], target: number): number[] => {
    if (samples.length === 0) return new Array(target).fill(0.08);
    if (samples.length <= target) {
        const out = new Array(target).fill(0);
        for (let i = 0; i < target; i++) {
            const idx = Math.floor((i / target) * samples.length);
            out[i] = samples[idx] || 0;
        }
        return normalizeLevels(out);
    }
    const step = samples.length / target;
    const out = new Array(target).fill(0);
    for (let i = 0; i < target; i++) {
        const start = Math.floor(i * step);
        const end = Math.max(start + 1, Math.floor((i + 1) * step));
        let peak = 0;
        for (let j = start; j < end && j < samples.length; j++) {
            if (samples[j] > peak) peak = samples[j];
        }
        out[i] = peak;
    }
    return normalizeLevels(out);
};

export const formatDuration = (seconds: number): string => {
    const s = Math.max(0, Math.floor(seconds));
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
};

export default Waveform;
