import { IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Popover } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import React, { useState } from 'react'
import { LuPlus } from "react-icons/lu";
import { MdOutlineClose } from "react-icons/md";
import { VideoIcon } from 'lucide-react';
import { AttachFile, DarkMode } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';


const MediaUploader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const theme = useTheme();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  //{isOpen ? (<MdOutlineClose size={30} className='text-indigo-700' />) : (<LuPlus size={30} className='text-indigo-700'/>) }

  return (
    <div onClick={() => setIsOpen(!isOpen)} className='cursor-pointer bg-slate-700  w-12 h-12 rounded-lg hover:bg-indigo-500 mr-3 p-0 flex items-center justify-center'>
      <IconButton onClick={handleClick} className='w-full h-full '>
      {isOpen ? (<MdOutlineClose size={35} className='text-indigo-700' />) : (<LuPlus size={35} className='text-indigo-700'/>) }
      </IconButton>
      <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      slotProps={{
        paper: {
          sx: {
            minWidth: 180,
            minHeight: 100,
            padding: 1,
            display: 'flex',
            flexDirection: 'column',
            mt: -2,
            backgroundColor: '#1e293b',
            color: 'gray',
            borderRadius: 2, 
          },
        },
      }}
      >
        <List>
          <ListItemButton  onClick={handleClose}>
            <ListItemIcon><InsertPhotoIcon className='text-purple-500'/></ListItemIcon>
            <ListItemText primary="תמונה"/>
          </ListItemButton>
          <ListItemButton  onClick={handleClose}>
            <ListItemIcon><AttachFile className='text-amber-500'/></ListItemIcon>
            <ListItemText primary="קובץ"/>
          </ListItemButton>
          <ListItemButton  onClick={handleClose} >
            <ListItemIcon><VideoIcon className='text-green-500'/></ListItemIcon>
            <ListItemText primary="סרטון"/>
          </ListItemButton>
        </List>

      </Popover>
    </div>
  )
}

export default MediaUploader
