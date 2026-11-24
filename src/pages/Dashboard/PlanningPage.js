// src/pages/Dashboard/PlanningPage.js
import React, { useEffect, useMemo, useState } from 'react';
import html2pdf from 'html2pdf.js';
import {
  Box, Button, ButtonBase, Card, CircularProgress, IconButton, InputAdornment, ListItemIcon, ListItemText, Menu,
  MenuItem, TextField, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ShuffleRoundedIcon from '@mui/icons-material/ShuffleRounded';
import BreakfastDiningRoundedIcon from '@mui/icons-material/BreakfastDiningRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { enqueueSnackbar } from 'notistack';

import { getPlats } from '../../services/platService';
import { createPlanning, getMostRecentPlanning, updatePlanning } from '../../services/planningService';
import { updateIngredientStock, getIngredientById, getIngredients } from '../../services/ingredientService';
import { addToShoppingList as addItemsToShoppingList } from '../../services/shoppingList';
import { auth } from '../../firebase/firebase';
import { DishImage, PageHeader, ResponsiveDialog } from '../../components/ui';
import SplashScreen from '../../components/SplashScreen';
import { JOURS, REPAS } from '../../constants';
import { formatFcfa, friendlyError, normalize, todayKey } from '../../utils';
import { getMembres } from '../../services/membreService';
import { coutPlat, getBudget, statsPrix } from '../../services/prixService';
import { composerSemaine } from '../../services/menuIntelligent';
import { arrondi } from './PlatsEtIngredients/PlatCard';
import { tint } from '../../theme/theme';

const typesRepas = REPAS.map((r) => r.key);
const emptySlot = () => ({ platId: '', nomPlat: '', photoURL: '' });
const emptyWeek = () => JOURS.reduce((acc, d) => ({ ...acc, [d]: { petitDejeuner: emptySlot(), dejeuner: emptySlot(), diner: emptySlot() } }), {});

const getMondayOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  return new Date(d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)));
};
const getSundayOfWeek = (date) => {
  const d = new Date(getMondayOfWeek(date));
  return new Date(d.setDate(d.getDate() + 6));
};
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '');

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** Résumé discret de la semaine générée : budget, anti-gaspillage, allergies, conseils santé. */
function ResumeSemaine({ r, onClose }) {
  const lignes = [];
  if (r.total <= 0) {
    lignes.push({ texte: 'Coût de la semaine pas encore estimable : renseignez des prix (« J\'ai payé… » au marché).' });
  } else if (r.budget > 0) {
    lignes.push(r.depassement > 0
      ? { ton: 'warning.main', texte: `Coût estimé ${formatFcfa(arrondi(r.total))} : ${formatFcfa(arrondi(r.depassement))} au-dessus du budget (${formatFcfa(r.budget)}).` }
      : { ton: 'success.main', texte: `Coût estimé ${formatFcfa(arrondi(r.total))}, dans le budget de ${formatFcfa(r.budget)}${r.inconnus ? ` (${r.inconnus} repas sans prix)` : ''}.` });
  } else {
    lignes.push({ texte: `Coût estimé : ${formatFcfa(arrondi(r.total))}${r.inconnus ? ` (${r.inconnus} repas sans prix)` : ''}.` });
  }
  if (r.antiGaspi.length) lignes.push({ ton: 'success.main', texte: `Anti-gaspillage : ${r.antiGaspi.map((a) => a.nom).join(', ')} cuisiné${r.antiGaspi.length > 1 ? 's' : ''} avant péremption.` });
  if (r.exclus.length) lignes.push({ texte: `${r.exclus.length} plat${r.exclus.length > 1 ? 's' : ''} écarté${r.exclus.length > 1 ? 's' : ''} pour allergie : ${r.exclus.map((e) => `${e.plat} – ${e.raison}`).join(' · ')}.` });
  r.conseils.forEach((c) => lignes.push({ texte: c }));
  if (!lignes.length) return null;
  return (
    <Card sx={{ p: 2, mb: 2.5, position: 'relative' }}>
      <IconButton size="small" onClick={onClose} aria-label="Fermer le résumé" sx={{ position: 'absolute', top: 8, right: 8 }}><CloseRoundedIcon fontSize="small" /></IconButton>
      <Typography variant="overline" color="text.secondary">Votre semaine</Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5, pr: 4, '& li': { mb: 0.5 } }}>
        {lignes.map((l) => <Typography component="li" key={l.texte} variant="body2" sx={{ color: l.ton || 'text.primary' }}>{l.texte}</Typography>)}
      </Box>
      {r.conseils.length > 0 && (
        <Typography variant="caption" color="text.secondary">Conseils généraux, qui ne remplacent pas l'avis d'un médecin.</Typography>
      )}
    </Card>
  );
}

