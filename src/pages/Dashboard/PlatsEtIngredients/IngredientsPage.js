// src/pages/Dashboard/PlatsEtIngredients/IngredientsPage.js
import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Box, Button, ButtonBase, Card, IconButton, InputAdornment, TextField, Tooltip, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EggAltRoundedIcon from '@mui/icons-material/EggAltRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { enqueueSnackbar } from 'notistack';

import {
  createIngredient, listenIngredients, updateIngredient, deleteIngredient, INGREDIENT_STATUS,
} from '../../../services/ingredientService';
import { EmptyState, FilterChips, LoadingGrid, PageHeader, useConfirm } from '../../../components/ui';
import { asText, formatFcfa, friendlyError, normalize } from '../../../utils';
import { tint } from '../../../theme/theme';
import IngredientEditor from './IngredientEditor';

function IngredientsPage() {
  const [ingredients, setIngredients] = useState(null);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState({ open: false, ingredient: null });
  const confirm = useConfirm();

  // Temps réel : la liste suit les modifications faites ailleurs (stock, autre appareil…).
  useEffect(
    () =>
      listenIngredients(setIngredients, (err) => {
        enqueueSnackbar(`Erreur lors du chargement des ingrédients : ${friendlyError(err)}`, { variant: 'error' });
        setIngredients((cur) => cur || []);
      }),
    []
  );

  const categories = useMemo(() => [...new Set((ingredients || []).map((i) => i.categorie).filter(Boolean))].sort(), [ingredients]);
  const filtered = useMemo(
    () =>
      (ingredients || [])
        .filter((i) => !category || i.categorie === category)
        .filter((i) => normalize(`${asText(i.nom)} ${asText(i.alias)}`).includes(normalize(search)))
        .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')),
    [ingredients, category, search]
  );

  const save = async (data) => {
    if (editor.ingredient) {
      await updateIngredient(editor.ingredient.id, data);
      enqueueSnackbar('Ingrédient mis à jour !', { variant: 'success' });
    } else {
      // Un nouvel ingrédient démarre avec un stock vide.
      await createIngredient({
        ...data, stockQuantity: 0, datePeremption: null, seuilMinimum: 0, status: INGREDIENT_STATUS.NOT_USED, totalConsumedQuantity: 0,
      });
      enqueueSnackbar('Ingrédient ajouté !', { variant: 'success' });
    }
    setEditor({ open: false, ingredient: null });
  };

  const remove = async (ing) => {
    if (!(await confirm({ title: `Supprimer « ${ing.nom} » ?`, message: 'Il sera aussi retiré de votre stock.', confirmLabel: 'Supprimer' }))) return;
    try {
      await deleteIngredient(ing.id);
      enqueueSnackbar('Ingrédient supprimé.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(friendlyError(err), { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Cuisine"
        title="Ingrédients"
        subtitle="Le catalogue de base de vos recettes, avec leur prix au marché."
        actions={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditor({ open: true, ingredient: null })}>Nouvel ingrédient</Button>}
      />

      {ingredients && ingredients.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Rechercher un ingrédient…" value={search} onChange={(e) => setSearch(e.target.value)} size="small"
            sx={{ width: { xs: '100%', sm: 340 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}
          />
          <FilterChips options={categories} value={category} onChange={setCategory} allLabel="Toutes" />
        </Box>
      )}

      {!ingredients ? (
        <LoadingGrid media={0} min={220} count={8} />
      ) : ingredients.length === 0 ? (
        <EmptyState
          icon={<EggAltRoundedIcon />} title="Aucun ingrédient"
          description="Créez les ingrédients que vous utilisez pour pouvoir composer vos plats et suivre le stock."
          action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditor({ open: true, ingredient: null })}>Ajouter un ingrédient</Button>}
        />
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {filtered.map((ing) => (
            <Card key={ing.id} sx={{ display: 'flex', alignItems: 'center', transition: 'all .2s', '&:hover': { borderColor: 'primary.main' }, '&:hover .del': { opacity: 1 } }}>
              <ButtonBase onClick={() => setEditor({ open: true, ingredient: ing })} sx={{ flex: 1, minWidth: 0, justifyContent: 'flex-start', gap: 1.75, p: 1.5, textAlign: 'left' }}>
                <Avatar src={ing.photoURL || undefined} sx={{ width: 52, height: 52, borderRadius: '16px', bgcolor: tint('secondary', 0.14), color: 'secondary.main', fontFamily: '"Fraunces Variable", serif', fontSize: 22 }}>
                  {(ing.nom || '?').charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>{ing.nom}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {ing.categorie || 'Sans catégorie'} · {ing.prix !== undefined && ing.prix !== null ? `${formatFcfa(ing.prix)} / ${ing.uniteMesure}` : ing.uniteMesure}
                  </Typography>
                </Box>
              </ButtonBase>
              <Tooltip title="Supprimer">
                <IconButton className="del" onClick={() => remove(ing)} sx={{ mr: 1, opacity: { xs: 1, md: 0 }, transition: 'opacity .2s' }}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Card>
          ))}
        </Box>
      )}
      {ingredients && ingredients.length > 0 && filtered.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>Aucun ingrédient ne correspond.</Typography>
      )}

      <IngredientEditor open={editor.open} ingredient={editor.ingredient} onClose={() => setEditor({ open: false, ingredient: null })} onSave={save} />
    </Box>
  );
}

export default IngredientsPage;
