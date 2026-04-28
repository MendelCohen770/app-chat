import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Waveform, { buildPreviewBars, formatDuration } from './ui/Waveform';
import apiClient from '../service/apiClient';

const PLAYER_BAR_COUNT = 40;

/**
 * Shared cache of decoded waveforms per URL — avoids re-downloading and
 * re-decoding the same voice message if it re-renders or appears multiple
 * times in the list.
 */
const WAVEFORM_CACHE = new Map<string, { bars: number[]; duration: number }>();

const decodeWaveform = async (
    url: string,
): Promise<{ bars: number[]; duration: number }> => {
    const cached = WAVEFORM_CACHE.get(url);
    if (cached) return cached;

    const AudioCtxCtor: typeof AudioContext | undefined =
        (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxCtor) {
        return { bars: new Array(PLAYER_BAR_COUNT).fill(0.2), duration: 0 };
    }

    const response = await apiClient.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
    const arrayBuffer = response.data;
    const ctx = new AudioCtxCtor();
    try {
        // Safari returns undefined from decodeAudioData if passed a callback
        // form, so we stick with the promise form.
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
        const channel = audioBuffer.getChannelData(0);

        // Down-sample to PLAYER_BAR_COUNT * 4 peaks first so buildPreviewBars
        // has enough data to work with while keeping the work bounded.
        const COARSE = PLAYER_BAR_COUNT * 4;
        const blockSize = Math.max(1, Math.floor(channel.length / COARSE));
        const peaks = new Array(COARSE).fill(0);
        for (let i = 0; i < COARSE; i++) {
            let peak = 0;
            const start = i * blockSize;
            const end = Math.min(channel.length, start + blockSize);
            for (let j = start; j < end; j++) {
                const v = Math.abs(channel[j]);
                if (v > peak) peak = v;
            }
            peaks[i] = peak;
        }
        const bars = buildPreviewBars(peaks, PLAYER_BAR_COUNT);
        const result = { bars, duration: audioBuffer.duration };
        WAVEFORM_CACHE.set(url, result);
        return result;
    } finally {
        try {
            await ctx.close();
        } catch {
            // ignore
        }
    }
};

interface VoiceMessagePlayerProps {
    /** Fully-resolved absolute URL to the audio file. */
    src: string;
    /** Whether the message was sent by the current user (affects color scheme). */
    isMine: boolean;
    /** Called when the audio file cannot be loaded (e.g. missing on server). */
    onUnavailable?: () => void;
}

const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ src, isMine, onUnavailable }) => {
    const { t } = useTranslation();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const mountedRef = useRef(true);

    const [bars, setBars] = useState<number[]>(() =>
        new Array(PLAYER_BAR_COUNT).fill(0.2),
    );
    const [loadingWave, setLoadingWave] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState<number>(0);
    const [waveformError, setWaveformError] = useState(false);
    const unavailableNotifiedRef = useRef(false);

    const notifyUnavailableOnce = useCallback(() => {
        if (unavailableNotifiedRef.current) return;
        unavailableNotifiedRef.current = true;
        onUnavailable?.();
    }, [onUnavailable]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        unavailableNotifiedRef.current = false;
        setLoadingWave(true);
        setWaveformError(false);
        decodeWaveform(src)
            .then((res) => {
                if (cancelled || !mountedRef.current) return;
                setBars(res.bars);
                if (res.duration && isFinite(res.duration) && res.duration > 0) {
                    setDuration(res.duration);
                }
                setLoadingWave(false);
            })
            .catch((err) => {
                console.warn('Failed to decode voice waveform', err);
                if (cancelled || !mountedRef.current) return;
                setLoadingWave(false);
                setWaveformError(true);
                const status = Number((err as any)?.response?.status || 0);
                if (status === 404) {
                    notifyUnavailableOnce();
                }
            });
        return () => {
            cancelled = true;
        };
    }, [src, notifyUnavailableOnce]);

    const togglePlayback = useCallback(() => {
        const a = audioRef.current;
        if (!a) return;
        if (a.paused) {
            void a.play().catch(() => {
                // Autoplay may be blocked; ignore — user just needs to click again.
            });
        } else {
            a.pause();
        }
    }, []);

    const handleSeek = useCallback(
        (ratio: number) => {
            const a = audioRef.current;
            const total = duration;
            if (!a || !total || !isFinite(total)) return;
            const target = Math.max(0, Math.min(total, ratio * total));
            try {
                a.currentTime = target;
                setCurrentTime(target);
            } catch {
                // ignore seek errors
            }
        },
        [duration],
    );

    const progress = useMemo(() => {
        if (!duration || duration <= 0) return 0;
        return Math.min(1, currentTime / duration);
    }, [currentTime, duration]);

    const displayTime =
        isPlaying && duration > 0
            ? Math.min(duration, currentTime)
            : duration || currentTime;

    const inactiveColor = isMine ? 'rgba(255, 255, 255, 0.55)' : '#94a3b8';
    const activeColor = isMine ? '#ffffff' : '#fb923c';
    const buttonClass = isMine
        ? 'bg-white/20 text-white hover:bg-white/30'
        : 'bg-slate-600 text-indigo-200 hover:text-white hover:bg-slate-500';
    const timeClass = isMine ? 'text-orange-50/90' : 'text-slate-300';

    return (
        <div
            className="flex items-center gap-2 min-w-[14rem] max-w-[22rem]"
            aria-label={t('chat.voice.messageLabel')}
        >
            <button
                type="button"
                onClick={togglePlayback}
                aria-label={isPlaying ? t('chat.voice.pause') : t('chat.voice.play')}
                aria-pressed={isPlaying}
                className={[
                    'inline-flex items-center justify-center h-9 w-9 rounded-full shrink-0',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300',
                    buttonClass,
                ].join(' ')}
            >
                {isPlaying ? <FaPause size={13} /> : <FaPlay size={13} />}
            </button>

            {waveformError ? (
                <audio
                    ref={audioRef}
                    src={src}
                    controls
                    preload="metadata"
                    onError={notifyUnavailableOnce}
                    className="flex-1 max-w-full"
                    aria-label={t('chat.voice.messageLabel')}
                />
            ) : (
                <>
                    <Waveform
                        levels={bars}
                        progress={progress}
                        onSeek={handleSeek}
                        ariaLabel={t('chat.voice.preview')}
                        color={inactiveColor}
                        activeColor={activeColor}
                        height={28}
                    />
                    <span
                        className={`text-[11px] tabular-nums shrink-0 ${timeClass}`}
                        aria-live="off"
                    >
                        {loadingWave && duration === 0 ? '--:--' : formatDuration(displayTime)}
                    </span>
                    <audio
                        ref={audioRef}
                        src={src}
                        preload="metadata"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => {
                            setIsPlaying(false);
                            setCurrentTime(0);
                            const a = audioRef.current;
                            if (a) {
                                try {
                                    a.currentTime = 0;
                                } catch {
                                    // ignore
                                }
                            }
                        }}
                        onLoadedMetadata={(e) => {
                            const d = (e.currentTarget.duration);
                            if (isFinite(d) && d > 0) setDuration(d);
                        }}
                        onDurationChange={(e) => {
                            const d = e.currentTarget.duration;
                            if (isFinite(d) && d > 0) setDuration(d);
                        }}
                        onTimeUpdate={(e) => {
                            const t = e.currentTarget.currentTime;
                            if (isFinite(t)) setCurrentTime(t);
                        }}
                        onError={notifyUnavailableOnce}
                        className="hidden"
                    />
                </>
            )}
        </div>
    );
};

export default VoiceMessagePlayer;