/** Case d'un repas dans le tableau de la semaine. */
function MealSlot({ meal, slot, plat, onPick, onClear, onCart, big }) {
  if (!slot.platId) {
    return (
      <ButtonBase
        onClick={onPick}
        sx={{
          width: '100%', height: big ? 120 : 132, borderRadius: 3.5, border: '2px dashed', borderColor: 'divider', flexDirection: 'column', gap: 0.5,
          color: 'text.secondary', transition: 'all .2s', '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: tint('primary', 0.04) },
        }}
      >
        <AddRoundedIcon />
        <Typography variant="caption" sx={{ fontWeight: 700 }}>{meal.label}</Typography>
      </ButtonBase>
    );
  }
  return (
    <Box sx={{ position: 'relative', borderRadius: 3.5, overflow: 'hidden', boxShadow: '0 6px 18px rgba(31,20,16,.1)', '&:hover .tools': { opacity: 1 } }}>
      <ButtonBase onClick={onPick} sx={{ display: 'block', width: '100%', textAlign: 'left' }}>
        <DishImage src={plat?.photoURL || slot.photoURL} name={slot.nomPlat} height={big ? 120 : 132}>
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(20,12,8,.85) 100%)' }} />
          <Box sx={{ position: 'absolute', left: 10, right: 10, bottom: 8, color: '#fff' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.8 }}>{meal.label}</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {slot.nomPlat}
            </Typography>
          </Box>
        </DishImage>
      </ButtonBase>
      <Box className="tools" sx={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 0.5, opacity: { xs: 1, md: 0 }, transition: 'opacity .2s' }}>
        <Tooltip title="Ajouter à la liste de marché">
          <IconButton size="small" onClick={onCart} sx={{ bgcolor: 'rgba(255,255,255,.9)', color: '#2A1A12', '&:hover': { bgcolor: '#fff' } }}><AddShoppingCartRoundedIcon sx={{ fontSize: 17 }} /></IconButton>
        </Tooltip>
        <Tooltip title="Retirer">
          <IconButton size="small" onClick={onClear} sx={{ bgcolor: 'rgba(255,255,255,.9)', color: '#2A1A12', '&:hover': { bgcolor: '#fff' } }}><CloseRoundedIcon sx={{ fontSize: 17 }} /></IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

