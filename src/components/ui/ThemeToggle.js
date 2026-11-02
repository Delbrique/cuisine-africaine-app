import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';

/** Bascule rapide clair / sombre (le choix « Auto » reste disponible dans le menu du compte). */
export default function ThemeToggle({ sx }) {
  const { colorScheme, setMode } = useColorScheme();
  const dark = colorScheme === 'dark';
  return (
    <Tooltip title={dark ? 'Passer en thème clair' : 'Passer en thème sombre'}>
      <IconButton onClick={() => setMode(dark ? 'light' : 'dark')} aria-label="Changer de thème" sx={sx}>
        {dark ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
      </IconButton>
    </Tooltip>
  );
}
