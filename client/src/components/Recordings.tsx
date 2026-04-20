import { useTranslation } from 'react-i18next';
import { FaMicrophoneAlt } from 'react-icons/fa';

const Recordings = () => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-label={t('chat.recordVoice')}
      className="inline-flex items-center justify-center h-11 w-11 rounded-md bg-slate-700 text-indigo-300 hover:bg-slate-600 hover:text-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
    >
      <FaMicrophoneAlt size={20} />
    </button>
  );
};

export default Recordings;
