import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoCallOutline, IoClose } from 'react-icons/io5';
import { MdCallEnd } from 'react-icons/md';
import { resolveMediaUrl } from '../hooks/UseUser';

const DEFAULT_AVATAR =
  'https://www.prtfl.co.il/wp-content/uploads/2023/11/WhatsApp-Image-2023-11-20-at-14.19.59-1.jpg';

interface CallModalProps {
  open: boolean;
  onClose: () => void;
  contactName: string;
  contactAvatar?: string;
}

type CallStage = 'ringing' | 'connecting' | 'in-call';

const formatDuration = (seconds: number): string => {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const ss = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mm}:${ss}`;
};

const CallModal: React.FC<CallModalProps> = ({ open, onClose, contactName, contactAvatar }) => {
  const { t } = useTranslation();
  const [stage, setStage] = useState<CallStage>('ringing');
  const [elapsed, setElapsed] = useState<number>(0);
  const endButtonRef = useRef<HTMLButtonElement | null>(null);

  // Simulate the progression of a call so the UI has a real sense of state
  // even though no WebRTC/signalling is connected yet.
  useEffect(() => {
    if (!open) return;
    setStage('ringing');
    setElapsed(0);
    const ringTimer = window.setTimeout(() => setStage('connecting'), 1800);
    const connectTimer = window.setTimeout(() => setStage('in-call'), 3200);
    return () => {
      window.clearTimeout(ringTimer);
      window.clearTimeout(connectTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!open || stage !== 'in-call') return;
    const interval = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [open, stage]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    endButtonRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const statusText =
    stage === 'ringing'
      ? t('chat.voiceCall.ringing')
      : stage === 'connecting'
        ? t('chat.voiceCall.connecting')
        : formatDuration(elapsed);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('chat.voiceCall.title')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl p-6 text-slate-100"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute top-3 end-3 h-9 w-9 inline-flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <IoClose size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <div className="relative">
            <span
              aria-hidden="true"
              className={[
                'absolute inset-0 rounded-full',
                stage === 'in-call'
                  ? 'bg-emerald-500/30 animate-pulse'
                  : 'bg-orange-500/30 animate-ping',
              ].join(' ')}
            />
            <img
              src={resolveMediaUrl(contactAvatar) || DEFAULT_AVATAR}
              alt=""
              aria-hidden="true"
              className="relative w-24 h-24 rounded-full object-cover border-4 border-slate-700"
            />
          </div>

          <p className="text-xs uppercase tracking-wider text-slate-400">
            {t('chat.voiceCall.title')}
          </p>
          <h2 className="text-xl font-semibold text-white">
            {stage === 'ringing'
              ? t('chat.voiceCall.calling', { name: contactName })
              : contactName}
          </h2>
          <p
            className={[
              'text-sm font-mono',
              stage === 'in-call' ? 'text-emerald-400' : 'text-slate-300',
            ].join(' ')}
            aria-live="polite"
          >
            <IoCallOutline className="inline me-1" size={14} aria-hidden="true" />
            {statusText}
          </p>

          <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
            {t('chat.voiceCall.demoNote')}
          </p>

          <button
            ref={endButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t('chat.voiceCall.end')}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <MdCallEnd size={22} aria-hidden="true" />
            <span>{t('chat.voiceCall.end')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
