import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useColorScheme } from '@mui/material/styles';
import {
  Avatar, Box, ButtonBase, Divider, ListItemIcon, ListItemText, Menu, MenuItem, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import InstallMobileRoundedIcon from '@mui/icons-material/InstallMobileRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import { enqueueSnackbar } from 'notistack';
import { auth } from '../../firebase/firebase';
import { useAuth } from '../../auth/AuthContext';
import usePwaInstall from '../../pwa/usePwaInstall';
import { initials } from '../../utils';

/** Avatar + menu utilisateur : thème, installation, configuration, déconnexion. */
export default function UserMenu({ variant = 'card' }) {
  const { user, profile } = useAuth();
  const { mode, setMode } = useColorScheme();
  const { canInstall, iosHint, install } = usePwaInstall();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);

  const name = profile?.nomComplet || user?.displayName || user?.email?.split('@')[0] || 'Moi';
  const photo = profile?.photoProfil || user?.photoURL || undefined;

  const logout = async () => {
    setAnchor(null);
    await signOut(auth);
    navigate('/login');
  };

  const onInstall = async () => {
    setAnchor(null);
    if (canInstall) await install();
    else enqueueSnackbar("Sur iPhone : touchez Partager puis « Sur l'écran d'accueil ».", { variant: 'info', autoHideDuration: 7000 });
  };

  const avatar = (
    <Avatar src={photo} sx={{ width: 38, height: 38, bgcolor: 'primary.main', fontSize: 15 }}>{initials(name)}</Avatar>
  );

  return (
    <>
      {variant === 'card' ? (
        <ButtonBase
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            width: '100%', p: 1.25, borderRadius: 3, gap: 1.25, justifyContent: 'flex-start', textAlign: 'left',
            bgcolor: 'rgba(255,243,224,0.06)', '&:hover': { bgcolor: 'rgba(255,243,224,0.11)' },
          }}
        >
          {avatar}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#FFF3E0' }} noWrap>{name}</Typography>
            <Typography sx={{ fontSize: 12, color: 'rgba(255,243,224,0.55)' }} noWrap>{user?.email}</Typography>
          </Box>
          <UnfoldMoreRoundedIcon sx={{ color: 'rgba(255,243,224,0.5)', fontSize: 20 }} />
        </ButtonBase>
      ) : (
        <ButtonBase onClick={(e) => setAnchor(e.currentTarget)} sx={{ borderRadius: '50%' }} aria-label="Mon compte">
          {avatar}
        </ButtonBase>
      )}

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: variant === 'card' ? 'top' : 'bottom', horizontal: variant === 'card' ? 'left' : 'right' }}
        transformOrigin={{ vertical: variant === 'card' ? 'bottom' : 'top', horizontal: variant === 'card' ? 'left' : 'right' }}
        slotProps={{ paper: { sx: { minWidth: 270, mt: variant === 'card' ? -1 : 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 700 }} noWrap>{name}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>{user?.email}</Typography>
        </Box>
        <Divider />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>APPARENCE</Typography>
          <ToggleButtonGroup
            size="small" exclusive fullWidth value={mode || 'system'}
            onChange={(_, v) => v && setMode(v)}
            sx={{ '& .MuiToggleButton-root': { gap: 0.5, textTransform: 'none', fontWeight: 600, borderRadius: '10px !important', border: 'none' }, bgcolor: 'sand.main', p: 0.5, borderRadius: 3 }}
          >
            <ToggleButton value="light"><LightModeRoundedIcon fontSize="small" /> Clair</ToggleButton>
            <ToggleButton value="dark"><DarkModeRoundedIcon fontSize="small" /> Sombre</ToggleButton>
            <ToggleButton value="system"><SettingsBrightnessRoundedIcon fontSize="small" /> Auto</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Divider />
        {(canInstall || iosHint) && (
          <MenuItem onClick={onInstall}>
            <ListItemIcon><InstallMobileRoundedIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Installer l'application" />
          </MenuItem>
        )}
        <MenuItem onClick={() => { setAnchor(null); navigate('/configurer-famille'); }}>
          <ListItemIcon><SettingsRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Configurer la famille" />
        </MenuItem>
        <MenuItem onClick={logout} sx={{ color: 'error.main' }}>
          <ListItemIcon><LogoutRoundedIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Déconnexion" />
        </MenuItem>
      </Menu>
    </>
  );
}
