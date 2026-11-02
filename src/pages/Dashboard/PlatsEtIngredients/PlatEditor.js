import React, { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Chip, IconButton, InputAdornment, MenuItem, TextField, Typography,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { ChipSelect, PhotoPicker, ResponsiveDialog } from '../../../components/ui';
import { DIFFICULTES, PLAT_CATEGORIES } from '../../../constants';

const empty = {
  nom: '', description: '', photoURL: '', tempsPreparation: '', tempsCuisson: '', difficulte: 'Facile',
  instructions: '', ingredientsNecessaires: [], categoriePlat: '', utilisation: '', richeEn: '',
};

const grid = { display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } };

/** Formulaire d'ajout / modification d'un plat. Produit les mêmes données qu'avant. */
export default function PlatEditor({ open, plat, ingredients, onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const isFruit = form.categoriePlat === 'Fruit';

  useEffect(() => {
    if (!open) return;
    setError('');
    setBusy(false);
    if (!plat) {
      setForm(empty);
      return;
    }
    setForm({
      ...empty,
      ...plat,
      tempsPreparation: plat.tempsPreparation ?? '',
      tempsCuisson: plat.tempsCuisson ?? '',
      ingredientsNecessaires: (plat.ingredientsNecessaires || []).map((ing) => {
        const full = ingredients.find((i) => i.id === ing.ingredientId);
        return {
          ingredientId: ing.ingredientId,
          nom: ing.nom || full?.nom || 'Ingrédient inconnu',
          quantite: ing.quantite ?? '',
          uniteMesure: ing.uniteMesure || full?.uniteMesure || '',
        };
      }),
    });
  }, [open, plat, ingredients]);

  const selectIngredients = (ids) => {
    set({
      ingredientsNecessaires: ids.map((id) => {
        const existing = form.ingredientsNecessaires.find((i) => i.ingredientId === id);
        if (existing) return existing;
        const full = ingredients.find((i) => i.id === id);
        return { ingredientId: id, nom: full?.nom || 'Ingrédient inconnu', quantite: '', uniteMesure: full?.uniteMesure || '' };
      }),
    });
  };

  const updateIng = (id, patch) =>
    set({ ingredientsNecessaires: form.ingredientsNecessaires.map((i) => (i.ingredientId === id ? { ...i, ...patch } : i)) });

  const submit = async () => {
    setError('');
    if (!form.categoriePlat) return setError('Choisissez une catégorie.');
    if (!isFruit && form.ingredientsNecessaires.some((i) => !(parseFloat(i.quantite) > 0) || !i.uniteMesure)) {
      return setError('Indiquez une quantité positive et une unité pour chaque ingrédient.');
    }

    let data = { nom: form.nom, description: form.description, photoURL: form.photoURL, categoriePlat: form.categoriePlat };
    data = isFruit
      ? { ...data, utilisation: form.utilisation, richeEn: form.richeEn, ingredientsNecessaires: [] }
      : {
          ...data,
          tempsPreparation: parseInt(form.tempsPreparation, 10) || 0,
          tempsCuisson: parseInt(form.tempsCuisson, 10) || 0,
          difficulte: form.difficulte,
          instructions: form.instructions,
          ingredientsNecessaires: form.ingredientsNecessaires.map((i) => ({ ...i, quantite: parseFloat(i.quantite) || 0 })),
        };

    setBusy(true);
    try {
      await onSave(data);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open} onClose={onClose} maxWidth="md" onSubmit={submit}
      title={plat ? `Modifier « ${plat.nom} »` : 'Nouveau plat'}
      actions={
        <>
          <Button color="inherit" onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Enregistrement…' : plat ? 'Enregistrer' : 'Ajouter le plat'}</Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '220px 1fr' } }}>
          <PhotoPicker value={form.photoURL} onChange={(v) => set({ photoURL: v })} size={140} label="Photo du plat" />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nom du plat" value={form.nom} onChange={(e) => set({ nom: e.target.value })} required autoFocus={!plat} placeholder="Ex : Ndolé aux crevettes" />
            <TextField
              label={isFruit ? 'Description du fruit' : 'Description'} value={form.description}
              onChange={(e) => set({ description: e.target.value })} multiline minRows={3} required={!isFruit}
            />
          </Box>
        </Box>

        <ChipSelect label="Catégorie" single allowEmpty={false} options={PLAT_CATEGORIES} value={form.categoriePlat} onChange={(v) => set({ categoriePlat: v })} />

        {isFruit ? (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField label="Utilisation" value={form.utilisation} onChange={(e) => set({ utilisation: e.target.value })} multiline minRows={2} placeholder="Frais, en jus, en salade…" />
            <TextField label="Riche en" value={form.richeEn} onChange={(e) => set({ richeEn: e.target.value })} multiline minRows={2} placeholder="Vitamine C, fibres…" />
          </Box>
        ) : (
          <>
            <Box sx={grid}>
              <TextField label="Préparation" type="number" value={form.tempsPreparation} onChange={(e) => set({ tempsPreparation: e.target.value })} required
                InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }} inputProps={{ min: 0 }} />
              <TextField label="Cuisson" type="number" value={form.tempsCuisson} onChange={(e) => set({ tempsCuisson: e.target.value })} required
                InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }} inputProps={{ min: 0 }} />
              <TextField select label="Difficulté" value={form.difficulte} onChange={(e) => set({ difficulte: e.target.value })}>
                {DIFFICULTES.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase' }}>Ingrédients</Typography>
              <Autocomplete
                multiple
                options={ingredients.map((i) => i.id)}
                getOptionLabel={(id) => {
                  const i = ingredients.find((x) => x.id === id);
                  return i ? `${i.nom} (${i.uniteMesure})` : form.ingredientsNecessaires.find((x) => x.ingredientId === id)?.nom || 'Inconnu';
                }}
                value={form.ingredientsNecessaires.map((i) => i.ingredientId)}
                onChange={(_, ids) => selectIngredients(ids)}
                renderTags={() => null}
                noOptionsText="Aucun ingrédient — créez-en dans « Ingrédients »"
                renderInput={(params) => <TextField {...params} placeholder="Ajouter un ingrédient…" />}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
                {form.ingredientsNecessaires.map((ing) => (
                  <Box key={ing.ingredientId} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, pl: 2, borderRadius: 3, bgcolor: 'sand.main' }}>
                    <Typography sx={{ flex: 1, fontWeight: 650, minWidth: 0 }} noWrap>{ing.nom}</Typography>
                    <TextField size="small" type="number" placeholder="Qté" value={ing.quantite} sx={{ width: 90 }}
                      inputProps={{ min: '0.01', step: '0.01' }} onChange={(e) => updateIng(ing.ingredientId, { quantite: e.target.value })} />
                    <TextField size="small" placeholder="Unité" value={ing.uniteMesure} sx={{ width: 96 }}
                      onChange={(e) => updateIng(ing.ingredientId, { uniteMesure: e.target.value })} />
                    <IconButton size="small" onClick={() => selectIngredients(form.ingredientsNecessaires.filter((i) => i.ingredientId !== ing.ingredientId).map((i) => i.ingredientId))} aria-label="Retirer">
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                {form.ingredientsNecessaires.length === 0 && <Chip label="Aucun ingrédient pour l'instant" variant="outlined" sx={{ alignSelf: 'flex-start' }} />}
              </Box>
            </Box>

            <TextField label="Instructions de préparation" value={form.instructions} onChange={(e) => set({ instructions: e.target.value })} multiline minRows={5} required
              placeholder={'1. Laver et hacher les feuilles…\n2. …'} />
          </>
        )}

        {error && <Alert severity="error">{error}</Alert>}
      </Box>
    </ResponsiveDialog>
  );
}
