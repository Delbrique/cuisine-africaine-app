// src/pages/Dashboard/StockPage.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar, Box, Button, Card, Chip, IconButton, InputAdornment, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ExposureRoundedIcon from '@mui/icons-material/ExposureRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import RemoveShoppingCartRoundedIcon from '@mui/icons-material/RemoveShoppingCartRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import { enqueueSnackbar } from 'notistack';

import {
  listenIngredients, updateIngredient, deleteIngredient, updateIngredientStock, createIngredient, INGREDIENT_STATUS,
} from '../../services/ingredientService';
import { STATUS_META, computeStatus } from '../../services/stockStatus';
import { EmptyState, LoadingGrid, PageHeader, ResponsiveDialog, StatCard, useConfirm } from '../../components/ui';
import { asText, formatDate, formatFcfa, formatNumber, friendlyError, normalize, toDate } from '../../utils';
import { tint } from '../../theme/theme';
import IngredientEditor from './PlatsEtIngredients/IngredientEditor';

const FILTERS = {
  all: () => true,
  ok: (i) => i.status === INGREDIENT_STATUS.IN_USE && !i.expiringSoon,
  low: (i) => i.status === INGREDIENT_STATUS.LOW_STOCK,
  out: (i) => i.status === INGREDIENT_STATUS.EXHAUSTED,
  exp: (i) => i.status === INGREDIENT_STATUS.EXPIRED || i.expiringSoon,
};

function StatusChip({ ing }) {
  const meta = STATUS_META[ing.status] || { label: ing.status, color: 'default' };
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      <Chip size="small" label={meta.label} color={meta.color} variant={ing.status === INGREDIENT_STATUS.IN_USE ? 'outlined' : 'filled'} />
      {ing.expiringSoon && ing.status !== INGREDIENT_STATUS.EXPIRED && <Chip size="small" label="Expire bientôt" color="warning" variant="outlined" />}
    </Box>
  );
}

function Level({ ing }) {
  const min = parseFloat(ing.seuilMinimum) || 0;
  const ref = Math.max(min * 2, ing.stockQuantity, 1);
  const color = ing.status === INGREDIENT_STATUS.EXHAUSTED ? 'error' : ing.status === INGREDIENT_STATUS.LOW_STOCK ? 'warning' : 'success';
  return (
    <Box sx={{ minWidth: 110 }}>
      <Typography sx={{ fontWeight: 700 }}>{formatNumber(ing.stockQuantity)} <Typography component="span" variant="body2" color="text.secondary">{ing.uniteMesure}</Typography></Typography>
      <LinearProgress variant="determinate" value={Math.min(100, (ing.stockQuantity / ref) * 100)} color={color} sx={{ height: 5, mt: 0.5, bgcolor: tint(color, 0.15) }} />
    </Box>
  );
}

/** Ajustement rapide de la quantité (achat ou consommation). */
function AdjustDialog({ ing, onClose, onApply }) {
  const [mode, setMode] = useState('add');
  const [qty, setQty] = useState('');
  useEffect(() => { setMode('add'); setQty(''); }, [ing]);
  const n = parseFloat(qty);
  const valid = n > 0;
  return (
    <ResponsiveDialog
      open={Boolean(ing)} onClose={onClose} maxWidth="xs" title={ing ? `Ajuster « ${ing.nom} »` : ''}
      onSubmit={() => valid && onApply(ing, mode === 'add' ? n : -n)}
      actions={<><Button color="inherit" onClick={onClose}>Annuler</Button><Button type="submit" variant="contained" disabled={!valid}>Valider</Button></>}
    >
      {ing && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography color="text.secondary">Actuellement : <b>{formatNumber(ing.stockQuantity)} {ing.uniteMesure}</b></Typography>
          <ToggleButtonGroup exclusive fullWidth value={mode} onChange={(_, v) => v && setMode(v)} sx={{ '& .MuiToggleButton-root': { fontWeight: 700, textTransform: 'none' } }}>
            <ToggleButton value="add" color="success">+ Ajouter (achat)</ToggleButton>
            <ToggleButton value="remove" color="error">− Retirer (utilisé)</ToggleButton>
          </ToggleButtonGroup>
          <TextField autoFocus label="Quantité" type="number" value={qty} onChange={(e) => setQty(e.target.value)} inputProps={{ step: '0.01', min: 0 }}
            InputProps={{ endAdornment: <InputAdornment position="end">{ing.uniteMesure}</InputAdornment> }} />
          {valid && (
            <Typography variant="body2" color="text.secondary">
              Nouveau stock : <b>{formatNumber(ing.stockQuantity + (mode === 'add' ? n : -n))} {ing.uniteMesure}</b>
            </Typography>
          )}
        </Box>
      )}
    </ResponsiveDialog>
  );
}

