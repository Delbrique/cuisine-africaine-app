import React from 'react';
import { Box, Chip } from '@mui/material';

/** Barre de filtres à défilement horizontal. value = '' pour « Tous ». */
export default function FilterChips({ options, value, onChange, allLabel = 'Tous', counts, sx }) {
  const items = [{ value: '', label: allLabel }, ...options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))];
  return (
    <Box
      sx={{
        display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 },
        scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, ...sx,
      }}
    >
      {items.map((o) => {
        const on = value === o.value;
        const n = counts?.[o.value];
        return (
          <Chip
            key={o.value || 'all'}
            label={n !== undefined ? `${o.label} · ${n}` : o.label}
            onClick={() => onChange(o.value)}
            color={on ? 'primary' : 'default'}
            variant={on ? 'filled' : 'outlined'}
            sx={{ height: 36, flexShrink: 0, borderWidth: 1.5 }}
          />
        );
      })}
    </Box>
  );
}
