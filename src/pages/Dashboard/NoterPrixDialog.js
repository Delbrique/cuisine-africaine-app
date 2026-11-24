// Saisie d'un achat : prix payé, quantité, unité, lieu. Alimente les prix de la communauté
// (anonyme) et les dépenses de la famille (privé).
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Checkbox, CircularProgress, FormControlLabel, InputAdornment, TextField, Typography,
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { ResponsiveDialog } from '../../components/ui';
import { LIEUX, TYPES } from '../../services/lieuxService';
import {
  UNITES_COURANTES, controlePrix, noterAchat, statsPrix, uniteReference, uniteSaisie,
} from '../../services/prixService';
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
  const [stats, setStats] = useState(null);
  const [confirme, setConfirme] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNom(item?.nom || '');
    setMontant('');
    // Quantité à 1 par défaut : la quantité de la liste (cumul de la semaine) faussait le prix unitaire.
    setQuantite('1');
    setUnite(uniteSaisie(item?.uniteMesure || 'kg'));
    setPourFamille(true);
    setBusy(false);
    setConfirme(false);
    setStats(null);
    if (item?.nom) statsPrix([item.nom]).then(setStats).catch(() => setStats(new Map()));
    try {
      const id = localStorage.getItem(LIEU_KEY);
      setLieu(LIEUX.find((l) => l.id === id) || null);
    } catch { setLieu(null); }
  }, [open, item]);

  useEffect(() => { setConfirme(false); }, [montant, quantite, unite]);

  const unitaire = useMemo(() => {
    const m = Number(montant); const q = Number(quantite);
    return m > 0 && q > 0 ? m / q : null;
  }, [montant, quantite]);

  // Le prix peut-il être reporté sur l'ingrédient de la famille (unités compatibles) ?
  const refSaisie = uniteReference(uniteSaisie(unite));
  const compatible = ingredient && refSaisie.unite === uniteReference(ingredient.uniteMesure || '').unite;

  // Contrôle : prix au kg / à la pièce comparé au prix habituel (relevés de Yaoundé, sinon prix de la famille).
  const prixRef = unitaire ? unitaire / refSaisie.facteur : null;
  const reference = (() => {
    for (const parUnite of stats?.values?.() || []) {
      const s = parUnite.get(refSaisie.unite);
      if (s && s.n >= 2) return s.mediane;
    }
    const pf = parseFloat(ingredient?.prix);
    if (pf > 0 && compatible) return pf / uniteReference(ingredient.uniteMesure || '').facteur;
    return null;
  })();
  const controle = controlePrix(prixRef, reference);

  const save = async () => {
    if (controle?.inhabituel && !confirme) { setConfirme(true); return; }
    setBusy(true);
    try {
      await noterAchat({ nom, montant, quantite, unite, lieu });
      if (lieu) try { localStorage.setItem(LIEU_KEY, lieu.id); } catch { /* stockage indisponible */ }
      if (pourFamille && compatible && unitaire) {
        // Prix ramené à l'unité de l'ingrédient (ex. payé au kg, ingrédient en g).
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
          <Button
            type="submit" variant="contained" color={confirme ? 'warning' : 'primary'}
            disabled={busy || !nom || !unitaire} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {confirme ? 'Enregistrer quand même' : 'Enregistrer'}
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
            Soit <b>{formatFcfa(unitaire)}</b> par {unite || 'unité'}
            {refSaisie.facteur !== 1 && prixRef ? <> (<b>{formatFcfa(prixRef)}</b> par {refSaisie.unite})</> : null}.
          </Typography>
        )}
        {controle?.inhabituel && (
          <Alert severity="warning">
            <b>Prix inhabituel :</b> {formatFcfa(prixRef)} par {refSaisie.unite}, alors qu'il est d'habitude
            d'environ {formatFcfa(controle.reference)}. Vérifiez le <b>prix payé</b> et la <b>quantité</b>
            {confirme ? ', puis touchez « Enregistrer quand même » si c\'est bien correct.' : '.'}
          </Alert>
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
