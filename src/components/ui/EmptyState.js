import React from 'react';
import { Box, Typography } from '@mui/material';
import { tint } from '../../theme/theme';

/** État vide illustré avec une action optionnelle. */
export default function EmptyState({ icon, title, description, action, sx }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: { xs: 6, md: 9 },
        px: 3,
        borderRadius: 6,
        border: '2px dashed',
        borderColor: 'divider',
        bgcolor: tint('sand', 0.5),
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 76,
            height: 76,
            mx: 'auto',
            mb: 2.5,
            borderRadius: '24px',
            display: 'grid',
            placeItems: 'center',
            color: 'primary.main',
            bgcolor: tint('primary', 0.1),
            '& svg': { fontSize: 38 },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h5" sx={{ mb: 1 }}>{title}</Typography>
      {description && (
        <Typography color="text.secondary" sx={{ maxWidth: 440, mx: 'auto' }}>{description}</Typography>
      )}
      {action && <Box sx={{ mt: 3 }}>{action}</Box>}
    </Box>
  );
}
