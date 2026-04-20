import { useTranslation } from 'react-i18next';
import { GoSearch } from 'react-icons/go';
import { IoCallOutline } from 'react-icons/io5';
import { IoMdMore } from 'react-icons/io';

const iconBtn =
  'inline-flex items-center justify-center h-10 w-10 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400';

const ChatActions = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center">
      <button type="button" aria-label={t('common.search')} className={iconBtn}>
        <GoSearch size={18} />
      </button>
      <button type="button" aria-label={t('chat.call')} className={iconBtn}>
        <IoCallOutline size={20} />
      </button>
      <button type="button" aria-label={t('chat.more')} className={iconBtn}>
        <IoMdMore size={22} />
      </button>
    </div>
  );
};

export default ChatActions;
