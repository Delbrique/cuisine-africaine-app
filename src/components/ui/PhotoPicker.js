import React, { useId, useState } from 'react';
import { Avatar, Box, ButtonBase, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import AddAPhotoRoundedIcon from '@mui/icons-material/AddAPhotoRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { readImageAsDataUrl } from '../../utils';
import { tint } from '../../theme/theme';

/** Zone de choix de photo (ronde pour un profil, rectangulaire pour un plat). */
export default function PhotoPicker({ value, onChange, round = false, label = 'Ajouter une photo', size = 120, sx }) {
  const id = useId();
  const [busy, setBusy] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      onChange(await readImageAsDataUrl(file));
    } finally {
      setBusy(false);
    }
  };

  const w = round ? size : '100%';
  const h = round ? size : size * 1.4;

  return (
    <Box sx={{ position: 'relative', width: round ? size : '100%', ...sx }}>
      <input id={id} type="file" accept="image/*" hidden onChange={handleFile} />
      <ButtonBase
        component="label"
        htmlFor={id}
        sx={{
          width: w,
          height: h,
          borderRadius: round ? '50%' : 4,
          overflow: 'hidden',
          border: value ? 'none' : '2px dashed',
          borderColor: 'divider',
          bgcolor: tint('sand', 0.7),
          display: 'grid',
          placeItems: 'center',
          transition: 'all .2s',
          '&:hover': { borderColor: 'primary.main', bgcolor: tint('primary', 0.06) },
        }}
      >
        {busy ? (
          <CircularProgress size={28} />
        ) : value ? (
          <Avatar src={value} variant={round ? 'circular' : 'square'} sx={{ width: '100%', height: '100%' }} />
        ) : (
          <Box sx={{ textAlign: 'center', color: 'text.secondary', px: 1 }}>
            <AddAPhotoRoundedIcon sx={{ fontSize: 30, color: 'primary.main' }} />
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mt: 0.5 }}>{label}</Typography>
          </Box>
        )}
      </ButtonBase>
      {value && !busy && (
        <Tooltip title="Retirer la photo">
          <IconButton
            size="small"
            onClick={() => onChange('')}
            sx={{
              position: 'absolute', top: round ? 0 : 8, right: round ? 0 : 8,
              bgcolor: 'background.paper', boxShadow: 2, '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
