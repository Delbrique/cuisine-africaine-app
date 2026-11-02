import React from 'react';
import { Box, Card, Skeleton } from '@mui/material';

/** Squelettes de cartes pendant le chargement. */
export default function LoadingGrid({ count = 6, media = 160, min = 260 }) {
  return (
    <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} sx={{ overflow: 'hidden' }}>
          {media > 0 && <Skeleton variant="rectangular" height={media} />}
          <Box sx={{ p: 2 }}>
            <Skeleton width="70%" height={28} />
            <Skeleton width="45%" />
            <Skeleton width="90%" />
          </Box>
        </Card>
      ))}
    </Box>
  );
}
