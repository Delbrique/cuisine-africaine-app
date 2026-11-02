import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import { tint } from '../../theme/theme';

/** Carte de section avec en-tête iconé. */
export default function SectionCard({ icon, title, subtitle, action, children, sx, contentSx }) {
  return (
    <Card sx={{ ...sx }}>
      {(title || icon) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: { xs: 2.25, sm: 3 }, pt: 2.5, pb: 1 }}>
          {icon && (
            <Box sx={{ width: 38, height: 38, borderRadius: '12px', display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: tint('primary', 0.1), flexShrink: 0, '& svg': { fontSize: 21 } }}>
              {icon}
            </Box>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6">{title}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
          </Box>
          {action}
        </Box>
      )}
      <Box sx={{ px: { xs: 2.25, sm: 3 }, pb: 3, pt: 1.5, ...contentSx }}>{children}</Box>
    </Card>
  );
}
