import React from 'react';
import { Avatar, Box, ButtonBase, Typography } from '@mui/material';
import { initials } from '../utils';
import { tint } from '../theme/theme';

/** Liste des groupes (colonne de gauche de la messagerie). */
export default function ListGroupsModal({ groups, selectedId, onSelect }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {groups.map((g) => {
        const on = g.id === selectedId;
        return (
          <ButtonBase
            key={g.id}
            onClick={() => onSelect(g.id)}
            sx={{
              display: 'flex', gap: 1.5, p: 1.25, borderRadius: 3.5, justifyContent: 'flex-start', textAlign: 'left',
              bgcolor: on ? tint('primary', 0.1) : 'transparent', '&:hover': { bgcolor: on ? tint('primary', 0.14) : 'sand.main' },
            }}
          >
            <Avatar src={g.photoURL || undefined} sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>{initials(g.name)}</Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 700, color: on ? 'primary.main' : 'text.primary' }} noWrap>{g.name}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>{g.description || `Créé par ${g.creatorEmail || '—'}`}</Typography>
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
