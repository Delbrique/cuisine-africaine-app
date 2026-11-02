import React from 'react';
import { Box, Typography } from '@mui/material';

/** Logo de l'application : marmite + mot-symbole. */
export default function Logo({ size = 40, showText = true, subtitle, color = 'text.primary', sx }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, ...sx }}>
      <Box
        component="img"
        src={`${process.env.PUBLIC_URL}/logo.svg`}
        alt="Cuisine Africaine"
        sx={{ width: size, height: size, flexShrink: 0, filter: 'drop-shadow(0 6px 14px rgba(169,55,15,.28))' }}
      />
      {showText && (
        <Box sx={{ lineHeight: 1, minWidth: 0 }}>
          <Typography
            component="div"
            sx={{
              fontFamily: '"Fraunces Variable", Georgia, serif',
              fontWeight: 700,
              fontSize: size * 0.48,
              lineHeight: 1.05,
              color,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            Cuisine{' '}
            <Box component="span" sx={{ color: color === 'text.primary' ? 'primary.main' : '#FFC857', fontStyle: 'italic' }}>Africaine</Box>
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color, opacity: 0.6, fontWeight: 600, letterSpacing: '0.04em' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

/** Motif wax/kente (zigzags + losanges) utilisable en fond CSS. */
export const patternBg = (color = '#F2A93B', opacity = 0.18) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
<g fill='none' stroke='${color}' stroke-opacity='${opacity}' stroke-width='2'>
<path d='M0 16l8-8 8 8 8-8 8 8 8-8 8 8 8-8 8 8'/><path d='M0 48l8 8 8-8 8 8 8-8 8 8 8-8 8 8 8-8'/>
<path d='M32 24l8 8-8 8-8-8z'/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
