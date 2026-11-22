import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Button, ButtonBase, Card, Checkbox, CircularProgress, IconButton, InputAdornment, LinearProgress, ListItemIcon, ListItemText, Menu, MenuItem,
  TextField, Tooltip, Typography,
} from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import ShoppingBasketRoundedIcon from '@mui/icons-material/ShoppingBasketRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import jsPDF from 'jspdf';
import { closeSnackbar, enqueueSnackbar } from 'notistack';

import { updateIngredientStock, getIngredientById, getIngredients } from '../../services/ingredientService';
import { SHOPPING_EVENT, dismissAuto, readShoppingList, writeShoppingList } from '../../services/shoppingList';
import { getPlats } from '../../services/platService';
import { getMostRecentPlanning } from '../../services/planningService';
import { getMembres } from '../../services/membreService';
import { EmptyState, PageHeader, patternBg, useConfirm } from '../../components/ui';
import { formatFcfa, formatNumber, friendlyError } from '../../utils';
import { tint } from '../../theme/theme';
import {
  annulerAchat, depensesSemaine, getBudget, ilYa, prixCommunautaire, setBudget, statsPrix,
} from '../../services/prixService';
import NoterPrixDialog from './NoterPrixDialog';

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const today = () => new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');

const aggregateIngredients = (meals, plats, stock) => {
  const agg = {};
  meals.forEach(({ platId }) => {
    const plat = plats.find((p) => p.id === platId);
    (plat?.ingredientsNecessaires || []).forEach((ing) => {
      const q = parseFloat(ing.quantite) || 0;
      if (agg[ing.ingredientId]) agg[ing.ingredientId].quantite += q;
      else {
        const s = stock.find((x) => x.id === ing.ingredientId);
        agg[ing.ingredientId] = {
          ingredientId: ing.ingredientId, nom: ing.nom, quantite: q, uniteMesure: ing.uniteMesure,
          prixUnitaire: parseFloat(s?.prix) || 0, checked: false,
        };
      }
    });
  });
  return Object.values(agg);
};

const SOURCE_LABEL = {
  famille: 'votre prix',
  communaute: (n) => `prix Yaoundé · ${n} relevé${n > 1 ? 's' : ''}`,
  memorise: 'prix mémorisé',
};

function Item({ item, cost, onToggle, onRemove, onNoterPrix }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, pl: 0.5, pr: 1, borderRadius: 3, transition: 'background .15s', '&:hover': { bgcolor: 'sand.main' }, '&:hover .rm': { opacity: 1 } }}>
      <Checkbox
        checked={Boolean(item.checked)} onChange={onToggle}
        icon={<RadioButtonUncheckedRoundedIcon />} checkedIcon={<CheckCircleRoundedIcon />} color="secondary"
      />
      <ButtonBase onClick={onToggle} sx={{ flex: 1, minWidth: 0, justifyContent: 'flex-start', textAlign: 'left', py: 1, borderRadius: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 650, textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'text.secondary' : 'text.primary' }} noWrap>
            {item.nom}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatNumber(item.quantite)} {item.uniteMesure}
            {item.auto && <Box component="span" sx={{ ml: 1, color: 'warning.main', fontWeight: 700 }}>· Stock bas</Box>}
            {item.stocked && <Box component="span" sx={{ ml: 1, color: 'success.main', fontWeight: 700 }}>· Ajouté au stock</Box>}
          </Typography>
        </Box>
      </ButtonBase>
      <Box sx={{ textAlign: 'right' }}>
        <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap', color: item.checked ? 'text.secondary' : 'text.primary' }}>
          {cost.unit === null ? 'Prix ?' : formatFcfa(cost.total)}
        </Typography>
        {cost.unit !== null && (
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', display: 'block' }}>
            {formatFcfa(cost.unit)} / {item.uniteMesure || 'unité'}
          </Typography>
        )}
        {cost.source && (
          <Typography variant="caption" sx={{ whiteSpace: 'nowrap', color: cost.source === 'communaute' ? 'secondary.main' : 'text.secondary', fontWeight: 600 }}>
            {cost.source === 'communaute' ? SOURCE_LABEL.communaute(cost.n) : SOURCE_LABEL[cost.source]}
          </Typography>
        )}
      </Box>
      <Tooltip title="J'ai payé… (noter le prix réel)">
        <IconButton size="small" onClick={onNoterPrix} aria-label="Noter le prix payé" sx={{ color: 'secondary.main' }}>
          <ReceiptLongRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Retirer de la liste">
        <IconButton className="rm" size="small" onClick={onRemove} sx={{ opacity: { xs: 1, md: 0 } }}><CloseRoundedIcon fontSize="small" /></IconButton>
      </Tooltip>
    </Box>
  );
}

