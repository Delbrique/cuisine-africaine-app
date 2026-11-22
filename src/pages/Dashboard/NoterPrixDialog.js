// Saisie d'un achat : prix payé, quantité, unité, lieu. Alimente les prix de la communauté
// (anonyme) et les dépenses de la famille (privé).
import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete, Box, Button, Checkbox, CircularProgress, FormControlLabel, InputAdornment, TextField, Typography,
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { ResponsiveDialog } from '../../components/ui';
import { LIEUX, TYPES } from '../../services/lieuxService';
import { UNITES_COURANTES, noterAchat, uniteReference } from '../../services/prixService';
import { updateIngredient } from '../../services/ingredientService';
import { formatFcfa, friendlyError } from '../../utils';

const LIEU_KEY = 'libiyo:dernierLieu';
const lieuxTries = [...LIEUX].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

export default function NoterPrixDialog({ open, onClose, item, ingredient, onSaved }) {
  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [quantite, setQuantite] = useState('');
  const [unite, setUnite] = useState('');
  const [lieu, setLieu] = useState(null);
  const [pourFamille, setPourFamille] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNom(item?.nom || '');
    setMontant('');
    setQuantite(item?.quantite ? String(item.quantite) : '1');
    setUnite(item?.uniteMesure || 'kg');
    setPourFamille(true);
    setBusy(false);
    try {
      const id = localStorage.getItem(LIEU_KEY);
      setLieu(LIEUX.find((l) => l.id === id) || null);
    } catch { setLieu(null); }
  }, [open, item]);

  const unitaire = useMemo(() => {
    const m = Number(montant); const q = Number(quantite);
    return m > 0 && q > 0 ? m / q : null;
  }, [montant, quantite]);

  // Le prix peut-il être reporté sur l'ingrédient de la famille (unités compatibles) ?
  const compatible = ingredient && uniteReference(unite).unite === uniteReference(ingredient.uniteMesure || '').unite;

  const save = async () => {
    setBusy(true);
    try {
      await noterAchat({ nom, montant, quantite, unite, lieu });
      if (lieu) try { localStorage.setItem(LIEU_KEY, lieu.id); } catch { /* stockage indisponible */ }
      if (pourFamille && compatible && unitaire) {
        // Prix ramené à l'unité de l'ingrédient (ex. payé au kg, ingrédient en g).
        const prixRef = Number(montant) / (Number(quantite) * uniteReference(unite).facteur);
        const prixIngredient = Math.round(prixRef * uniteReference(ingredient.uniteMesure).facteur * 100) / 100;
        await updateIngredient(ingredient.id, { prix: prixIngredient });
      }
      enqueueSnackbar(`Merci ! Prix de « ${nom} » enregistré${lieu ? ` (${lieu.nom})` : ''}.`, { variant: 'success' });
      onSaved?.();
      onClose();
    } catch (err) {
      enqueueSnackbar(friendlyError(err), { variant: 'error' });
      setBusy(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title="J'ai payé…"
      onSubmit={save}
      actions={
        <>
          <Button color="inherit" onClick={onClose} disabled={busy}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={busy || !nom || !unitaire} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>
            Enregistrer
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Produit" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <TextField
          label="Prix payé" type="number" value={montant} onChange={(e) => setMontant(e.target.value)} required autoFocus
          inputProps={{ min: 1, step: 1, inputMode: 'numeric' }}
          InputProps={{ endAdornment: <InputAdornment position="end">FCFA</InputAdornment> }}
        />
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField label="Quantité" type="number" value={quantite} onChange={(e) => setQuantite(e.target.value)} required sx={{ flex: 1 }} inputProps={{ min: 0, step: 'any', inputMode: 'decimal' }} />
          <Autocomplete
            freeSolo options={UNITES_COURANTES} value={unite} onInputChange={(_, v) => setUnite(v)} sx={{ flex: 1 }}
            renderInput={(params) => <TextField {...params} label="Unité" required />}
          />
        </Box>
        <Autocomplete
          options={lieuxTries} value={lieu} onChange={(_, v) => setLieu(v)}
          getOptionLabel={(o) => o.nom} isOptionEqualToValue={(a, b) => a.id === b.id}
          groupBy={(o) => TYPES[o.type].pluriel}
          renderInput={(params) => <TextField {...params} label="Où ? (facultatif)" placeholder="Marché Nsam, Santa Lucia…" />}
        />
        {unitaire && (
          <Typography variant="body2" color="text.secondary">
            Soit <b>{formatFcfa(unitaire)}</b> par {unite || 'unité'}.
          </Typography>
        )}
        {compatible && (
          <FormControlLabel
            control={<Checkbox checked={pourFamille} onChange={(e) => setPourFamille(e.target.checked)} />}
            label="Utiliser ce prix pour ma famille (catalogue d'ingrédients)"
          />
        )}
        <Typography variant="caption" color="text.secondary">
          Le prix est partagé anonymement avec les autres familles de {lieu ? 'ce lieu' : 'Yaoundé'} : personne ne sait qui l'a payé.
          La dépense, elle, reste privée à votre famille.
        </Typography>
      </Box>
    </ResponsiveDialog>
  );
}
