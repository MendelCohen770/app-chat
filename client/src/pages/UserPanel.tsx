import React, { useMemo, useState, useRef, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { RxHamburgerMenu } from 'react-icons/rx';
import { LuLogOut, LuUser } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Popover, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useChat } from '../context/useChat';
import { useUser } from '../context/useUser';
import { IUser } from '../models/user';
import { useAsync } from '../hooks/useAsync';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/States';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { logoutUser, resolveMediaUrl } from '../hooks/UseUser';

const DEFAULT_AVATAR = 'https://www.prtfl.co.il/wp-content/uploads/2023/11/WhatsApp-Image-2023-11-20-at-14.19.59-1.jpg';

const fetchUsers = async (): Promise<IUser[]> => {
  const baseUrl = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/user/getAllUsers`, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json?.isSuccessful || !json?.data) throw new Error(json?.displayMessage || 'Failed');
  return json.data as IUser[];
};

const UserPanel = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userContext = useUser();
  const currentUser = userContext?.user as IUser | null;
  const [searchInput, setSearchInput] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const isMenuOpen = Boolean(menuAnchor);
  const chatContext = useChat();
  const { data: users, isLoading, isError, refetch } = useAsync<IUser[]>(fetchUsers, { deps: [] });

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const goToProfile = () => {
    closeMenu();
    navigate('/profile');
  };

  const handleLogout = async () => {
    closeMenu();
    const res = await logoutUser();
    if (!res.isSuccessful) {
      toast.error(res.displayMessage || t('profile.messages.logoutFailed'));
    }
    userContext?.logout();
    navigate('/', { replace: true });
  };

  const currentUserAvatar = currentUser?.profileIcon
    ? resolveMediaUrl(currentUser.profileIcon) || DEFAULT_AVATAR
    : DEFAULT_AVATAR;

  const setSelectedUser = chatContext?.setSelectedUser;
  const selectedUser = chatContext?.selectedUser;

  const filtered = useMemo(() => {
    const list = users || [];
    const q = searchInput.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => u.username?.toLowerCase().includes(q));
  }, [users, searchInput]);

  // keyboard navigation between contacts
  const listRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchInput]);

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (!filtered.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min((i < 0 ? -1 : i) + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(filtered.length - 1);
    } else if ((e.key === 'Enter' || e.key === ' ') && activeIndex >= 0) {
      e.preventDefault();
      const user = filtered[activeIndex];
      if (user && setSelectedUser) setSelectedUser(user);
    }
  };

  const renderList = () => {
    if (isLoading) return <LoadingState title={t('chat.loadingContacts')} />;
    if (isError) return <ErrorState title={t('chat.contactsError')} onRetry={refetch} />;
    if (!filtered.length) {
      return (
        <EmptyState
          title={searchInput ? t('chat.noContactsMatch') : t('chat.noContacts')}
        />
      );
    }

    return (
      <ul
        ref={listRef}
        role="listbox"
        aria-label={t('chat.contactList')}
        aria-activedescendant={activeIndex >= 0 ? `contact-${filtered[activeIndex]?._id}` : undefined}
        tabIndex={0}
        onKeyDown={handleListKeyDown}
        className="flex flex-col gap-0.5 p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-md"
      >
        {filtered.map((user, idx) => {
          const isSelected = selectedUser?._id === user._id;
          const isActive = idx === activeIndex;
          return (
            <li key={user._id}>
              <button
                id={`contact-${user._id}`}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => setSelectedUser && setSelectedUser(user)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={[
                  'w-full flex items-center p-3 rounded-lg transition-colors text-start',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400',
                  isSelected
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : isActive
                    ? 'bg-slate-700 text-slate-100'
                    : 'hover:bg-slate-800 text-slate-100',
                ].join(' ')}
              >
                <img
                  src={resolveMediaUrl(user.profileIcon) || DEFAULT_AVATAR}
                  alt=""
                  aria-hidden="true"
                  className="w-12 h-12 rounded-full me-3 object-cover bg-slate-700"
                />
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="text-base font-semibold truncate">{user.username}</span>
                  <span
                    className={[
                      'text-xs truncate',
                      isSelected ? 'text-slate-100' : 'text-slate-400',
                    ].join(' ')}
                  >
                    {t('common.online')}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="bg-slate-900 w-full h-full flex flex-col min-h-0 select-none">
      <div className="flex items-center gap-2 p-3 border-b border-slate-800">
        <button
          type="button"
          aria-label={t('chat.more')}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={openMenu}
          className="inline-flex items-center justify-center h-10 w-10 rounded-md text-slate-300 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <RxHamburgerMenu size={22} />
        </button>
        <button
          type="button"
          aria-label={t('profile.openProfile')}
          onClick={() => navigate('/profile')}
          className="inline-flex items-center justify-center h-10 w-10 rounded-full overflow-hidden hover:ring-2 hover:ring-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <img
            src={currentUserAvatar}
            alt=""
            aria-hidden="true"
            className="w-10 h-10 rounded-full object-cover bg-slate-700"
          />
        </button>
        <Popover
          open={isMenuOpen}
          anchorEl={menuAnchor}
          onClose={closeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                minWidth: 200,
                padding: 1,
                mt: 0.5,
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                borderRadius: 2,
                border: '1px solid #334155',
              },
            },
          }}
        >
          <List role="menu">
            <ListItemButton role="menuitem" onClick={goToProfile}>
              <ListItemIcon sx={{ minWidth: 36, color: '#a5b4fc' }}>
                <LuUser size={20} />
              </ListItemIcon>
              <ListItemText primary={t('profile.openProfile')} />
            </ListItemButton>
            <ListItemButton role="menuitem" onClick={handleLogout}>
              <ListItemIcon sx={{ minWidth: 36, color: '#f87171' }}>
                <LuLogOut size={20} />
              </ListItemIcon>
              <ListItemText primary={t('auth.logout')} />
            </ListItemButton>
          </List>
        </Popover>
        <div role="search" className="flex-1 relative">
          <label htmlFor="contacts-search" className="sr-only">
            {t('chat.search')}
          </label>
          <input
            id="contacts-search"
            type="search"
            className="w-full h-10 rounded-2xl bg-slate-700 text-white px-4 pe-10 placeholder:text-slate-400 border border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            placeholder={t('chat.search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              aria-label={t('chat.clearSearch')}
              onClick={() => setSearchInput('')}
              className="absolute end-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-300 hover:text-white hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <IoClose size={20} />
            </button>
          )}
        </div>
        <LanguageSwitcher className="hidden sm:flex" />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">{renderList()}</div>
    </div>
  );
};

export default UserPanel;
