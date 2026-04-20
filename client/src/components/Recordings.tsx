import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaMicrophoneAlt, FaPlay, FaPause } from 'react-icons/fa';
import { FiSend, FiTrash2, FiSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useUser } from '../context/useUser';
import { useChat } from '../context/useChat';
import Waveform, { buildPreviewBars, formatDuration } from './ui/Waveform';

type RecorderMode = 'idle' | 'recording' | 'preview' | 'uploading';

const LIVE_BAR_COUNT = 40;
const PREVIEW_BAR_COUNT = 48;
const MAX_RECORDING_SECONDS = 300;

const pickMimeType = (): string | undefined => {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return undefined;
};

const extensionFor = (mime: string | undefined): string => {
  if (!mime) return 'webm';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4')) return 'm4a';
  return 'webm';
};

const Recordings = () => {
  const { t } = useTranslation();
  const userCtx = useUser();
  const chat = useChat();

  const [mode, setMode] = useState<RecorderMode>('idle');
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveBars, setLiveBars] = useState<number[]>(() => new Array(LIVE_BAR_COUNT).fill(0));
  const [previewBars, setPreviewBars] = useState<number[]>([]);
  const [playbackTime, setPlaybackTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const mimeRef = useRef<string | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const liveBarsRef = useRef<number[]>(new Array(LIVE_BAR_COUNT).fill(0));
  const samplesRef = useRef<number[]>([]);
  const lastSampleTimeRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);
  const recordedDurationRef = useRef<number>(0);

  const stopStream = () => {
    const s = streamRef.current;
    if (s) s.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopAnalyser = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try { sourceRef.current?.disconnect(); } catch (_) {}
    sourceRef.current = null;
    analyserRef.current = null;
    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    if (ctx && ctx.state !== 'closed') {
      void ctx.close().catch(() => {});
    }
  };

  const resetState = () => {
    clearTimer();
    stopAnalyser();
    stopStream();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setBlob(null);
    setDuration(0);
    setPlaybackTime(0);
    setIsPlaying(false);
    setLiveBars(new Array(LIVE_BAR_COUNT).fill(0));
    setPreviewBars([]);
    liveBarsRef.current = new Array(LIVE_BAR_COUNT).fill(0);
    samplesRef.current = [];
    recordedDurationRef.current = 0;
    setMode('idle');
  };

  useEffect(() => {
    return () => {
      clearTimer();
      stopAnalyser();
      stopStream();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAnalyser = (stream: MediaStream) => {
    const AudioCtxCtor: typeof AudioContext | undefined =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxCtor) return;
    const audioCtx = new AudioCtxCtor();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.4;
    analyserRef.current = analyser;
    source.connect(analyser);

    const buf = new Uint8Array(analyser.fftSize);
    liveBarsRef.current = new Array(LIVE_BAR_COUNT).fill(0);
    samplesRef.current = [];
    lastSampleTimeRef.current = 0;
    lastRenderTimeRef.current = 0;

    const loop = (now: number) => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      const level = Math.min(1, rms * 1.9);

      const shifted = liveBarsRef.current.slice(1);
      shifted.push(level);
      liveBarsRef.current = shifted;

      if (now - lastRenderTimeRef.current >= 33) {
        setLiveBars([...shifted]);
        lastRenderTimeRef.current = now;
      }
      if (now - lastSampleTimeRef.current >= 80) {
        samplesRef.current.push(level);
        lastSampleTimeRef.current = now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error(t('chat.voice.unsupported'));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      mimeRef.current = mimeType;
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = mimeRef.current || recorder.mimeType || 'audio/webm';
        const finalBlob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(finalBlob);
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        recordedDurationRef.current = elapsed;
        setBlob(finalBlob);
        setBlobUrl(url);
        setDuration(elapsed);
        setPreviewBars(buildPreviewBars(samplesRef.current.slice(), PREVIEW_BAR_COUNT));
        setPlaybackTime(0);
        clearTimer();
        stopAnalyser();
        stopStream();
        setMode('preview');
      };

      startAnalyser(stream);

      recorder.start(250);
      startTimeRef.current = Date.now();
      setDuration(0);
      setMode('recording');
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 200);
    } catch (err) {
      console.error('getUserMedia failed', err);
      toast.error(t('chat.voice.micDenied'));
      resetState();
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch (err) {
        console.error('recorder.stop failed', err);
        resetState();
      }
    } else {
      resetState();
    }
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null as any;
      try { recorder.stop(); } catch (_) {}
    }
    resetState();
  };

  const togglePlayback = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
    } else {
      a.pause();
    }
  };

  const handleTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    const t = a.currentTime;
    if (isFinite(t)) setPlaybackTime(t);
  };

  const handleSeek = (ratio: number) => {
    const a = audioRef.current;
    const total = recordedDurationRef.current || duration;
    if (!a || total <= 0) return;
    const target = Math.max(0, Math.min(total, ratio * total));
    try {
      a.currentTime = target;
      setPlaybackTime(target);
    } catch (_) {
      // ignore seek errors on streams with unknown duration
    }
  };

  const sendVoice = async () => {
    const myId = userCtx?.user?._id;
    const otherId = chat?.selectedUser?._id;
    if (!blob || !myId || !otherId) {
      toast.error(t('common.error'));
      return;
    }
    const baseUrl = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:3000';
    const url = `${baseUrl}/message/sendVoice`;
    const form = new FormData();
    const ext = extensionFor(mimeRef.current || blob.type);
    form.append('audio', blob, `voice-${Date.now()}.${ext}`);
    form.append('receiver', otherId);

    setMode('uploading');
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      resetState();
    } catch (err) {
      console.error('voice upload failed', err);
      toast.error(t('chat.voice.uploadFailed'));
      setMode('preview');
    }
  };

  if (mode === 'idle') {
    return (
      <button
        type="button"
        onClick={startRecording}
        aria-label={t('chat.recordVoice')}
        className="inline-flex items-center justify-center h-11 w-11 rounded-md bg-slate-700 text-indigo-300 hover:bg-slate-600 hover:text-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        <FaMicrophoneAlt size={20} />
      </button>
    );
  }

  if (mode === 'recording') {
    return (
      <div
        role="group"
        aria-label={t('chat.voice.recording')}
        className="absolute inset-0 z-10 flex items-center gap-2 h-11 px-3 rounded-md bg-slate-700 border border-slate-600 min-w-0"
      >
        <button
          type="button"
          onClick={cancelRecording}
          aria-label={t('chat.voice.cancel')}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-300 hover:text-red-400 shrink-0"
        >
          <FiTrash2 size={18} />
        </button>
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
        <span className="text-slate-100 text-sm tabular-nums shrink-0" aria-live="polite">
          {formatDuration(duration)}
        </span>
        <Waveform levels={liveBars} color="#fca5a5" ariaLabel={t('chat.voice.recording')} />
        <button
          type="button"
          onClick={stopRecording}
          aria-label={t('chat.voice.stop')}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-orange-500 text-white hover:bg-orange-400 shrink-0"
        >
          <FiSquare size={16} />
        </button>
      </div>
    );
  }

  const uploading = mode === 'uploading';
  const total = recordedDurationRef.current || duration;
  const progress = total > 0 ? Math.min(1, playbackTime / total) : 0;
  const displayTime = isPlaying ? playbackTime : total;

  return (
    <div
      role="group"
      aria-label={t('chat.voice.preview')}
      className="absolute inset-0 z-10 flex items-center gap-2 h-11 px-3 rounded-md bg-slate-700 border border-slate-600 min-w-0"
    >
      <button
        type="button"
        onClick={cancelRecording}
        disabled={uploading}
        aria-label={t('chat.voice.discard')}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-300 hover:text-red-400 disabled:opacity-50 shrink-0"
      >
        <FiTrash2 size={18} />
      </button>
      <button
        type="button"
        onClick={togglePlayback}
        disabled={uploading || !blobUrl}
        aria-label={isPlaying ? t('chat.voice.pause') : t('chat.voice.play')}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-slate-600 text-indigo-200 hover:text-white disabled:opacity-50 shrink-0"
      >
        {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} />}
      </button>
      <Waveform
        levels={previewBars}
        progress={progress}
        onSeek={uploading ? undefined : handleSeek}
        ariaLabel={t('chat.voice.preview')}
      />
      <span className="text-slate-100 text-sm tabular-nums shrink-0">
        {formatDuration(displayTime)}
      </span>
      {blobUrl && (
        <audio
          ref={audioRef}
          src={blobUrl}
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setPlaybackTime(0);
          }}
          onTimeUpdate={handleTimeUpdate}
          className="hidden"
        />
      )}
      <button
        type="button"
        onClick={sendVoice}
        disabled={uploading}
        aria-label={t('chat.voice.send')}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-60 shrink-0"
      >
        <FiSend size={16} />
      </button>
      {uploading && (
        <span className="text-slate-400 text-xs shrink-0" aria-live="polite">
          {t('chat.voice.uploading')}
        </span>
      )}
    </div>
  );
};

export default Recordings;
