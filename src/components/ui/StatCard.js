import React from 'react';
import { Box, ButtonBase, Card, Typography } from '@mui/material';
import { tint } from '../../theme/theme';

/** Tuile de chiffre clé. */
export default function StatCard({ icon, label, value, hint, color = 'primary', onClick, active, sx }) {
  const content = (
    <Box sx={{ p: { xs: 1.5, sm: 2.25 }, display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 2 }, width: '100%', textAlign: 'left' }}>
      <Box
        sx={{
          width: { xs: 38, sm: 48 }, height: { xs: 38, sm: 48 }, borderRadius: { xs: '12px', sm: '16px' }, flexShrink: 0,
          display: 'grid', placeItems: 'center', color: `${color}.main`, bgcolor: tint(color, 0.12), '& svg': { fontSize: { xs: 20, sm: 24 } },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontFamily: '"Fraunces Variable", serif', fontWeight: 700, fontSize: { xs: '1.35rem', sm: '1.65rem' }, lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: { xs: 12.5, sm: 14 } }} noWrap>{label}</Typography>
        {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
      </Box>
    </Box>
  );

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all .2s',
        borderColor: active ? `${color}.main` : 'divider',
        boxShadow: active ? (t) => `0 0 0 3px ${tint(color, 0.18)(t)}` : 'none',
        ...(onClick && { '&:hover': { transform: 'translateY(-2px)', borderColor: `${color}.main` } }),
        ...sx,
      }}
    >
      {onClick ? <ButtonBase onClick={onClick} sx={{ width: '100%', height: '100%' }}>{content}</ButtonBase> : content}
    </Card>
  );
}
