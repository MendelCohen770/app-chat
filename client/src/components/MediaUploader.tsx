import { IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Popover } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import React, { useState } from 'react'
import { LuPlus } from "react-icons/lu";
import { MdOutlineClose } from "react-icons/md";
import { VideoIcon } from 'lucide-react';
import { AttachFile } from '@mui/icons-material';


const MediaUploader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  //{isOpen ? (<MdOutlineClose size={30} className='text-indigo-700' />) : (<LuPlus size={30} className='text-indigo-700'/>) }

  return (
    <div onClick={() => setIsOpen(!isOpen)} className='cursor-pointer bg-slate-700 p-2 w-12 h-12 rounded-lg hover:bg-indigo-500 mr-3'>
      <IconButton onClick={handleClick}>
        <AddIcon/>
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
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{sx: {minWidth: 180, padding: 1, minHeight: 100, display: 'flex', flexDirection: 'column'}}}
      >
        <List>
          <ListItemButton  onClick={handleClose}>
            <ListItemIcon><InsertPhotoIcon/></ListItemIcon>
            <ListItemText primary="תמונה"/>
          </ListItemButton>
          <ListItemButton  onClick={handleClose}>
            <ListItemIcon><AttachFile/></ListItemIcon>
            <ListItemText primary="קובץ"/>
          </ListItemButton>
          <ListItemButton  onClick={handleClose} >
            <ListItemIcon><VideoIcon/></ListItemIcon>
            <ListItemText primary="סרטון"/>
          </ListItemButton>
        </List>

      </Popover>
    </div>
  )
}

export default MediaUploader
