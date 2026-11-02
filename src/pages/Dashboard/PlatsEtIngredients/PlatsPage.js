// src/pages/Dashboard/PlatsEtIngredients/PlatsPage.js
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import { enqueueSnackbar } from 'notistack';

import { createPlat, getPlats, updatePlat, deletePlat } from '../../../services/platService';
import { getIngredients } from '../../../services/ingredientService';
import { EmptyState, FilterChips, LoadingGrid, PageHeader, useConfirm } from '../../../components/ui';
import { PLAT_CATEGORIES } from '../../../constants';
import { friendlyError, normalize } from '../../../utils';
import PlatCard from './PlatCard';
import PlatDetail from './PlatDetail';
import PlatEditor from './PlatEditor';

function PlatsPage() {
  const [plats, setPlats] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [editor, setEditor] = useState({ open: false, plat: null });
  const [params, setParams] = useSearchParams();
  const confirm = useConfirm();

  const fetchPlats = async () => {
    try {
      setPlats(await getPlats());
    } catch (err) {
      enqueueSnackbar(`Erreur lors du chargement des plats : ${friendlyError(err)}`, { variant: 'error' });
      setPlats([]);
    }
  };

  useEffect(() => {
    fetchPlats();
    getIngredients().then(setIngredients).catch((err) => console.error('Erreur ingrédients :', err));
  }, []);

  // Raccourci depuis l'accueil : ?nouveau=1
  useEffect(() => {
    if (params.get('nouveau')) {
      setEditor({ open: true, plat: null });
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const categories = useMemo(() => {
    const dyn = (plats || []).map((p) => p.categoriePlat).filter(Boolean);
    return [...new Set([...PLAT_CATEGORIES, ...dyn])].filter((c) => (plats || []).some((p) => p.categoriePlat === c));
  }, [plats]);

  const counts = useMemo(() => {
    const c = { '': (plats || []).length };
    (plats || []).forEach((p) => { c[p.categoriePlat] = (c[p.categoriePlat] || 0) + 1; });
    return c;
  }, [plats]);

  const filtered = useMemo(
    () =>
      (plats || [])
        .filter((p) => !category || p.categoriePlat === category)
        .filter((p) => normalize(`${p.nom} ${p.description} ${(p.ingredientsNecessaires || []).map((i) => i.nom).join(' ')}`).includes(normalize(search)))
        .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')),
    [plats, category, search]
  );

  const save = async (data) => {
    if (editor.plat) {
      await updatePlat(editor.plat.id, data);
      enqueueSnackbar('Plat mis à jour !', { variant: 'success' });
    } else {
      await createPlat(data);
      enqueueSnackbar('Plat ajouté !', { variant: 'success' });
    }
    setEditor({ open: false, plat: null });
    setViewing(null);
    fetchPlats();
  };

  const remove = async (plat) => {
    if (!(await confirm({ title: `Supprimer « ${plat.nom} » ?`, message: 'Le plat sera retiré de vos recettes.', confirmLabel: 'Supprimer' }))) return;
    try {
      await deletePlat(plat.id);
      setViewing(null);
      enqueueSnackbar('Plat supprimé.', { variant: 'success' });
      fetchPlats();
    } catch (err) {
      enqueueSnackbar(friendlyError(err), { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Cuisine"
        title="Nos plats"
        subtitle="Le livre de recettes de la famille, des grands classiques aux petits-déjeuners."
        actions={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditor({ open: true, plat: null })}>Nouveau plat</Button>}
      />

      {plats && plats.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Rechercher un plat ou un ingrédient…" value={search} onChange={(e) => setSearch(e.target.value)} size="small"
            sx={{ width: { xs: '100%', sm: 380 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}
          />
          <FilterChips options={categories} value={category} onChange={setCategory} allLabel="Tous" counts={counts} />
        </Box>
      )}

      {!plats ? (
        <LoadingGrid />
      ) : plats.length === 0 ? (
        <EmptyState
          icon={<RestaurantMenuRoundedIcon />} title="Votre livre de recettes est vide"
          description="Ajoutez vos plats préférés, ou piochez des idées dans « Découverte »."
          action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditor({ open: true, plat: null })}>Ajouter un plat</Button>}
        />
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>Aucun plat ne correspond à votre recherche.</Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2.5 }, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(auto-fill, minmax(260px, 1fr))' } }}>
          {filtered.map((p) => <PlatCard key={p.id} compact plat={p} onClick={() => setViewing(p)} />)}
        </Box>
      )}

      <PlatDetail
        plat={viewing}
        onClose={() => setViewing(null)}
        onEdit={() => setEditor({ open: true, plat: viewing })}
        onDelete={() => remove(viewing)}
      />
      <PlatEditor
        open={editor.open}
        plat={editor.plat}
        ingredients={ingredients}
        onClose={() => setEditor({ open: false, plat: null })}
        onSave={save}
      />
    </Box>
  );
}

export default PlatsPage;
