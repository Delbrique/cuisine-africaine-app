import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

/**
 * Sélection par puces.
 * - multiple (défaut) : value est un tableau.
 * - single : value est une chaîne ; recliquer désélectionne si `allowEmpty`.
 */
export default function ChipSelect({
  label, options, value, onChange, single = false, allowEmpty = true, color = 'primary', disabled, helper, sx,
}) {
  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const isOn = (v) => (single ? value === v : (value || []).includes(v));

  const toggle = (v) => {
    if (single) {
      onChange(value === v && allowEmpty ? '' : v);
    } else {
      const arr = value || [];
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    }
  };

  return (
    <Box sx={sx}>
      {label && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase' }}>
          {label}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {items.map((o) => {
          const on = isOn(o.value);
          return (
            <Chip
              key={o.value}
              label={o.label}
              icon={on ? <CheckRoundedIcon /> : o.icon}
              onClick={() => toggle(o.value)}
              color={on ? color : 'default'}
              variant={on ? 'filled' : 'outlined'}
              disabled={disabled || o.disabled}
              sx={{ height: 36, px: 0.5, borderWidth: 1.5, transition: 'all .15s' }}
            />
          );
        })}
      </Box>
      {helper && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
          {helper}
        </Typography>
      )}
    </Box>
  );
}
