import React, { useState } from 'react';
import { IconButton, List, ListItemButton, ListItemIcon, ListItemText, Popover } from '@mui/material';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import { AttachFile } from '@mui/icons-material';
import { VideoIcon } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';
import { MdOutlineClose } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

const MediaUploader: React.FC = () => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton
        onClick={handleClick}
        aria-label={t('chat.attach')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="!h-11 !w-11 !rounded-md !bg-slate-700 hover:!bg-slate-600"
        sx={{
          height: 44,
          width: 44,
          borderRadius: '6px',
          backgroundColor: '#334155',
          color: '#a5b4fc',
          '&:hover': { backgroundColor: '#475569', color: '#c7d2fe' },
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
          <ListItemButton role="menuitem" onClick={handleClose}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <InsertPhotoIcon className="text-purple-400" />
            </ListItemIcon>
            <ListItemText primary={t('chat.attachImage')} />
          </ListItemButton>
          <ListItemButton role="menuitem" onClick={handleClose}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <AttachFile className="text-amber-400" />
            </ListItemIcon>
            <ListItemText primary={t('chat.attachFile')} />
          </ListItemButton>
          <ListItemButton role="menuitem" onClick={handleClose}>
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
