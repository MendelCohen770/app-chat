import React, { useRef, useState } from 'react';
import { IconButton, List, ListItemButton, ListItemIcon, ListItemText, Popover } from '@mui/material';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import { AttachFile } from '@mui/icons-material';
import { VideoIcon } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';
import { MdOutlineClose } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useUser } from '../context/useUser';
import { useChat } from '../context/useChat';
import { API_BASE_URL } from '../config/env';

type UploadKind = 'image' | 'video' | 'file';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // must stay in sync with server limit

const MediaUploader: React.FC = () => {
  const { t } = useTranslation();
  const userCtx = useUser();
  const chat = useChat();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [uploading, setUploading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isOpen = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const pickFile = (kind: UploadKind) => {
    handleClose();
    if (uploading) return;
    const ref =
      kind === 'image' ? imageInputRef : kind === 'video' ? videoInputRef : fileInputRef;
    const input = ref.current;
    if (!input) return;
    input.value = '';
    input.click();
  };

  const validateFile = (file: File, kind: UploadKind): string | null => {
    if (file.size > MAX_UPLOAD_BYTES) {
      return t('chat.media.tooLarge');
    }
    const mime = (file.type || '').toLowerCase();
    if (kind === 'image' && !mime.startsWith('image/')) {
      return t('chat.media.invalidType');
    }
    if (kind === 'video' && !mime.startsWith('video/')) {
      return t('chat.media.invalidType');
    }
    return null;
  };

  const uploadFile = async (file: File, kind: UploadKind) => {
    const myId = userCtx?.user?._id;
    const otherId = chat?.selectedUser?._id;
    if (!myId || !otherId) {
      toast.error(t('common.error'));
      return;
    }
    const error = validateFile(file, kind);
    if (error) {
      toast.error(error);
      return;
    }

    const url = `${API_BASE_URL}/message/sendMedia`;
    const form = new FormData();
    form.append('media', file, file.name);
    form.append('receiver', otherId);
    form.append('type', kind);
    if (kind === 'file' && file.name) {
      form.append('content', file.name);
    }

    setUploading(true);
    const toastId = toast.loading(t('chat.media.uploading'));
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(t('chat.media.uploaded'), { id: toastId });
    } catch (err) {
      console.error('media upload failed', err);
      toast.error(t('chat.media.uploadFailed'), { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (kind: UploadKind) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    void uploadFile(file, kind);
  };

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange('image')}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleChange('video')}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange('file')}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <IconButton
        onClick={handleClick}
        aria-label={t('chat.attach')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        disabled={uploading}
        className="!h-11 !w-11 !rounded-md !bg-slate-700 hover:!bg-slate-600"
        sx={{
          height: 44,
          width: 44,
          borderRadius: '6px',
          backgroundColor: '#334155',
          color: '#a5b4fc',
          '&:hover': { backgroundColor: '#475569', color: '#c7d2fe' },
          '&.Mui-disabled': { opacity: 0.6, color: '#a5b4fc' },
        }}
      >
        {isOpen ? <MdOutlineClose size={22} /> : <LuPlus size={22} />}
      </IconButton>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              padding: 1,
              mt: -1,
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              borderRadius: 2,
              border: '1px solid #334155',
            },
          },
        }}
      >
        <List role="menu">
          <ListItemButton role="menuitem" onClick={() => pickFile('image')} disabled={uploading}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <InsertPhotoIcon className="text-purple-400" />
            </ListItemIcon>
            <ListItemText primary={t('chat.attachImage')} />
          </ListItemButton>
          <ListItemButton role="menuitem" onClick={() => pickFile('file')} disabled={uploading}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <AttachFile className="text-amber-400" />
            </ListItemIcon>
            <ListItemText primary={t('chat.attachFile')} />
          </ListItemButton>
          <ListItemButton role="menuitem" onClick={() => pickFile('video')} disabled={uploading}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <VideoIcon className="text-green-400" />
            </ListItemIcon>
            <ListItemText primary={t('chat.attachVideo')} />
          </ListItemButton>
        </List>
      </Popover>
    </>
  );
};

export default MediaUploader;
