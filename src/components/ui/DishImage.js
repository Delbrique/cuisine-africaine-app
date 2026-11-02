import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { patternBg } from './Logo';

const GRADIENTS = [
  'linear-gradient(135deg, #EE6A33, #A9370F)',
  'linear-gradient(135deg, #F2A93B, #C2461A)',
  'linear-gradient(135deg, #4FB67E, #1F6B42)',
  'linear-gradient(135deg, #D98E04, #8F2F0E)',
  'linear-gradient(135deg, #2C6E8F, #1F6B42)',
];

const hash = (s = '') => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

/** Photo d'un plat avec repli illustré (dégradé + motif wax + initiale). */
export default function DishImage({ src, name = '', height = 180, radius = 0, sx, children }) {
  const [failed, setFailed] = useState(false);
  // Les anciens plats ajoutés depuis Découverte peuvent contenir une image grise « placeholder ».
  const showImg = src && !failed && !/placeholder\.com/i.test(src);

  return (
    <Box
      sx={{
        position: 'relative',
        height,
        borderRadius: radius,
        overflow: 'hidden',
        flexShrink: 0,
        background: showImg ? undefined : `${patternBg('#FFFFFF', 0.22)}, ${GRADIENTS[hash(name) % GRADIENTS.length]}`,
        ...sx,
      }}
    >
      {showImg ? (
        <Box
          component="img"
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <Typography
            sx={{
              fontFamily: '"Fraunces Variable", serif', fontWeight: 700, fontStyle: 'italic', color: '#FFF3E0',
              fontSize: typeof height === 'number' ? Math.max(22, height * 0.32) : 48, textShadow: '0 4px 20px rgba(0,0,0,.2)',
            }}
          >
            {name.trim().charAt(0).toUpperCase() || '·'}
          </Typography>
        </Box>
      )}
      {children}
    </Box>
  );
}
