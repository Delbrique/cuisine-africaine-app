import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, InputAdornment, TextField, Typography } from '@mui/material';
import { ChipSelect, PhotoPicker, ResponsiveDialog } from '../../../components/ui';
import { INGREDIENT_CATEGORIES } from '../../../constants';
import { INGREDIENT_STATUS } from '../../../services/ingredientService';
import { asText, toDate } from '../../../utils';

const empty = {
  nom: '', uniteMesure: '', categorie: '', photoURL: '', prix: '', alias: '',
  stockQuantity: '0', datePeremption: '', seuilMinimum: '0', status: INGREDIENT_STATUS.NOT_USED, totalConsumedQuantity: 0,
};

/**
 * Éditeur d'ingrédient. `withStock` affiche aussi les champs de stock (page Stock).
 * onSave reçoit les données prêtes à enregistrer, au même format qu'avant.
 */
export default function IngredientEditor({ open, ingredient, withStock = false, onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (!open) return;
    setError('');
    setBusy(false);
    if (!ingredient) return setForm(empty);
    const d = toDate(ingredient.datePeremption);
    setForm({
      ...empty,
      ...ingredient,
      alias: asText(ingredient.alias),
      photoURL: ingredient.photoURL || '',
      prix: ingredient.prix !== undefined && ingredient.prix !== null ? String(ingredient.prix) : '',
      stockQuantity: ingredient.stockQuantity !== undefined ? String(ingredient.stockQuantity) : '0',
      seuilMinimum: ingredient.seuilMinimum !== undefined ? String(ingredient.seuilMinimum) : '0',
      datePeremption: d ? d.toISOString().split('T')[0] : '',
      totalConsumedQuantity: ingredient.totalConsumedQuantity || 0,
    });
  }, [open, ingredient]);

  const submit = async () => {
    if (!form.categorie) return setError('Choisissez une catégorie.');
    const base = { nom: form.nom, uniteMesure: form.uniteMesure, categorie: form.categorie, photoURL: form.photoURL, prix: parseFloat(form.prix) };
    const data = withStock
      ? {
          ...base,
          alias: form.alias,
          stockQuantity: parseFloat(form.stockQuantity) || 0,
          datePeremption: form.datePeremption ? new Date(form.datePeremption) : null,
          seuilMinimum: parseFloat(form.seuilMinimum) || 0,
          status: form.status || INGREDIENT_STATUS.NOT_USED,
          totalConsumedQuantity: parseFloat(form.totalConsumedQuantity) || 0,
        }
      : base;
    setBusy(true);
    try {
      await onSave(data);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const unit = form.uniteMesure || 'unité';

  return (
    <ResponsiveDialog
      open={open} onClose={onClose} onSubmit={submit}
      title={ingredient ? `Modifier « ${ingredient.nom} »` : withStock ? 'Ajouter au stock' : 'Nouvel ingrédient'}
      actions={
        <>
          <Button color="inherit" onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Enregistrement…' : ingredient ? 'Enregistrer' : 'Ajouter'}</Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' } }}>
          <PhotoPicker round size={104} value={form.photoURL} onChange={(v) => set({ photoURL: v })} label="Photo" sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }} />
          <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nom de l'ingrédient" value={form.nom} onChange={(e) => set({ nom: e.target.value })} required placeholder="Ex : Feuilles de ndolé" />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
              <TextField label="Unité de mesure" value={form.uniteMesure} onChange={(e) => set({ uniteMesure: e.target.value })} required placeholder="g, ml, pièce…" />
              <TextField label="Prix par unité" type="number" value={form.prix} onChange={(e) => set({ prix: e.target.value })} required inputProps={{ step: '0.01', min: 0 }}
                InputProps={{ endAdornment: <InputAdornment position="end">FCFA</InputAdornment> }} />
            </Box>
          </Box>
        </Box>

        {withStock && (
          <TextField label="Autres noms (alias)" value={form.alias} onChange={(e) => set({ alias: e.target.value })} placeholder="Ex : bitter leaf, vernonia" helperText="Utilisés aussi par la recherche" />
        )}

        <ChipSelect label="Catégorie" single allowEmpty={false} options={INGREDIENT_CATEGORIES} value={form.categorie} onChange={(v) => set({ categorie: v })} />

        {withStock && (
          <Box sx={{ p: 2, borderRadius: 4, bgcolor: 'sand.main' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase' }}>Stock</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1.2fr' } }}>
              <TextField label="Quantité en stock" type="number" value={form.stockQuantity} onChange={(e) => set({ stockQuantity: e.target.value })} required inputProps={{ step: '0.01' }}
                InputProps={{ endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }} />
              <TextField label="Seuil minimum" type="number" value={form.seuilMinimum} onChange={(e) => set({ seuilMinimum: e.target.value })} inputProps={{ step: '0.01' }}
                helperText="Alerte en dessous" InputProps={{ endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }} />
              <TextField label="Péremption" type="date" value={form.datePeremption} onChange={(e) => set({ datePeremption: e.target.value })} InputLabelProps={{ shrink: true }}
                sx={{ gridColumn: { xs: 'span 2', sm: 'auto' } }} />
            </Box>
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}
      </Box>
    </ResponsiveDialog>
  );
}
