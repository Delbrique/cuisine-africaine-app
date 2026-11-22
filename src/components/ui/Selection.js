import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, ButtonBase, CircularProgress, IconButton, Paper, Slide, Tooltip, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import SelectAllRoundedIcon from '@mui/icons-material/SelectAllRounded';

/**
 * Sélection multiple d'éléments (plats, ingrédients, membres…).
 * `allIds` : identifiants existants — les éléments supprimés sont retirés de la sélection.
 */
export function useSelection(allIds = []) {
  const [ids, setIds] = useState(() => new Set());
  const [mode, setMode] = useState(false);
  const key = allIds.join('|');

  // Retire de la sélection les éléments qui n'existent plus.
  useEffect(() => {
    const existing = new Set(key ? key.split('|') : []);
    setIds((prev) => {
      const next = new Set([...prev].filter((id) => existing.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [key]);

  const selecting = mode || ids.size > 0;
  const clear = useCallback(() => { setIds(new Set()); setMode(false); }, []);
  const toggle = useCallback((id) => setIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }), []);
  const selectAll = useCallback((list) => setIds(new Set(list)), []);

  // Échap pour quitter la sélection.
  useEffect(() => {
    if (!selecting) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') clear(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selecting, clear]);

  return useMemo(() => ({
    ids, count: ids.size, selecting, isSelected: (id) => ids.has(id), toggle, selectAll, clear,
    start: () => setMode(true),
  }), [ids, selecting, toggle, selectAll, clear]);
}

/** Bouton d'en-tête « Sélectionner » / « Annuler ». */
export function SelectToggleButton({ selection, disabled }) {
  return selection.selecting ? (
    <Button variant="outlined" color="inherit" startIcon={<CloseRoundedIcon />} onClick={selection.clear}>Annuler</Button>
  ) : (
    <Button variant="outlined" color="inherit" startIcon={<ChecklistRoundedIcon />} onClick={selection.start} disabled={disabled}>Sélectionner</Button>
  );
}

/**
 * Case à cocher ronde posée sur une carte. Visible au survol de la carte (classe `sel-check`),
 * et en permanence pendant une sélection.
 */
export function SelectCheck({ checked, selecting, onToggle, sx }) {
  return (
    <ButtonBase
      className="sel-check"
      aria-label={checked ? 'Désélectionner' : 'Sélectionner'}
      aria-pressed={checked}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      sx={{
        position: 'absolute', top: 10, left: 10, zIndex: 2, width: 30, height: 30, borderRadius: '50%',
        display: 'grid', placeItems: 'center', transition: 'all .15s',
        opacity: selecting || checked ? 1 : 0,
        bgcolor: checked ? 'primary.main' : 'rgba(255,255,255,.92)',
        color: checked ? 'primary.contrastText' : 'transparent',
        border: '2px solid', borderColor: checked ? 'primary.main' : 'rgba(42,26,18,.35)',
        boxShadow: '0 4px 12px rgba(0,0,0,.18)',
        '&:hover': { borderColor: 'primary.main', color: checked ? 'primary.contrastText' : 'primary.main' },
        ...sx,
      }}
    >
      <CheckRoundedIcon sx={{ fontSize: 19 }} />
    </ButtonBase>
  );
}

/** Style à appliquer à la carte (contour quand elle est sélectionnée, case visible au survol). */
export const selectableSx = (checked) => ({
  position: 'relative',
  borderRadius: '20px',
  outline: '3px solid',
  outlineColor: checked ? 'primary.main' : 'transparent',
  outlineOffset: 2,
  transition: 'outline-color .15s',
  '&:hover .sel-check': { opacity: 1 },
});

/**
 * Barre d'actions flottante : « Modifier » pour un seul élément,
 * « Supprimer » pour un ou plusieurs.
 */
export function SelectionBar({ selection, total, onSelectAll, onEdit, onDelete, busy = false, noun = 'élément' }) {
  const { count, selecting, clear } = selection;
  const plural = count > 1 ? 's' : '';
  return (
    <Slide direction="up" in={selecting} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed', zIndex: 1200, display: 'flex', justifyContent: 'center', pointerEvents: 'none',
          left: { xs: 12, md: 272 + 24 }, right: { xs: 12, md: 24 },
          bottom: { xs: 'calc(env(safe-area-inset-bottom) + 84px)', md: 24 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, p: 1, pl: 1.5,
            borderRadius: 4, bgcolor: 'ink.main', color: 'ink.contrastText', boxShadow: '0 20px 50px rgba(31,20,16,.35)',
            maxWidth: '100%', flexWrap: 'wrap',
          }}
        >
          <Tooltip title="Quitter la sélection (Échap)">
            <IconButton onClick={clear} sx={{ color: 'inherit' }} aria-label="Quitter la sélection"><CloseRoundedIcon /></IconButton>
          </Tooltip>
          <Typography sx={{ fontWeight: 700, px: 0.5, minWidth: { sm: 150 } }}>
            {count ? `${count} ${noun}${plural} sélectionné${plural}` : `Choisissez des ${noun}s`}
          </Typography>
          {count < total && (
            <Button onClick={onSelectAll} startIcon={<SelectAllRoundedIcon />} sx={{ color: 'inherit' }}>Tout</Button>
          )}
          {count === 1 && onEdit && (
            <Button onClick={onEdit} variant="contained" startIcon={<EditRoundedIcon />} disabled={busy}
              sx={{ bgcolor: 'ink.contrastText', color: 'ink.main', '&:hover': { bgcolor: '#fff' } }}>
              Modifier
            </Button>
          )}
          {count >= 1 && (
            <Button onClick={onDelete} variant="contained" color="error" disabled={busy}
              startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineRoundedIcon />}>
              {count >= 2 ? `Supprimer (${count})` : 'Supprimer'}
            </Button>
          )}
        </Paper>
      </Box>
    </Slide>
  );
}
