import React from 'react';
import { Box, Typography } from '@mui/material';

/** En-tête de page : surtitre, titre, description et actions à droite. */
export default function PageHeader({ eyebrow, title, subtitle, actions, sx }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'flex-end' },
        justifyContent: 'space-between',
        gap: 2,
        mb: { xs: 3, md: 4 },
        animation: 'fadeUp .4s ease both',
        ...sx,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow && (
          <Typography variant="overline" sx={{ color: 'primary.main', display: 'block', mb: 0.5 }}>
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.2rem' } }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 620 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>{actions}</Box>
      )}
    </Box>
  );
}
