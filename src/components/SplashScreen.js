import React from 'react';
import { Box, Typography } from '@mui/material';

/** Écran de chargement de marque (reprend l'écran de démarrage d'index.html). */
export default function SplashScreen({ label = 'Cuisine Africaine', inline = false }) {
  return (
    <Box
      sx={{
        ...(inline ? { py: 12 } : { position: 'fixed', inset: 0, zIndex: 2000, bgcolor: 'background.default' }),
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        '@keyframes bob': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      }}
    >
      <Box
        component="img"
        src={`${process.env.PUBLIC_URL}/logo.svg`}
        alt=""
        sx={{ width: inline ? 64 : 88, height: inline ? 64 : 88, animation: 'bob 1.6s ease-in-out infinite' }}
      />
      <Typography variant="overline" sx={{ color: 'primary.main', opacity: 0.8 }}>{label}</Typography>
    </Box>
  );
}
