import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GoSearch } from 'react-icons/go';
import { IoCallOutline } from 'react-icons/io5';
import { IoMdMore } from 'react-icons/io';
import { MdArrowDownward, MdClose, MdSearchOff } from 'react-icons/md';
import { List, ListItemButton, ListItemIcon, ListItemText, Popover } from '@mui/material';
import { useChat } from '../context/useChat';
import CallModal from './CallModal';

const iconBtn =
  'inline-flex items-center justify-center h-10 w-10 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed';

const ChatActions: React.FC = () => {
  const { t } = useTranslation();
  const chat = useChat();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [callOpen, setCallOpen] = useState<boolean>(false);

  const menuOpen = Boolean(menuAnchor);
  const disabled = !chat?.selectedUser;

  const handleToggleSearch = () => {
    if (!chat) return;
    if (chat.searchOpen) {
      chat.closeSearch();
    } else {
      chat.openSearch();
    }
  };

  const handleOpenCall = () => {
    if (disabled) return;
    setCallOpen(true);
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => setMenuAnchor(null);

  const handleCloseChat = () => {
    handleCloseMenu();
    chat?.setSelectedUser(null);
  };

  const handleScrollToBottom = () => {
    handleCloseMenu();
    chat?.requestScrollToBottom();
  };

  const handleClearSearch = () => {
    handleCloseMenu();
    chat?.closeSearch();
  };

  const contactName = chat?.selectedUser?.username || t('common.unknown');
  const contactAvatar = chat?.selectedUser?.profileIcon;
  const isSearchActive = Boolean(chat?.searchOpen || chat?.searchQuery);

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={handleToggleSearch}
        disabled={disabled}
        aria-label={
          chat?.searchOpen ? t('chat.searchInChat.close') : t('chat.searchInChat.open')
        }
        aria-pressed={Boolean(chat?.searchOpen)}
        className={iconBtn}
      >
        {chat?.searchOpen ? <MdClose size={20} /> : <GoSearch size={18} />}
      </button>

      <button
        type="button"
        onClick={handleOpenCall}
        disabled={disabled}
        aria-label={t('chat.call')}
        className={iconBtn}
      >
        <IoCallOutline size={20} />
      </button>

      <button
        type="button"
        onClick={handleOpenMenu}
        disabled={disabled}
        aria-label={t('chat.more')}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className={iconBtn}
      >
        <IoMdMore size={22} />
      </button>

      <Popover
        open={menuOpen}
        anchorEl={menuAnchor}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 220,
              padding: 1,
              mt: 1,
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              borderRadius: 2,
              border: '1px solid #334155',
            },
          },
        }}
      >
        <List role="menu" dense>
          <ListItemButton role="menuitem" onClick={handleScrollToBottom}>
            <ListItemIcon sx={{ minWidth: 36, color: '#a5b4fc' }}>
              <MdArrowDownward size={20} />
            </ListItemIcon>
            <ListItemText primary={t('chat.menu.scrollToBottom')} />
          </ListItemButton>

          {isSearchActive && (
            <ListItemButton role="menuitem" onClick={handleClearSearch}>
              <ListItemIcon sx={{ minWidth: 36, color: '#fbbf24' }}>
                <MdSearchOff size={20} />
              </ListItemIcon>
              <ListItemText primary={t('chat.menu.clearSearch')} />
            </ListItemButton>
          )}

          <ListItemButton role="menuitem" onClick={handleCloseChat}>
            <ListItemIcon sx={{ minWidth: 36, color: '#f87171' }}>
              <MdClose size={20} />
            </ListItemIcon>
            <ListItemText primary={t('chat.menu.closeChat')} />
          </ListItemButton>
        </List>
      </Popover>

      <CallModal
        open={callOpen}
        onClose={() => setCallOpen(false)}
        contactName={contactName}
        contactAvatar={contactAvatar}
      />
    </div>
  );
};

export default ChatActions;