function ListeMarchePage() {
  const [shoppingList, setShoppingList] = useState([]);
  const [allPlats, setAllPlats] = useState([]);
  const [stock, setStock] = useState([]);
  const [membres, setMembres] = useState([]);
  const [busy, setBusy] = useState('');
  const [menu, setMenu] = useState(null);
  const [stats, setStats] = useState(null); // prix de la communauté
  const [noter, setNoter] = useState({ open: false, item: null });
  const [budget, setBudgetState] = useState(0);
  const [depenses, setDepenses] = useState([]);
  const [editBudget, setEditBudget] = useState(null); // valeur en cours de saisie
  const confirm = useConfirm();

  const loadBudget = useCallback(async () => {
    try {
      const [b, d] = await Promise.all([getBudget(), depensesSemaine()]);
      setBudgetState(b);
      setDepenses(d);
    } catch (err) {
      console.error('Budget indisponible :', err);
    }
  }, []);

  useEffect(() => { loadBudget(); }, [loadBudget]);

  // Prix de la communauté pour les articles de la liste (rechargés quand la liste change de produits).
  const nomsListe = useMemo(() => [...new Set(shoppingList.map((i) => i.nom).filter(Boolean))].sort().join('|'), [shoppingList]);
  const loadStats = useCallback(() => {
    if (!nomsListe) { setStats(new Map()); return; }
    statsPrix(nomsListe.split('|')).then(setStats).catch((err) => { console.error('Prix communautaires indisponibles :', err); setStats(new Map()); });
  }, [nomsListe]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const fetchData = async () => {
    try {
      const [p, s, m] = await Promise.all([getPlats(), getIngredients(), getMembres()]);
      setAllPlats(p);
      setStock(s);
      setMembres(m);
      return { plats: p, stock: s };
    } catch (err) {
      enqueueSnackbar('Erreur lors du chargement des plats, ingrédients ou membres.', { variant: 'error' });
      return { plats: allPlats, stock };
    }
  };

  useEffect(() => {
    setShoppingList(readShoppingList());
    fetchData();
    // La liste peut changer ailleurs (ajout automatique d'un produit presque épuisé, autre onglet…).
    const reload = () => setShoppingList(readShoppingList());
    window.addEventListener(SHOPPING_EVENT, reload);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener(SHOPPING_EVENT, reload);
      window.removeEventListener('storage', reload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (list) => { setShoppingList(list); writeShoppingList(list); };

  const handleGenerate = async () => {
    setBusy('gen');
    try {
      let plats = allPlats;
      let stk = stock;
      if (!plats.length || !stk.length) ({ plats, stock: stk } = await fetchData());
      const recent = await getMostRecentPlanning();
      const meals = [];
      Object.values(recent?.planning || {}).forEach((d) => Object.values(d).forEach((m) => m?.platId && meals.push({ platId: m.platId })));
      if (!meals.length) {
        enqueueSnackbar("Aucun plat n'est planifié cette semaine. Remplissez d'abord le planning.", { variant: 'warning' });
        return;
      }
      const list = aggregateIngredients(meals, plats, stk);
      // Le stock n'est plus rechargé ici : il l'est quand on coche l'article au marché.
      // Les produits ajoutés automatiquement (stock bas) sont conservés et cumulés.
      readShoppingList().filter((i) => i.auto).forEach((a) => {
        const same = list.find((x) => x.ingredientId === a.ingredientId);
        if (same) same.quantite += a.quantite;
        else list.push({ ...a, checked: false, stocked: false });
      });
      update(list);
      enqueueSnackbar(`Liste générée : ${list.length} ingrédient(s) pour la semaine.`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(`Erreur lors de la génération : ${friendlyError(err)}`, { variant: 'error' });
    } finally {
      setBusy('');
    }
  };

  const handleClearAll = async () => {
    setMenu(null);
    if (!(await confirm({ title: 'Vider la liste de marché ?', message: 'Tous les articles seront retirés.', confirmLabel: 'Vider' }))) return;
    // Les produits ajoutés automatiquement ne reviennent pas tant que leur stock n'est pas rétabli.
    shoppingList.filter((i) => i.auto).forEach((i) => dismissAuto(i.ingredientId));
    update([]);
  };

  const buildPdf = () => {
    const doc = new jsPDF();
    const margin = 15;
    const width = doc.internal.pageSize.width;
    let y = margin;

    doc.setFillColor(194, 70, 26);
    doc.rect(0, 0, width, 32, 'F');
    doc.setTextColor(255, 243, 224);
    doc.setFontSize(20);
    doc.text('Liste de marché', margin, 18);
    doc.setFontSize(10);
    doc.text(`Libiyo · ${new Date().toLocaleDateString('fr-FR')}`, margin, 26);
    y = 46;
    doc.setTextColor(42, 26, 18);

    shoppingList.forEach((item) => {
      if (y > doc.internal.pageSize.height - margin - 20) { doc.addPage(); y = margin + 10; }
      doc.setDrawColor(194, 70, 26);
      doc.rect(margin, y - 4, 4, 4);
      doc.setFontSize(12);
      doc.text(`${item.nom}`, margin + 8, y);
      doc.setFontSize(10);
      doc.setTextColor(122, 100, 87);
      doc.text(`${formatNumber(item.quantite)} ${item.uniteMesure || ''}`, margin + 8, y + 5);
      const c = cost(item);
      doc.text(c.unit === null ? 'Prix inconnu' : `${Math.round(c.total)} FCFA`, width - margin, y, { align: 'right' });
      doc.setTextColor(42, 26, 18);
      doc.setDrawColor(234, 219, 198);
      doc.line(margin, y + 9, width - margin, y + 9);
      y += 16;
    });
    doc.setFontSize(14);
    doc.text(`Total estimé : ${Math.round(total)} FCFA`, width - margin, y + 8, { align: 'right' });
    return doc.output('blob');
  };

  const handleDownloadPdf = () => {
    setMenu(null);
    try {
      const url = URL.createObjectURL(buildPdf());
      const a = document.createElement('a');
      a.href = url;
      a.download = `Liste_de_Marche_${today()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      enqueueSnackbar(`Erreur lors de la génération du PDF : ${err.message}`, { variant: 'error' });
    }
  };

  // Version texte de la liste, pour WhatsApp, SMS et e-mail.
  const buildText = () => {
    const lines = shoppingList.map((i) => {
      const c = cost(i);
      const price = c.unit === null ? '' : ` — ${formatFcfa(c.total)}`;
      return `${i.checked ? '✅' : '▫️'} ${i.nom} : ${formatNumber(i.quantite)} ${i.uniteMesure || ''}${price}`;
    });
    return `🛒 Liste de marché du ${new Date().toLocaleDateString('fr-FR')}\n\n${lines.join('\n')}\n\nTotal estimé : ${formatFcfa(total)}\n\n— Libiyo`;
  };

  const familyEmails = membres.map((m) => m.email).filter((e) => e && e.includes('@'));

  /** Écran de partage natif (mobile) avec le PDF joint, sinon le texte. */
  const handleShare = async () => {
    setMenu(null);
    const file = new File([buildPdf()], `Liste_de_Marche_${today()}.pdf`, { type: 'application/pdf' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Liste de marché', text: buildText() });
      } else {
        await navigator.share({ title: 'Liste de marché', text: buildText() });
      }
    } catch (err) {
      if (err.name !== 'AbortError') enqueueSnackbar(`Partage impossible : ${err.message}`, { variant: 'error' });
    }
  };

  const handleWhatsApp = () => {
    setMenu(null);
    window.open(`https://wa.me/?text=${encodeURIComponent(buildText())}`, '_blank', 'noopener');
  };

  /**
   * E-mail à toute la famille. Si une Cloud Function d'envoi est configurée
   * (REACT_APP_EMAIL_API_URL), elle envoie le PDF en pièce jointe ; sinon on ouvre
   * la messagerie de l'appareil avec la liste dans le corps du message.
   */
  const handleSendEmail = async () => {
    setMenu(null);
    if (!process.env.REACT_APP_EMAIL_API_URL) {
      const subject = encodeURIComponent(`Liste de marché du ${new Date().toLocaleDateString('fr-FR')}`);
      const body = encodeURIComponent(`Bonjour la famille,\n\n${buildText()}`);
      window.location.href = `mailto:?bcc=${familyEmails.map(encodeURIComponent).join(',')}&subject=${subject}&body=${body}`;
      return;
    }
    setBusy('mail');
    try {
      const content = await blobToBase64(buildPdf());
      const emails = membres.filter((m) => m.email).map((m) => ({
        to: m.email,
        subject: 'Votre liste de marché !',
        body:
          `Bonjour ${m.nomComplet || ''},\n\n` +
          "Voici la liste de marché pour nos prochains repas ! N'oubliez pas que chaque dépense dans notre alimentation est un investissement dans notre bien-être et notre bonheur familial. Ensemble, faisons de chaque repas un moment spécial.\n\n" +
          'La liste de marché est jointe à cet e-mail.\n\nMerci de votre contribution !\nL\'équipe Libiyo.',
        attachment: { filename: `Liste_de_Marche_${today()}.pdf`, content, contentType: 'application/pdf' },
      }));
      const response = await fetch(process.env.REACT_APP_EMAIL_API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emails }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Erreur lors de l'envoi des e-mails.");
      }
      enqueueSnackbar('Liste envoyée par e-mail à toute la famille !', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(`Envoi impossible : ${err.message}`, { variant: 'error' });
    } finally {
      setBusy('');
    }
  };

  // Prix d'un article, par ordre de priorité :
  // 1. le prix de la famille (catalogue d'ingrédients), lu en direct ;
  // 2. le prix médian relevé par les familles de Yaoundé (90 derniers jours) ;
  // 3. l'ancien prix mémorisé dans la liste.
  const priceOf = (item) => {
    const ing = stock.find((s) => s.id === item.ingredientId);
    const live = parseFloat(ing?.prix);
    if (live > 0) return { value: live, source: 'famille' };
    const com = prixCommunautaire(stats, item.nom, item.uniteMesure || '');
    if (com) return { value: com.prix, source: 'communaute', n: com.n };
    const saved = parseFloat(item.prixUnitaire);
    return saved > 0 ? { value: saved, source: 'memorise' } : { value: null, source: null };
  };
  const cost = (item) => {
    const p = priceOf(item);
    return { unit: p.value, source: p.source, n: p.n, total: (p.value || 0) * (parseFloat(item.quantite) || 0) };
  };
  const total = shoppingList.reduce((s, i) => s + cost(i).total, 0);
  const missingPrices = shoppingList.filter((i) => priceOf(i).value === null).length;
  const depense = depenses.reduce((s, d) => s + (Number(d.montant) || 0), 0);
  const resteBudget = budget - depense;

  const ouvrirNoter = (item) => setNoter({ open: true, item });
  const apresAchat = () => { loadBudget(); loadStats(); fetchData(); };

  const enregistrerBudget = async () => {
    const v = Math.max(0, Math.round(Number(editBudget) || 0));
    setEditBudget(null);
    try {
      await setBudget(v);
      setBudgetState(v);
      enqueueSnackbar(`Budget de la semaine : ${formatFcfa(v)}.`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(friendlyError(err), { variant: 'error' });
    }
  };

  const pctBudget = budget > 0 ? Math.min(100, (depense / budget) * 100) : 0;
  const budgetCard = (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="overline" color="text.secondary">Budget de la semaine</Typography>
        {editBudget === null && (
          <Tooltip title="Modifier le budget">
            <IconButton size="small" onClick={() => setEditBudget(budget ? String(budget) : '')} aria-label="Modifier le budget"><EditRoundedIcon fontSize="small" /></IconButton>
          </Tooltip>
        )}
      </Box>
      {editBudget !== null ? (
        <Box component="form" onSubmit={(e) => { e.preventDefault(); enregistrerBudget(); }} sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            size="small" type="number" autoFocus value={editBudget} onChange={(e) => setEditBudget(e.target.value)} sx={{ flex: 1 }}
            inputProps={{ min: 0, step: 1, inputMode: 'numeric' }} InputProps={{ endAdornment: <InputAdornment position="end">FCFA</InputAdornment> }}
          />
          <Button type="submit" variant="contained">OK</Button>
        </Box>
      ) : budget > 0 ? (
        <>
          <Typography sx={{ fontFamily: '"Fraunces Variable", serif', fontWeight: 700, fontSize: 28, lineHeight: 1.1 }}>{formatFcfa(budget)}</Typography>
          <LinearProgress
            variant="determinate" value={pctBudget} sx={{ my: 1.5 }}
            color={depense > budget ? 'error' : pctBudget > 85 ? 'warning' : 'secondary'}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Dépensé : <b>{formatFcfa(depense)}</b></Typography>
            <Typography variant="body2" sx={{ color: resteBudget < 0 ? 'error.main' : 'text.primary' }}>
              {resteBudget < 0 ? 'Dépassé : ' : 'Reste : '}<b>{formatFcfa(Math.abs(resteBudget))}</b>
            </Typography>
          </Box>
          {shoppingList.length > 0 && total > Math.max(0, resteBudget) && (
            <Typography variant="body2" sx={{ mt: 1.5, color: 'warning.main', fontWeight: 600 }}>
              La liste ({formatFcfa(total)}) dépasse ce qu'il reste du budget.
            </Typography>
          )}
        </>
      ) : (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Fixez un budget pour suivre vos dépenses de marché de la semaine.
          </Typography>
          <Button variant="outlined" size="small" onClick={() => setEditBudget('')}>Définir mon budget</Button>
          {depense > 0 && <Typography variant="body2" sx={{ mt: 1.5 }}>Dépensé cette semaine : <b>{formatFcfa(depense)}</b></Typography>}
        </Box>
      )}

      {depenses.length > 0 && (
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ACHATS DE LA SEMAINE</Typography>
          {depenses.slice(0, 6).map((d) => (
            <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 650 }} noWrap>{d.nom}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                  {[ilYa(d.date), d.lieuNom].filter(Boolean).join(' · ')}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatFcfa(d.montant)}</Typography>
              <Tooltip title="Annuler cet achat">
                <IconButton size="small" onClick={() => annuler(d)} aria-label="Annuler cet achat"><UndoRoundedIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
          ))}
          {depenses.length > 6 && <Typography variant="caption" color="text.secondary">+ {depenses.length - 6} autre(s)</Typography>}
        </Box>
      )}
    </Card>
  );

  const annuler = async (d) => {
    if (!(await confirm({ title: `Annuler l'achat « ${d.nom} » ?`, message: `${formatFcfa(d.montant)} seront retirés des dépenses de la semaine.`, confirmLabel: 'Annuler l\'achat' }))) return;
    try {
      await annulerAchat(d);
      loadBudget();
      loadStats();
    } catch (err) {
      enqueueSnackbar(friendlyError(err), { variant: 'error' });
    }
  };
  const remaining = shoppingList.filter((i) => !i.checked);
  const done = shoppingList.filter((i) => i.checked);
  const progress = shoppingList.length ? (done.length / shoppingList.length) * 100 : 0;
  /**
   * Cocher un article = il est acheté : sa quantité est ajoutée au stock.
   * Le décocher annule cette recharge (sans compter de consommation).
   */
  const toggle = async (id) => {
    const item = shoppingList.find((i) => i.ingredientId === id);
    if (!item) return;
    const checked = !item.checked;
    let stocked = Boolean(item.stocked);
    const q = parseFloat(item.quantite) || 0;
    // Mise à jour immédiate de l'affichage, le stock suit.
    update(shoppingList.map((i) => (i.ingredientId === id ? { ...i, checked } : i)));
    try {
      const ing = await getIngredientById(id); // null si l'ingrédient a été supprimé

      if (ing && q > 0 && checked && !stocked) {
        await updateIngredientStock(id, q, ing.status);
        stocked = true;
        enqueueSnackbar(`Stock de « ${item.nom} » rechargé : +${formatNumber(q)} ${item.uniteMesure || ''}`, { variant: 'success' });
      } else if (ing && q > 0 && !checked && stocked) {
        await updateIngredientStock(id, -q, ing.status, { countConsumption: false });
        stocked = false;
        enqueueSnackbar(`Recharge de « ${item.nom} » annulée.`, { variant: 'info' });
      }
    } catch (err) {
      enqueueSnackbar(`Stock non mis à jour : ${friendlyError(err)}`, { variant: 'error' });
    }
    update(readShoppingList().map((i) => (i.ingredientId === id ? { ...i, checked, stocked } : i)));
    // Article acheté : on propose de noter le prix réel payé.
    if (checked) {
      enqueueSnackbar(`Combien avez-vous payé « ${item.nom} » ?`, {
        variant: 'info',
        autoHideDuration: 7000,
        action: (key) => (
          <Button color="inherit" size="small" onClick={() => { closeSnackbar(key); ouvrirNoter(item); }}>Noter le prix</Button>
        ),
      });
    }
  };
  const remove = (id) => {
    if (shoppingList.find((i) => i.ingredientId === id)?.auto) dismissAuto(id);
    update(shoppingList.filter((i) => i.ingredientId !== id));
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Organisation"
        title="Liste de marché"
        subtitle="Générée à partir du planning, à cocher directement au marché."
        actions={
          <>
            <Button variant="contained" onClick={handleGenerate} disabled={Boolean(busy)}
              startIcon={busy === 'gen' ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeRoundedIcon />}>
              Générer depuis le planning
            </Button>
            {shoppingList.length > 0 && (
              <IconButton onClick={(e) => setMenu(e.currentTarget)} sx={{ border: '1.5px solid', borderColor: 'divider' }} aria-label="Plus d'actions">
                {busy === 'mail' ? <CircularProgress size={20} /> : <MoreHorizRoundedIcon />}
              </IconButton>
            )}
          </>
        }
      />
      <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {typeof navigator !== 'undefined' && navigator.share && (
          <MenuItem onClick={handleShare}><ListItemIcon><IosShareRoundedIcon /></ListItemIcon><ListItemText primary="Partager…" secondary="PDF via WhatsApp, Gmail, SMS…" /></MenuItem>
        )}
        <MenuItem onClick={handleWhatsApp}><ListItemIcon><WhatsAppIcon sx={{ color: '#25D366' }} /></ListItemIcon><ListItemText>Envoyer sur WhatsApp</ListItemText></MenuItem>
        <MenuItem onClick={handleSendEmail} disabled={familyEmails.length === 0}>
          <ListItemIcon><EmailRoundedIcon /></ListItemIcon>
          <ListItemText primary="E-mail à la famille" secondary={`${familyEmails.length} destinataire(s)`} />
        </MenuItem>
        <MenuItem onClick={handleDownloadPdf}><ListItemIcon><PictureAsPdfRoundedIcon /></ListItemIcon><ListItemText>Télécharger en PDF</ListItemText></MenuItem>
        <MenuItem onClick={handleClearAll} sx={{ color: 'error.main' }}><ListItemIcon><DeleteSweepRoundedIcon color="error" /></ListItemIcon><ListItemText>Vider la liste</ListItemText></MenuItem>
      </Menu>

      {shoppingList.length === 0 ? (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 320px' }, alignItems: 'start' }}>
          <EmptyState
            icon={<ShoppingBasketRoundedIcon />} title="Votre panier est vide"
            description="Générez la liste à partir du planning de la semaine, ou ajoutez les ingrédients d'un plat depuis le planning."
            action={<Button variant="contained" startIcon={<AutoAwesomeRoundedIcon />} onClick={handleGenerate} disabled={Boolean(busy)}>Générer la liste</Button>}
          />
          {budgetCard}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 320px' }, alignItems: 'start' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Card sx={{ p: 1.5 }}>
              <Typography variant="overline" color="text.secondary" sx={{ px: 1.5 }}>À acheter · {remaining.length}</Typography>
              {remaining.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, m: 1, p: 2, borderRadius: 3, bgcolor: tint('success', 0.1), color: 'success.main' }}>
                  <CheckCircleRoundedIcon /><Typography sx={{ fontWeight: 700 }}>Tout est dans le panier, bon retour du marché !</Typography>
                </Box>
              ) : (
                remaining.map((i) => <Item key={i.ingredientId} item={i} cost={cost(i)} onToggle={() => toggle(i.ingredientId)} onRemove={() => remove(i.ingredientId)} onNoterPrix={() => ouvrirNoter(i)} />)
              )}
            </Card>
            {done.length > 0 && (
              <Card sx={{ p: 1.5, opacity: 0.85 }}>
                <Typography variant="overline" color="text.secondary" sx={{ px: 1.5 }}>Dans le panier · {done.length}</Typography>
                {done.map((i) => <Item key={i.ingredientId} item={i} cost={cost(i)} onToggle={() => toggle(i.ingredientId)} onRemove={() => remove(i.ingredientId)} onNoterPrix={() => ouvrirNoter(i)} />)}
              </Card>
            )}
          </Box>

          <Box sx={{ position: { md: 'sticky' }, top: { md: 24 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ borderRadius: 6, p: 3, color: '#FFF3E0', background: `${patternBg('#FFF3E0', 0.1)}, linear-gradient(140deg, #2F8F5B, #1F6B42)`, boxShadow: '0 20px 50px rgba(31,107,66,.3)' }}>
            <Typography variant="overline" sx={{ opacity: 0.8 }}>Coût estimé de la liste</Typography>
            <Typography sx={{ fontFamily: '"Fraunces Variable", serif', fontWeight: 700, fontSize: { xs: 34, md: 30, lg: 34 }, lineHeight: 1.1, mb: 2.5, overflowWrap: 'anywhere' }}>{formatFcfa(total)}</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontWeight: 650 }}>Progression</Typography>
              <Typography sx={{ fontWeight: 800 }}>{done.length}/{shoppingList.length}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ bgcolor: 'rgba(255,243,224,.2)', '& .MuiLinearProgress-bar': { bgcolor: '#F2A93B' } }} />
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
              Reste à dépenser : <b>{formatFcfa(remaining.reduce((s, i) => s + cost(i).total, 0))}</b>
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1.5, opacity: 0.75 }}>
              {missingPrices > 0
                ? `${missingPrices} article(s) sans prix : au marché, touchez l'icône « reçu » pour noter ce que vous payez.`
                : 'Vos prix, complétés par les prix relevés à Yaoundé.'}
            </Typography>
          </Box>
          {budgetCard}
          </Box>
        </Box>
      )}

      <NoterPrixDialog
        open={noter.open}
        item={noter.item}
        ingredient={noter.item ? stock.find((s) => s.id === noter.item.ingredientId) : null}
        onClose={() => setNoter({ open: false, item: null })}
        onSaved={apresAchat}
      />
    </Box>
  );
}

export default ListeMarchePage;
