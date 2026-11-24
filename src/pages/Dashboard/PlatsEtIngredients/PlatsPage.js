// src/pages/Dashboard/PlatsEtIngredients/PlatsPage.js
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import CatalogueDialog from './CatalogueDialog';
import { enqueueSnackbar } from 'notistack';

import { createPlat, getPlats, updatePlat, deletePlat } from '../../../services/platService';
import { getIngredients } from '../../../services/ingredientService';
import { getMembres } from '../../../services/membreService';
import useCoutPlats from '../../../services/useCoutPlats';
import {
  EmptyState, FilterChips, LoadingGrid, PageHeader, SelectCheck, SelectionBar, SelectToggleButton, selectableSx, useConfirm, useSelection,
} from '../../../components/ui';
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
  const [busy, setBusy] = useState(false);
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [personnes, setPersonnes] = useState(0);
  const confirm = useConfirm();
  const selection = useSelection((plats || []).map((p) => p.id));
  const { cout } = useCoutPlats(plats);

  useEffect(() => {
    getMembres().then((m) => setPersonnes(m.length)).catch(() => setPersonnes(0));
  }, []);

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

  // Lien direct vers un plat (ex. depuis l'anti-gaspillage de l'accueil) : ?plat=<id>
  useEffect(() => {
    const id = params.get('plat');
    if (!id || !plats) return;
    const p = plats.find((x) => x.id === id);
    if (p) setViewing(p);
    setParams({}, { replace: true });
  }, [params, setParams, plats]);

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
    selection.clear();
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

  const chosen = (plats || []).filter((p) => selection.isSelected(p.id));

  const removeSelected = async () => {
    if (chosen.length === 1) {
      await remove(chosen[0]);
      return;
    }
    const ok = await confirm({
      title: `Supprimer ${chosen.length} plats ?`,
      message: `${chosen.slice(0, 4).map((p) => `« ${p.nom} »`).join(', ')}${chosen.length > 4 ? ` et ${chosen.length - 4} autre(s)` : ''} seront retirés de vos recettes.`,
      confirmLabel: `Supprimer (${chosen.length})`,
    });
    if (!ok) return;
    setBusy(true);
    const results = await Promise.allSettled(chosen.map((p) => deletePlat(p.id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBusy(false);
    if (failed) enqueueSnackbar(`${chosen.length - failed} plat(s) supprimé(s), ${failed} échec(s).`, { variant: 'warning' });
    else enqueueSnackbar(`${chosen.length} plats supprimés.`, { variant: 'success' });
    selection.clear();
    fetchPlats();
  };

  return (
    <Box sx={{ pb: selection.selecting ? 12 : 0 }}>
      <PageHeader
        eyebrow="Cuisine"
        title="Nos plats"
        subtitle="Le livre de recettes de la famille, des grands classiques aux petits-déjeuners."
        actions={
          <>
            {plats && plats.length > 0 && <SelectToggleButton selection={selection} />}
            <Button variant="outlined" startIcon={<MenuBookRoundedIcon />} onClick={() => setCatalogueOpen(true)}>Catalogue</Button>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditor({ open: true, plat: null })}>Nouveau plat</Button>
          </>
        }
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
          description="Choisissez des plats dans le catalogue de l'application, créez les vôtres, ou piochez des idées dans « Découverte »."
          action={
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button variant="contained" startIcon={<MenuBookRoundedIcon />} onClick={() => setCatalogueOpen(true)}>Parcourir le catalogue</Button>
              <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setEditor({ open: true, plat: null })}>Créer un plat</Button>
            </Box>
          }
        />
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>Aucun plat ne correspond à votre recherche.</Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2.5 }, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(auto-fill, minmax(260px, 1fr))' } }}>
          {filtered.map((p) => {
            const checked = selection.isSelected(p.id);
            return (
              <Box key={p.id} sx={selectableSx(checked)}>
                <SelectCheck checked={checked} selecting={selection.selecting} onToggle={() => selection.toggle(p.id)} sx={{ left: 'auto', right: 10 }} />
                <PlatCard compact plat={p} cout={cout(p)} onClick={() => (selection.selecting ? selection.toggle(p.id) : setViewing(p))} />
              </Box>
            );
          })}
        </Box>
      )}

      <SelectionBar
        selection={selection} noun="plat" total={filtered.length} busy={busy}
        onSelectAll={() => selection.selectAll(filtered.map((p) => p.id))}
        onEdit={() => chosen[0] && setEditor({ open: true, plat: chosen[0] })}
        onDelete={removeSelected}
      />

      <PlatDetail
        plat={viewing}
        onClose={() => setViewing(null)}
        onEdit={() => setEditor({ open: true, plat: viewing })}
        onDelete={() => remove(viewing)}
        cout={cout(viewing)}
        personnes={personnes}
      />
      <PlatEditor
        open={editor.open}
        plat={editor.plat}
        ingredients={ingredients}
        onClose={() => setEditor({ open: false, plat: null })}
        onSave={save}
      />
      <CatalogueDialog
        open={catalogueOpen}
        onClose={() => setCatalogueOpen(false)}
        familyPlats={plats || []}
        onAdded={() => {
          fetchPlats();
          getIngredients().then(setIngredients).catch(() => {});
        }}
      />
    </Box>
  );
}

export default PlatsPage;
