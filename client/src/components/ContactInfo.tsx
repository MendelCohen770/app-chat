import { useTranslation } from 'react-i18next';
import { useChat } from '../context/useChat';

const DEFAULT_AVATAR = 'https://www.prtfl.co.il/wp-content/uploads/2023/11/WhatsApp-Image-2023-11-20-at-14.19.59-1.jpg';

const ContactInfo = () => {
  const { t } = useTranslation();
  const chatContext = useChat();
  const selectedUser = chatContext?.selectedUser;

  return (
    <div className="flex items-center p-2 h-full cursor-pointer flex-1 min-w-0">
      <img
        src={selectedUser?.profileIcon || DEFAULT_AVATAR}
        alt=""
        aria-hidden="true"
        className="w-10 h-10 rounded-full me-3 object-cover bg-slate-700"
      />
      <div className="flex flex-col min-w-0">
        <span className="text-base font-semibold text-slate-100 truncate">
          {selectedUser?.username || t('common.unknown')}
        </span>
        <span className="text-xs text-slate-400 truncate">{t('common.online')}</span>
      </div>
    </div>
  );
};

export default ContactInfo;