/** Choix d'un plat pour un repas. */
function PlatPicker({ target, plats, used, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  useEffect(() => setSearch(''), [target]);
  if (!target) return null;
  const isBreakfast = target.meal === 'petitDejeuner';
  const list = plats
    .filter((p) => !isBreakfast || p.categoriePlat === 'Fruit')
    .filter((p) => normalize(`${p.nom} ${p.categoriePlat}`).includes(normalize(search)));
  const mealLabel = REPAS.find((r) => r.key === target.meal)?.label;

  return (
    <ResponsiveDialog open onClose={onClose} maxWidth="md" title={`${mealLabel} du ${target.day}`}>
      <TextField
        autoFocus fullWidth size="small" placeholder="Rechercher un plat…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 2 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}
      />
      {isBreakfast && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Pour le petit-déjeuner, seuls les plats de la catégorie « Fruit » sont proposés.</Typography>}
      {list.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Aucun plat disponible.</Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
          {list.map((p) => {
            const isUsed = used.includes(p.id) && p.id !== target.current;
            const isCurrent = p.id === target.current;
            return (
              <ButtonBase
                key={p.id} disabled={isUsed} onClick={() => onSelect(p)}
                sx={{
                  flexDirection: 'column', alignItems: 'stretch', borderRadius: 3, overflow: 'hidden', textAlign: 'left',
                  border: '2px solid', borderColor: isCurrent ? 'primary.main' : 'transparent', opacity: isUsed ? 0.4 : 1, bgcolor: 'sand.main',
                }}
              >
                <DishImage src={p.photoURL} name={p.nom} height={96} />
                <Box sx={{ p: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13.5 }} noWrap>{p.nom}</Typography>
                  <Typography variant="caption" color="text.secondary">{isUsed ? 'Déjà prévu cette semaine' : p.categoriePlat}</Typography>
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      )}
    </ResponsiveDialog>
  );
}

function PlanningPage() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [allPlats, setAllPlats] = useState([]);
  const [currentPlanning, setCurrentPlanning] = useState(null);
  const [picker, setPicker] = useState(null);
  const [genMenu, setGenMenu] = useState(null);
  const [resume, setResume] = useState(null); // résumé de la dernière génération
  const [day, setDay] = useState(JOURS.includes(todayKey()) ? todayKey() : 'lundi');

  const fetchData = async () => {
    setLoading(true);
    try {
      const platsData = await getPlats();
      setAllPlats(platsData);
      const recent = await getMostRecentPlanning();
      if (recent && recent.planning) {
        JOURS.forEach((d) => {
          recent.planning[d] = recent.planning[d] || {};
          typesRepas.forEach((m) => {
            const slot = recent.planning[d][m];
            if (slot && slot.platId) {
              const full = platsData.find((p) => p.id === slot.platId);
              recent.planning[d][m] = full ? { platId: full.id, nomPlat: full.nom, photoURL: full.photoURL || '' } : emptySlot();
            } else {
              recent.planning[d][m] = emptySlot();
            }
          });
        });
        setCurrentPlanning(recent);
      } else {
        setCurrentPlanning({
          id: null,
          semaineDebut: getMondayOfWeek(new Date()).toISOString().split('T')[0],
          semaineFin: getSundayOfWeek(new Date()).toISOString().split('T')[0],
          planning: emptyWeek(),
          creePar: auth.currentUser ? auth.currentUser.uid : 'anonymous',
        });
      }
    } catch (err) {
      enqueueSnackbar(`Erreur lors du chargement du planning : ${friendlyError(err)}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const usedIds = (excludeDay, excludeMeal) => {
    const ids = new Set();
    JOURS.forEach((d) => typesRepas.forEach((m) => {
      if (d === excludeDay && m === excludeMeal) return;
      const id = currentPlanning?.planning[d][m]?.platId;
      if (id) ids.add(id);
    }));
    return [...ids];
  };

  const setSlot = (d, m, value) =>
    setCurrentPlanning((prev) => ({ ...prev, planning: { ...prev.planning, [d]: { ...prev.planning[d], [m]: value } } }));

  const selectPlat = (plat) => {
    const { day: d, meal: m } = picker;
    setPicker(null);
    if (usedIds(d, m).includes(plat.id)) {
      enqueueSnackbar(`« ${plat.nom} » est déjà prévu un autre jour cette semaine.`, { variant: 'warning' });
      return;
    }
    setSlot(d, m, { platId: plat.id, nomPlat: plat.nom, photoURL: plat.photoURL || '' });
  };

  /**
   * Génère la semaine selon la famille : allergies (exclues), santé, plats préférés,
   * produits qui se périment (anti-gaspillage), budget et variété. Voir services/menuIntelligent.
   */
  const generateRandomPlanning = async () => {
    setGenMenu(null);
    setBusy('gen');
    try {
      const [membres, stock, budget] = await Promise.all([getMembres(), getIngredients(), getBudget().catch(() => 0)]);
      const noms = [...new Set(allPlats.flatMap((p) => (p.ingredientsNecessaires || []).map((i) => i.nom)).filter(Boolean))];
      const stats = noms.length ? await statsPrix(noms).catch(() => new Map()) : new Map();
      const r = composerSemaine({ plats: allPlats, membres, stock, budget, cout: (p) => coutPlat(p, { stock, stats }) });
      if (r.vide) {
        enqueueSnackbar('Aucun plat compatible avec les allergies de la famille. Ajoutez des plats depuis le catalogue.', { variant: 'warning' });
        return;
      }
      const week = emptyWeek();
      JOURS.forEach((d) => typesRepas.forEach((m) => {
        const plat = allPlats.find((p) => p.id === r.semaine[d][m]);
        if (plat) week[d][m] = { platId: plat.id, nomPlat: plat.nom, photoURL: plat.photoURL || '' };
      }));
      setCurrentPlanning((prev) => ({ ...prev, planning: week }));
      setResume(r);
      enqueueSnackbar('Semaine composée pour votre famille. Ajustez-la si besoin, puis enregistrez.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(`Génération impossible : ${friendlyError(err)}`, { variant: 'error' });
    } finally {
      setBusy('');
    }
  };

  const generateBreakfastOnly = () => {
    setGenMenu(null);
    const fruits = allPlats.filter((p) => p.categoriePlat === 'Fruit');
    if (!fruits.length) {
      enqueueSnackbar("Aucun plat de catégorie « Fruit » n'est disponible. Ajoutez-en d'abord.", { variant: 'warning' });
      return;
    }
    const used = new Set();
    const planning = { ...currentPlanning.planning };
    JOURS.forEach((d) => {
      let eligible = fruits.filter((p) => !used.has(p.id));
      if (!eligible.length) { used.clear(); eligible = fruits; }
      const p = pick(eligible);
      planning[d] = { ...planning[d], petitDejeuner: { platId: p.id, nomPlat: p.nom, photoURL: p.photoURL || '' } };
      used.add(p.id);
    });
    setCurrentPlanning((prev) => ({ ...prev, planning }));
    enqueueSnackbar('Petits-déjeuners fruités générés !', { variant: 'success' });
  };

  const handleSavePlanning = async () => {
    setBusy('save');
    try {
      const cleanPlanning = {};
      const consumed = {};
      for (const d of JOURS) {
        cleanPlanning[d] = {};
        for (const m of typesRepas) {
          const slot = currentPlanning.planning[d][m];
          if (slot && slot.platId) {
            cleanPlanning[d][m] = { platId: slot.platId, nomPlat: slot.nomPlat };
            const full = allPlats.find((p) => p.id === slot.platId);
            (full?.ingredientsNecessaires || []).forEach((ing) => {
              consumed[ing.ingredientId] = (consumed[ing.ingredientId] || 0) + ing.quantite;
            });
          } else {
            cleanPlanning[d][m] = { platId: '', nomPlat: '' };
          }
        }
      }
      // Déstockage des ingrédients consommés par la semaine planifiée.
      for (const id in consumed) {
        const ing = await getIngredientById(id);
        if (ing) await updateIngredientStock(id, -consumed[id], ing.status);
      }
      if (currentPlanning.id) {
        await updatePlanning(currentPlanning.id, { planning: cleanPlanning, semaineDebut: currentPlanning.semaineDebut, semaineFin: currentPlanning.semaineFin });
        enqueueSnackbar('Planning mis à jour et stock ajusté !', { variant: 'success' });
      } else {
        await createPlanning({
          semaineDebut: currentPlanning.semaineDebut, semaineFin: currentPlanning.semaineFin, planning: cleanPlanning,
          creePar: auth.currentUser ? auth.currentUser.uid : 'anonymous',
        });
        enqueueSnackbar('Planning créé et stock ajusté !', { variant: 'success' });
      }
      fetchData();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du planning :', err);
      enqueueSnackbar(`Erreur lors de la sauvegarde : ${friendlyError(err)}`, { variant: 'error' });
    } finally {
      setBusy('');
    }
  };

  const addToShoppingList = (platId) => {
    const plat = allPlats.find((p) => p.id === platId);
    if (!plat?.ingredientsNecessaires?.length) {
      enqueueSnackbar("Ce plat n'a pas d'ingrédients à ajouter.", { variant: 'info' });
      return;
    }
    addItemsToShoppingList(plat.ingredientsNecessaires.map((ing) => ({
      ingredientId: ing.ingredientId, nom: ing.nom, quantite: ing.quantite, uniteMesure: ing.uniteMesure, checked: false,
    })));
    enqueueSnackbar(`Ingrédients de « ${plat.nom} » ajoutés à la liste de marché.`, { variant: 'success' });
  };

  const generatePdf = () => {
    const el = document.getElementById('planning-table-container');
    if (!el) return;
    setBusy('pdf');
    html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `Planning_Repas_Semaine_du_${currentPlanning.semaineDebut}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, logging: false, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      })
      .from(el)
      .save()
      .then(() => enqueueSnackbar('PDF du planning téléchargé !', { variant: 'success' }))
      .catch((err) => enqueueSnackbar(`Erreur lors de la génération du PDF : ${err.message}`, { variant: 'error' }))
      .finally(() => setBusy(''));
  };

  const filled = useMemo(
    () => (currentPlanning ? JOURS.reduce((n, d) => n + typesRepas.filter((m) => currentPlanning.planning[d][m]?.platId).length, 0) : 0),
    [currentPlanning]
  );

  if (loading && !currentPlanning) return <SplashScreen inline label="Chargement du planning" />;
  if (!currentPlanning) return null;

  const platOf = (slot) => allPlats.find((p) => p.id === slot.platId);
  const slotProps = (d, m) => {
    const slot = currentPlanning.planning[d][m];
    return {
      meal: REPAS.find((r) => r.key === m),
      slot,
      plat: platOf(slot),
      onPick: () => setPicker({ day: d, meal: m, current: slot.platId }),
      onClear: () => setSlot(d, m, emptySlot()),
      onCart: () => addToShoppingList(slot.platId),
    };
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Organisation"
        title="Planning de la semaine"
        subtitle={`Du ${fmt(currentPlanning.semaineDebut)} au ${fmt(currentPlanning.semaineFin)} · ${filled}/21 repas prévus`}
        actions={
          <>
            <Tooltip title="Recharger"><IconButton onClick={fetchData} sx={{ border: '1.5px solid', borderColor: 'divider' }}><RefreshRoundedIcon /></IconButton></Tooltip>
            <Button
              variant="outlined" endIcon={<KeyboardArrowDownRoundedIcon />} onClick={(e) => setGenMenu(e.currentTarget)}
              startIcon={busy === 'gen' ? <CircularProgress size={16} /> : <AutoAwesomeRoundedIcon />} disabled={allPlats.length === 0 || Boolean(busy)}
            >
              Générer
            </Button>
            <Button variant="outlined" startIcon={busy === 'pdf' ? <CircularProgress size={16} /> : <PictureAsPdfRoundedIcon />} onClick={generatePdf} disabled={Boolean(busy)}>PDF</Button>
            <Button variant="contained" startIcon={busy === 'save' ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />} onClick={handleSavePlanning} disabled={Boolean(busy)}>
              Enregistrer
            </Button>
          </>
        }
      />
      <Menu anchorEl={genMenu} open={Boolean(genMenu)} onClose={() => setGenMenu(null)}>
        <MenuItem onClick={generateRandomPlanning}>
          <ListItemIcon><ShuffleRoundedIcon /></ListItemIcon>
          <ListItemText primary="Toute la semaine" secondary="Selon la famille : allergies, santé, goûts, budget, stock" />
        </MenuItem>
        <MenuItem onClick={generateBreakfastOnly} disabled={!allPlats.some((p) => p.categoriePlat === 'Fruit')}>
          <ListItemIcon><BreakfastDiningRoundedIcon /></ListItemIcon>
          <ListItemText primary="Petits-déjeuners fruités" secondary="Uniquement les matins" />
        </MenuItem>
      </Menu>

      {resume && <ResumeSemaine r={resume} onClose={() => setResume(null)} />}

      {desktop ? (
        <Box sx={{ overflowX: 'auto', mx: -1, px: 1, pb: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(128px, 1fr))', gap: 1.25, minWidth: 940 }}>
            {JOURS.map((d) => {
              const isToday = d === todayKey();
              return (
                <Card key={d} sx={{ p: 1, bgcolor: isToday ? tint('primary', 0.05) : 'background.paper', borderColor: isToday ? 'primary.main' : 'divider' }}>
                  <Box sx={{ px: 0.5, mb: 1, minHeight: 40 }}>
                    <Typography sx={{ fontFamily: '"Fraunces Variable", serif', fontWeight: 700, fontSize: 17, textTransform: 'capitalize', lineHeight: 1.2 }}>{d}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: isToday ? 'primary.main' : 'text.secondary' }}>
                      {isToday ? "Aujourd'hui" : `${typesRepas.filter((m) => currentPlanning.planning[d][m]?.platId).length}/3 repas`}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {typesRepas.map((m) => <MealSlot key={m} {...slotProps(d, m)} />)}
                  </Box>
                </Card>
              );
            })}
          </Box>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', mx: -2, px: 2, pb: 1, mb: 2, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            {JOURS.map((d) => {
              const n = typesRepas.filter((m) => currentPlanning.planning[d][m]?.platId).length;
              const on = d === day;
              return (
                <ButtonBase key={d} onClick={() => setDay(d)}
                  sx={{
                    flexShrink: 0, flexDirection: 'column', width: 62, py: 1.25, borderRadius: 4, gap: 0.5,
                    bgcolor: on ? 'primary.main' : 'background.paper', color: on ? 'primary.contrastText' : 'text.primary',
                    border: '1px solid', borderColor: on ? 'primary.main' : 'divider',
                  }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 13, textTransform: 'capitalize' }}>{d.slice(0, 3)}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.4 }}>
                    {[0, 1, 2].map((i) => <Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: i < n ? (on ? '#fff' : 'primary.main') : on ? 'rgba(255,255,255,.35)' : 'divider' }} />)}
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>
          <Typography variant="h5" sx={{ textTransform: 'capitalize', mb: 1.5 }}>{day}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {typesRepas.map((m) => <MealSlot key={m} big {...slotProps(day, m)} />)}
          </Box>
        </>
      )}

      {/* Version imprimable utilisée pour le PDF (hors écran). */}
      <Box sx={{ position: 'absolute', left: -10000, top: 0 }} aria-hidden>
        <Box id="planning-table-container" sx={{ width: 1060, p: 3, bgcolor: '#FBF5EC', color: '#2A1A12', fontFamily: 'sans-serif' }}>
          <Typography sx={{ fontFamily: '"Fraunces Variable", serif', fontSize: 26, fontWeight: 700, mb: 0.5, color: '#A9370F' }}>Planning des repas</Typography>
          <Typography sx={{ mb: 2 }}>Semaine du {fmt(currentPlanning.semaineDebut)} au {fmt(currentPlanning.semaineFin)}</Typography>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { border: '1px solid #EADBC6', p: 1, verticalAlign: 'top', fontSize: 13 } }}>
            <thead>
              <tr>
                <Box component="th" sx={{ bgcolor: '#C2461A', color: '#fff', width: 110 }}>Jour</Box>
                {REPAS.map((r) => <Box component="th" key={r.key} sx={{ bgcolor: '#C2461A', color: '#fff' }}>{r.label}</Box>)}
              </tr>
            </thead>
            <tbody>
              {JOURS.map((d) => (
                <tr key={d}>
                  <Box component="td" sx={{ fontWeight: 700, textTransform: 'capitalize', bgcolor: '#F4E9DA' }}>{d}</Box>
                  {typesRepas.map((m) => {
                    const s = currentPlanning.planning[d][m];
                    return (
                      <td key={m}>
                        {s.photoURL && <img src={s.photoURL} alt="" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, float: 'left', marginRight: 8 }} />}
                        {s.nomPlat || '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      </Box>

      <PlatPicker
        target={picker} plats={allPlats} used={picker ? usedIds(picker.day, picker.meal) : []}
        onClose={() => setPicker(null)} onSelect={selectPlat}
      />
    </Box>
  );
}

export default PlanningPage;
