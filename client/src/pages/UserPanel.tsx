import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { RxHamburgerMenu } from 'react-icons/rx';
import { LuLogOut, LuUser } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Button,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useChat } from '../context/useChat';
import { useUser } from '../context/useUser';
import { usePresence } from '../context/usePresence';
import { IUser } from '../models/user';
import { ConversationType, IConversation } from '../models/conversation';
import { UserListSkeleton, EmptyState, ErrorState } from '../components/ui/States';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { logoutUser, resolveMediaUrl } from '../hooks/UseUser';
import apiClient from '../service/apiClient';

const DEFAULT_AVATAR = 'https://www.prtfl.co.il/wp-content/uploads/2023/11/WhatsApp-Image-2023-11-20-at-14.19.59-1.jpg';
const USERS_PAGE_SIZE = 20;

type UsersPage = {
  items: IUser[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

type GroupConversation = IConversation;

const fetchUsersPage = async (page: number, limit: number): Promise<UsersPage> => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await apiClient.get(`/user/getAllUsers?${params.toString()}`);
  const json: any = res.data;
  if (!json?.isSuccessful || !json?.data) throw new Error(json?.displayMessage || 'Failed');
  const data = json.data;
  return {
    items: Array.isArray(data.items) ? (data.items as IUser[]) : [],
    total: Number.isFinite(data.total) ? data.total : 0,
    page: Number.isFinite(data.page) ? data.page : page,
    limit: Number.isFinite(data.limit) ? data.limit : limit,
    hasMore: Boolean(data.hasMore),
  };
};

const fetchConversations = async (): Promise<IConversation[]> => {
  const res = await apiClient.get('/conversation/list');
  const json: any = res.data;
  const data = Array.isArray(json?.data) ? json.data : [];
  return data as IConversation[];
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
  const { isOnline } = usePresence();

  const [users, setUsers] = useState<IUser[]>([]);
  const [groupConversations, setGroupConversations] = useState<GroupConversation[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('loading');
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [groupsStatus, setGroupsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('loading');
  const [createGroupOpen, setCreateGroupOpen] = useState<boolean>(false);
  const [manageGroupId, setManageGroupId] = useState<string | null>(null);
  const [groupNameDraft, setGroupNameDraft] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [updatingGroup, setUpdatingGroup] = useState<boolean>(false);
  const isLoading = status === 'loading';
  const isError = status === 'error';

  const loadFirstPage = useCallback(async () => {
    setStatus('loading');
    try {
      const first = await fetchUsersPage(1, USERS_PAGE_SIZE);
      setUsers(first.items);
      setPage(first.page);
      setHasMore(first.hasMore);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadConversations = useCallback(async () => {
    setGroupsStatus('loading');
    try {
      const list = await fetchConversations();
      const groups = list.filter(
        (conversation) => String(conversation.type) === ConversationType.group,
      ) as GroupConversation[];
      setGroupConversations(groups);
      setGroupsStatus('success');
    } catch {
      setGroupsStatus('error');
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const next = await fetchUsersPage(page + 1, USERS_PAGE_SIZE);
      setUsers((prev) => {
        const existing = new Set(prev.map((u) => u._id));
        return [...prev, ...next.items.filter((u) => !existing.has(u._id))];
      });
      setPage(next.page);
      setHasMore(next.hasMore);
    } catch {
      toast.error(t('chat.contactsError'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, page, t]);

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
  const setSelectedConversation = chatContext?.setSelectedConversation;
  const selectedConversation = chatContext?.selectedConversation;

  const filtered = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.username?.toLowerCase().includes(q));
  }, [users, searchInput]);

  const filteredGroups = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return groupConversations;
    return groupConversations.filter((group) => (group.name || '').toLowerCase().includes(q));
  }, [groupConversations, searchInput]);

  const managedGroup = useMemo(
    () => groupConversations.find((group) => group._id === manageGroupId) || null,
    [groupConversations, manageGroupId],
  );

  const createGroup = async () => {
    if (!groupNameDraft.trim() || selectedMemberIds.length === 0) {
      toast.error(t('chat.groups.createValidation'));
      return;
    }
    setUpdatingGroup(true);
    try {
      await apiClient.post('/conversation/groups', {
        name: groupNameDraft.trim(),
        participantIds: selectedMemberIds,
      });
      setCreateGroupOpen(false);
      setGroupNameDraft('');
      setSelectedMemberIds([]);
      await loadConversations();
      toast.success(t('chat.groups.createSuccess'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setUpdatingGroup(false);
    }
  };

  const addMembersToGroup = async () => {
    if (!managedGroup || selectedMemberIds.length === 0) return;
    setUpdatingGroup(true);
    try {
      await apiClient.post(`/conversation/groups/${managedGroup._id}/members`, {
        participantIds: selectedMemberIds,
      });
      setSelectedMemberIds([]);
      await loadConversations();
      toast.success(t('chat.groups.membersUpdated'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setUpdatingGroup(false);
    }
  };

  const removeMemberFromGroup = async (groupId: string, memberId: string) => {
    setUpdatingGroup(true);
    try {
      await apiClient.delete(`/conversation/groups/${groupId}/members/${memberId}`);
      await loadConversations();
      toast.success(t('chat.groups.membersUpdated'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setUpdatingGroup(false);
    }
  };

  // keyboard navigation between contacts
  const listRef = useRef<HTMLUListElement>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!hasMore || isLoadingMore || searchInput.trim()) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      { root: null, threshold: 0.1, rootMargin: '120px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, searchInput, loadMore]);

  const renderList = () => {
    if (isLoading) return <UserListSkeleton />;
    if (isError) {
      return (
        <ErrorState
          title={t('chat.contactsError')}
          onRetry={loadFirstPage}
          className="m-3"
        />
      );
    }
    if (!filtered.length && !filteredGroups.length) {
      return (
        <EmptyState
          title={searchInput ? t('chat.noContactsMatch') : t('chat.noContacts')}
        />
      );
    }

    return (
      <>
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
          const isSelected = !selectedConversation && selectedUser?._id === user._id;
          const isActive = idx === activeIndex;
          const userOnline = isOnline(user._id);
          const statusLabel = userOnline ? t('common.online') : t('common.offline');
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
                <span className="relative inline-block me-3">
                  <img
                    src={resolveMediaUrl(user.profileIcon) || DEFAULT_AVATAR}
                    alt=""
                    aria-hidden="true"
                    className="w-12 h-12 rounded-full object-cover bg-slate-700"
                  />
                  <span
                    aria-hidden="true"
                    className={[
                      'absolute bottom-0 end-0 block w-3.5 h-3.5 rounded-full ring-2',
                      isSelected ? 'ring-blue-600' : 'ring-slate-900',
                      userOnline ? 'bg-emerald-500' : 'bg-slate-500',
                    ].join(' ')}
                  />
                </span>
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="text-base font-semibold truncate">{user.username}</span>
                  <span
                    className={[
                      'text-xs truncate',
                      isSelected
                        ? 'text-slate-100'
                        : userOnline
                        ? 'text-emerald-400'
                        : 'text-slate-400',
                    ].join(' ')}
                  >
                    {statusLabel}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="px-2 pb-2">
        <div className="mb-2 mt-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-slate-400">{t('chat.groups.title')}</span>
          <button
            type="button"
            onClick={() => {
              setCreateGroupOpen(true);
              setSelectedMemberIds([]);
              setGroupNameDraft('');
            }}
            className="rounded-md bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-500"
          >
            {t('chat.groups.create')}
          </button>
        </div>
        {groupsStatus === 'error' && (
          <button
            type="button"
            onClick={loadConversations}
            className="w-full rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            {t('chat.groups.retryLoad')}
          </button>
        )}
        {groupsStatus !== 'error' &&
          filteredGroups.map((group) => {
            const isSelected = selectedConversation?._id === group._id;
            const canManage = Boolean(group.isAdmin);
            return (
              <div key={group._id} className="mb-1 rounded-md border border-slate-700 p-2">
                <button
                  type="button"
                  onClick={() => setSelectedConversation && setSelectedConversation(group)}
                  className={[
                    'w-full rounded-md px-2 py-1 text-start text-sm',
                    isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-100',
                  ].join(' ')}
                >
                  <div className="font-medium truncate">{group.name || t('chat.groups.unnamed')}</div>
                  <div className="text-xs text-slate-300">
                    {t('chat.groups.membersCount', { count: group.participants?.length || 0 })}
                  </div>
                </button>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setManageGroupId(group._id);
                      setSelectedMemberIds([]);
                    }}
                    className="mt-2 w-full rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    {t('chat.groups.manageMembers')}
                  </button>
                )}
              </div>
            );
          })}
      </div>
      {hasMore && !searchInput && (
        <div ref={loadMoreRef} className="flex justify-center p-2">
          <span className="text-xs text-slate-400" aria-live="polite">
            {isLoadingMore ? t('chat.loadingContacts') : t('chat.loadMoreContacts')}
          </span>
        </div>
      )}
      </>
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

      <Dialog open={createGroupOpen} onClose={() => setCreateGroupOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('chat.groups.createTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label={t('chat.groups.groupName')}
            value={groupNameDraft}
            onChange={(e) => setGroupNameDraft(e.target.value)}
          />
          <div className="mt-3 max-h-64 overflow-y-auto rounded border border-slate-200 p-2">
            {users
              .filter((user) => user._id !== currentUser?._id)
              .map((user) => (
                <FormControlLabel
                  key={user._id}
                  control={
                    <Checkbox
                      checked={selectedMemberIds.includes(user._id)}
                      onChange={(e) => {
                        setSelectedMemberIds((prev) =>
                          e.target.checked ? [...prev, user._id] : prev.filter((id) => id !== user._id),
                        );
                      }}
                    />
                  }
                  label={user.username}
                />
              ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateGroupOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={createGroup} disabled={updatingGroup}>
            {t('chat.groups.create')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(managedGroup)} onClose={() => setManageGroupId(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('chat.groups.manageMembers')}</DialogTitle>
        <DialogContent>
          <div className="mb-3 flex flex-wrap gap-2">
            {managedGroup?.participants?.map((member: { _id: string; username: string }) => (
              <Chip
                key={member._id}
                label={member.username}
                onDelete={
                  managedGroup?.isAdmin && member._id !== currentUser?._id
                    ? () => removeMemberFromGroup(managedGroup._id, member._id)
                    : undefined
                }
              />
            ))}
          </div>
          <div className="max-h-56 overflow-y-auto rounded border border-slate-200 p-2">
            {users
              .filter((user) =>
                !(managedGroup?.participants || []).some(
                  (member: { _id: string; username: string }) => member._id === user._id,
                ),
              )
              .map((user) => (
                <FormControlLabel
                  key={user._id}
                  control={
                    <Checkbox
                      checked={selectedMemberIds.includes(user._id)}
                      onChange={(e) => {
                        setSelectedMemberIds((prev) =>
                          e.target.checked ? [...prev, user._id] : prev.filter((id) => id !== user._id),
                        );
                      }}
                    />
                  }
                  label={user.username}
                />
              ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageGroupId(null)}>{t('common.close')}</Button>
          <Button
            variant="contained"
            onClick={addMembersToGroup}
            disabled={updatingGroup || selectedMemberIds.length === 0 || !managedGroup?.isAdmin}
          >
            {t('chat.groups.addMembers')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserPanel;
