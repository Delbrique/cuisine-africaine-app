// Catalogue de l'application : chaque famille y choisit les plats à ajouter à SES recettes.
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, InputAdornment, TextField, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { enqueueSnackbar } from 'notistack';
import { addFromCatalogue, getCatalogue } from '../../../services/platService';
import { DishImage, FilterChips, ResponsiveDialog } from '../../../components/ui';
import { friendlyError, normalize } from '../../../utils';

export default function CatalogueDialog({ open, onClose, familyPlats = [], onAdded }) {
  const [catalogue, setCatalogue] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [adding, setAdding] = useState({});
  const [added, setAdded] = useState(new Set());

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setCategory('');
    setAdded(new Set());
    getCatalogue()
      .then((list) => setCatalogue(list.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))))
      .catch((err) => {
        enqueueSnackbar(`Catalogue indisponible : ${friendlyError(err)}`, { variant: 'error' });
        setCatalogue([]);
      });
  }, [open]);

  // Un plat est « déjà dans vos plats » s'il vient de ce plat du catalogue ou porte le même nom.
  const owned = useMemo(() => {
    const ids = new Set(familyPlats.map((p) => p.catalogueId).filter(Boolean));
    const names = new Set(familyPlats.map((p) => normalize(p.nom || '')));
    return (p) => ids.has(p.id) || names.has(normalize(p.nom || '')) || added.has(p.id);
  }, [familyPlats, added]);

  const categories = useMemo(() => [...new Set((catalogue || []).map((p) => p.categoriePlat).filter(Boolean))], [catalogue]);
  const filtered = (catalogue || [])
    .filter((p) => !category || p.categoriePlat === category)
    .filter((p) => normalize(`${p.nom} ${p.description} ${p.origine || ''}`).includes(normalize(search)));

  const add = async (plat) => {
    setAdding((a) => ({ ...a, [plat.id]: true }));
    try {
      await addFromCatalogue(plat);
      setAdded((s) => new Set(s).add(plat.id));
      enqueueSnackbar(`« ${plat.nom} » ajouté à vos plats !`, { variant: 'success' });
      onAdded?.();
    } catch (err) {
      enqueueSnackbar(friendlyError(err), { variant: 'error' });
    } finally {
      setAdding((a) => ({ ...a, [plat.id]: false }));
    }
  };

  return (
    <ResponsiveDialog open={open} onClose={onClose} title="Catalogue de plats" maxWidth="md">
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Les plats proposés par Libiyo. Ajoutez ceux que vous cuisinez : ils rejoignent les recettes de votre famille,
        et leurs ingrédients votre stock.
      </Typography>
      <TextField
        fullWidth size="small" placeholder="Rechercher un plat…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 1.5 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}
      />
      {categories.length > 1 && <Box sx={{ mb: 2 }}><FilterChips options={categories} value={category} onChange={setCategory} allLabel="Tous" /></Box>}

      {!catalogue ? (
        <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>Aucun plat ne correspond.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filtered.map((p) => {
            const mine = owned(p);
            return (
              <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <DishImage src={p.photoURL} name={p.nom} height={60} radius={2.5} sx={{ width: 60, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>{p.nom}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {[p.categoriePlat, p.origine].filter(Boolean).join(' · ') || p.description}
                  </Typography>
                </Box>
                <Button
                  size="small" variant={mine ? 'text' : 'contained'} disabled={mine || adding[p.id]} onClick={() => add(p)}
                  startIcon={adding[p.id] ? <CircularProgress size={14} color="inherit" /> : mine ? <CheckRoundedIcon /> : <AddRoundedIcon />}
                  sx={{ flexShrink: 0 }}
                >
                  {mine ? 'Ajouté' : 'Ajouter'}
                </Button>
              </Box>
            );
          })}
        </Box>
      )}
    </ResponsiveDialog>
  );
}