function StockPage() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [ingredients, setIngredients] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('nom');
  const [sortDirection, setSortDirection] = useState('asc');
  const [editor, setEditor] = useState({ open: false, ingredient: null });
  const [adjusting, setAdjusting] = useState(null);
  const confirm = useConfirm();

  // Écoute en temps réel : l'écran se met à jour dès qu'un ingrédient change dans Firestore
  // (planning enregistré, ajustement depuis un autre appareil, etc.).
  useEffect(
    () =>
      listenIngredients(
        (data) =>
          setIngredients(
            data.map((ing) => {
              const { status, expiringSoon, qty } = computeStatus(ing);
              // Synchronise le statut calculé dans Firestore (comportement d'origine).
              if (ing.status !== status && ing.id) {
                updateIngredient(ing.id, { status }).catch((e) => console.error(`Statut de ${ing.nom} :`, e));
              }
              return { ...ing, status, expiringSoon, stockQuantity: qty };
            })
          ),
        (err) => {
          enqueueSnackbar(`Erreur lors du chargement du stock : ${friendlyError(err)}`, { variant: 'error' });
          setIngredients((cur) => cur || []);
        }
      ),
    []
  );

  const counts = useMemo(
    () => Object.fromEntries(Object.entries(FILTERS).map(([k, f]) => [k, (ingredients || []).filter(f).length])),
    [ingredients]
  );
  const value = useMemo(
    () => (ingredients || []).reduce((s, i) => s + (parseFloat(i.prix) || 0) * Math.max(0, i.stockQuantity), 0),
    [ingredients]
  );

  const rows = useMemo(() => {
    const list = (ingredients || [])
      .filter(FILTERS[filter])
      .filter((i) => normalize(`${asText(i.nom)} ${asText(i.alias)}`).includes(normalize(search)));
    const val = (i) => {
      if (sortBy === 'datePeremption') return toDate(i.datePeremption)?.getTime() ?? Infinity;
      const v = i[sortBy];
      return typeof v === 'string' ? v.toLowerCase() : Number(v) || 0;
    };
    return list.sort((a, b) => {
      const A = val(a);
      const B = val(b);
      const r = typeof A === 'string' ? A.localeCompare(B) : A - B;
      return sortDirection === 'asc' ? r : -r;
    });
  }, [ingredients, filter, search, sortBy, sortDirection]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDirection('asc'); }
  };

  const save = async (data) => {
    if (editor.ingredient) {
      await updateIngredient(editor.ingredient.id, data);
      enqueueSnackbar('Ingrédient mis à jour !', { variant: 'success' });
    } else {
      await createIngredient(data);
      enqueueSnackbar('Ingrédient ajouté au stock !', { variant: 'success' });
    }
    setEditor({ open: false, ingredient: null });
  };

  const remove = async (ing) => {
    if (!(await confirm({ title: `Supprimer « ${ing.nom} » ?`, message: "L'ingrédient sera supprimé du stock et du catalogue.", confirmLabel: 'Supprimer' }))) return;
    try {
      await deleteIngredient(ing.id);
      enqueueSnackbar('Ingrédient supprimé.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(friendlyError(err), { variant: 'error' });
    }
  };

  const adjust = async (ing, change) => {
    setAdjusting(null);
    try {
      await updateIngredientStock(ing.id, change, ing.status);
      enqueueSnackbar(`Stock de ${ing.nom} mis à jour.`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(`Erreur lors de la mise à jour du stock : ${friendlyError(err)}`, { variant: 'error' });
    }
  };

  const Actions = ({ ing }) => (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
      <Tooltip title="Ajuster la quantité"><IconButton color="primary" onClick={() => setAdjusting(ing)} sx={{ bgcolor: tint('primary', 0.1) }}><ExposureRoundedIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Modifier"><IconButton onClick={() => setEditor({ open: true, ingredient: ing })}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Supprimer"><IconButton onClick={() => remove(ing)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></Tooltip>
    </Box>
  );

  const Head = ({ col, children, ...rest }) => (
    <TableCell {...rest}>
      <TableSortLabel active={sortBy === col} direction={sortBy === col ? sortDirection : 'asc'} onClick={() => handleSort(col)}>{children}</TableSortLabel>
    </TableCell>
  );

  return (
    <Box>
      <PageHeader
        eyebrow="Organisation"
        title="Le garde-manger"
        subtitle={ingredients ? `Valeur estimée du stock : ${formatFcfa(value)}` : 'Ce que vous avez sous la main, en temps réel.'}
        actions={
          <>
            <Tooltip title="Le stock se met à jour automatiquement, sans recharger la page">
              <Chip
                label="En direct" color="success" variant="outlined"
                icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', ml: '10px !important', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.25 } }, animation: 'pulse 1.6s infinite' }} />}
                sx={{ height: 42, borderRadius: 3, borderWidth: 1.5 }}
              />
            </Tooltip>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditor({ open: true, ingredient: null })}>Ajouter au stock</Button>
          </>
        }
      />

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, mb: 3 }}>
        <StatCard icon={<CheckCircleRoundedIcon />} label="En stock" color="success" value={counts.ok ?? '–'} active={filter === 'ok'} onClick={() => setFilter(filter === 'ok' ? 'all' : 'ok')} />
        <StatCard icon={<WarningRoundedIcon />} label="Stock faible" color="warning" value={counts.low ?? '–'} active={filter === 'low'} onClick={() => setFilter(filter === 'low' ? 'all' : 'low')} />
        <StatCard icon={<RemoveShoppingCartRoundedIcon />} label="Épuisés" color="error" value={counts.out ?? '–'} active={filter === 'out'} onClick={() => setFilter(filter === 'out' ? 'all' : 'out')} />
        <StatCard icon={<EventBusyRoundedIcon />} label="Péremption" color="info" value={counts.exp ?? '–'} active={filter === 'exp'} onClick={() => setFilter(filter === 'exp' ? 'all' : 'exp')} />
      </Box>

      {ingredients && ingredients.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Rechercher (nom ou alias)…" value={search} onChange={(e) => setSearch(e.target.value)} size="small"
            sx={{ width: { xs: '100%', sm: 340 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}
          />
          {filter !== 'all' && <Chip label="Retirer le filtre" onDelete={() => setFilter('all')} onClick={() => setFilter('all')} />}
        </Box>
      )}

      {!ingredients ? (
        <LoadingGrid media={0} count={6} />
      ) : ingredients.length === 0 ? (
        <EmptyState
          icon={<Inventory2RoundedIcon />} title="Le garde-manger est vide"
          description="Ajoutez vos ingrédients avec leur quantité pour être alerté avant qu'ils ne manquent."
          action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditor({ open: true, ingredient: null })}>Ajouter au stock</Button>}
        />
      ) : rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>Aucun ingrédient ne correspond.</Typography>
      ) : desktop ? (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <Head col="nom">Ingrédient</Head>
                  <Head col="stockQuantity">Quantité</Head>
                  <Head col="seuilMinimum">Seuil</Head>
                  <Head col="prix">Prix / unité</Head>
                  <Head col="datePeremption">Péremption</Head>
                  <Head col="status">Statut</Head>
                  <Head col="totalConsumedQuantity">Consommé</Head>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((ing) => (
                  <TableRow key={ing.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={ing.photoURL || undefined} variant="rounded" sx={{ borderRadius: '12px', bgcolor: tint('secondary', 0.14), color: 'secondary.main' }}>{(ing.nom || '?').charAt(0).toUpperCase()}</Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700 }}>{ing.nom}</Typography>
                          <Typography variant="caption" color="text.secondary">{[ing.categorie, ing.alias].map(asText).filter(Boolean).join(' · ')}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Level ing={ing} /></TableCell>
                    <TableCell>{formatNumber(ing.seuilMinimum)}</TableCell>
                    <TableCell>{ing.prix !== undefined && ing.prix !== null ? formatFcfa(ing.prix) : '—'}</TableCell>
                    <TableCell sx={{ color: ing.expiringSoon || ing.status === INGREDIENT_STATUS.EXPIRED ? 'error.main' : undefined, fontWeight: ing.expiringSoon ? 700 : 400 }}>{formatDate(ing.datePeremption)}</TableCell>
                    <TableCell><StatusChip ing={ing} /></TableCell>
                    <TableCell>{formatNumber(ing.totalConsumedQuantity)}</TableCell>
                    <TableCell align="right"><Actions ing={ing} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {rows.map((ing) => (
            <Card key={ing.id} sx={{ p: 1.75 }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.25 }}>
                <Avatar src={ing.photoURL || undefined} variant="rounded" sx={{ borderRadius: '12px', bgcolor: tint('secondary', 0.14), color: 'secondary.main' }}>{(ing.nom || '?').charAt(0).toUpperCase()}</Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>{ing.nom}</Typography>
                  <Typography variant="caption" color="text.secondary">Péremption : {formatDate(ing.datePeremption)}</Typography>
                </Box>
                <StatusChip ing={ing} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
                <Level ing={ing} />
                <Actions ing={ing} />
              </Box>
            </Card>
          ))}
        </Box>
      )}

      <IngredientEditor withStock open={editor.open} ingredient={editor.ingredient} onClose={() => setEditor({ open: false, ingredient: null })} onSave={save} />
      <AdjustDialog ing={adjusting} onClose={() => setAdjusting(null)} onApply={adjust} />
    </Box>
  );
}

export default StockPage;
