import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Avatar, Box, Button, ButtonBase, Card, Chip, Skeleton, Typography } from '@mui/material';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import NotificationImportantRoundedIcon from '@mui/icons-material/NotificationImportantRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ShoppingBasketRoundedIcon from '@mui/icons-material/ShoppingBasketRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

import { getMembres } from '../../services/membreService';
import { getPlats } from '../../services/platService';
import { getIngredients } from '../../services/ingredientService';
import { getMostRecentPlanning } from '../../services/planningService';
import { STATUS_META, computeStatus, needsAttention } from '../../services/stockStatus';
import { useAuth } from '../../auth/AuthContext';
import { DishImage, SectionCard, StatCard, patternBg } from '../../components/ui';
import { REPAS } from '../../constants';
import { formatNumber, greeting, initials, todayKey } from '../../utils';
import { tint } from '../../theme/theme';

const base = '/famille-dashboard';

const QUICK = [
  { label: 'Ajouter un plat', icon: AddRoundedIcon, to: `${base}/plats?nouveau=1`, color: 'primary' },
  { label: 'Planifier la semaine', icon: CalendarMonthRoundedIcon, to: `${base}/planning-repas`, color: 'secondary' },
  { label: 'Liste de marché', icon: ShoppingBasketRoundedIcon, to: `${base}/liste-marche`, color: 'warning' },
  { label: "Demander à l'IA", icon: AutoAwesomeRoundedIcon, to: `${base}/search`, color: 'info' },
];

function AccueilPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [parts, setParts] = useState({});

  // Chaque bloc s'affiche dès que sa collection est chargée.
  useEffect(() => {
    const load = (key, fn, fallback) =>
      fn()
        .then((v) => setParts((p) => ({ ...p, [key]: v ?? fallback })))
        .catch(() => setParts((p) => ({ ...p, [key]: fallback })));
    load('membres', getMembres, []);
    load('plats', getPlats, []);
    load('ingredients', getIngredients, []);
    load('planning', getMostRecentPlanning, null);
  }, []);

  const { membres, ingredients } = parts;
  const mealsReady = 'plats' in parts && 'planning' in parts;

  const today = todayKey();
  const firstName = (profile?.nomComplet || user?.displayName || '').split(' ')[0];

  const todayMeals = useMemo(() => {
    if (!mealsReady) return REPAS;
    const day = parts.planning?.planning?.[today] || {};
    return REPAS.map((r) => {
      const slot = day[r.key];
      const plat = slot?.platId ? parts.plats.find((p) => p.id === slot.platId) : null;
      return { ...r, plat, nom: plat?.nom || slot?.nomPlat || '' };
    });
  }, [mealsReady, parts.planning, parts.plats, today]);

  const alerts = useMemo(() => (ingredients ? ingredients.filter(needsAttention) : []), [ingredients]);
  const inStock = ingredients ? ingredients.filter((i) => (parseFloat(i.stockQuantity) || 0) > 0).length : 0;
  const count = (list) => (list ? list.length : '–');

  return (
    <Box>
      {/* Bandeau d'accueil */}
      <Box
        sx={{
          position: 'relative', overflow: 'hidden', borderRadius: 7, p: { xs: 3, md: 4.5 }, mb: 3, color: '#FFF3E0',
          background: `${patternBg('#FFF3E0', 0.1)}, linear-gradient(125deg, #E8622C 0%, #B83A14 55%, #7A2A0E 100%)`,
          boxShadow: '0 24px 60px rgba(169,55,15,.28)',
        }}
      >
        <Typography variant="overline" sx={{ opacity: 0.8 }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Typography>
        <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 30, md: 44 }, mt: 0.5 }}>
          {greeting()}{firstName ? `, ${firstName}` : ''} <Box component="span" sx={{ fontStyle: 'italic', color: '#FFC857' }}>!</Box>
        </Typography>
        <Typography sx={{ opacity: 0.85, mt: 1, mb: 3, maxWidth: 520 }}>
          Voici ce qui mijote aujourd'hui dans la cuisine familiale.
        </Typography>

        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
          {todayMeals.map((m) => (
            <ButtonBase
              key={m.key}
              onClick={() => navigate(`${base}/planning-repas`)}
              sx={{
                borderRadius: 4, overflow: 'hidden', textAlign: 'left', display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start',
                bgcolor: 'rgba(255,243,224,.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,243,224,.18)',
                transition: 'transform .2s', '&:hover': { transform: 'translateY(-2px)', bgcolor: 'rgba(255,243,224,.18)' },
              }}
            >
              {mealsReady ? (
                <DishImage src={m.plat?.photoURL} name={m.nom || m.label} height={76} sx={{ width: 76 }} />
              ) : (
                <Skeleton variant="rectangular" width={76} height={76} sx={{ bgcolor: 'rgba(255,255,255,.15)' }} />
              )}
              <Box sx={{ p: 1.5, minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.75 }}>{m.label}</Typography>
                <Typography sx={{ fontWeight: 700, mt: 0.25 }} noWrap>
                  {mealsReady ? m.nom || 'Rien de prévu' : '…'}
                </Typography>
              </Box>
            </ButtonBase>
          ))}
        </Box>
      </Box>

      {/* Chiffres clés */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, mb: 3 }}>
        <StatCard icon={<GroupsRoundedIcon />} label="Membres" value={count(membres)} onClick={() => navigate(`${base}/membres`)} />
        <StatCard icon={<RestaurantMenuRoundedIcon />} label="Plats" color="secondary" value={count(parts.plats)} onClick={() => navigate(`${base}/plats`)} />
        <StatCard icon={<Inventory2RoundedIcon />} label="En stock" color="info" value={ingredients ? inStock : '–'} onClick={() => navigate(`${base}/stock`)} />
        <StatCard icon={<NotificationImportantRoundedIcon />} label="Alertes stock" color={alerts.length ? 'error' : 'success'} value={ingredients ? alerts.length : '–'} onClick={() => navigate(`${base}/stock`)} />
      </Box>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Actions rapides */}
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' } }}>
            {QUICK.map(({ label, icon: Icon, to, color }) => (
              <Card key={label} sx={{ transition: 'all .2s', '&:hover': { borderColor: `${color}.main`, transform: 'translateY(-2px)' } }}>
                <ButtonBase component={RouterLink} to={to} sx={{ width: '100%', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5, p: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '13px', display: 'grid', placeItems: 'center', color: `${color}.main`, bgcolor: tint(color, 0.12) }}>
                    <Icon />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, textAlign: 'left' }}>{label}</Typography>
                </ButtonBase>
              </Card>
            ))}
          </Box>

          {/* Famille */}
          <SectionCard
            icon={<GroupsRoundedIcon />} title="La famille"
            subtitle={membres ? `${membres.length} personne(s) à table` : 'Chargement…'}
            action={<Button component={RouterLink} to={`${base}/membres`} size="small" endIcon={<ArrowForwardRoundedIcon />}>Voir</Button>}
          >
            {membres && membres.length === 0 ? (
              <Button component={RouterLink} to={`${base}/add-membre`} variant="outlined" startIcon={<AddRoundedIcon />}>Ajouter un membre</Button>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {!membres && [0, 1, 2, 3].map((i) => <Skeleton key={i} variant="circular" width={56} height={56} sx={{ m: 1 }} />)}
                {(membres || []).slice(0, 8).map((m) => {
                  const allergies = (m.allergiesConnues || []).filter((a) => a !== 'RAS');
                  return (
                    <ButtonBase key={m.id} onClick={() => navigate(`${base}/membres?membre=${encodeURIComponent(m.id)}`)}
                      sx={{ flexDirection: 'column', gap: 0.75, width: 76, borderRadius: 3, py: 1 }}>
                      <Avatar src={m.photoProfil || undefined} sx={{ width: 56, height: 56, bgcolor: 'primary.main', boxShadow: allergies.length ? (t) => `0 0 0 3px ${t.vars.palette.error.main}` : 'none' }}>
                        {initials(m.nomComplet)}
                      </Avatar>
                      <Typography variant="caption" sx={{ fontWeight: 650, maxWidth: '100%' }} noWrap>{(m.nomComplet || '').split(' ')[0]}</Typography>
                    </ButtonBase>
                  );
                })}
                {membres?.length > 8 && (
                  <ButtonBase onClick={() => navigate(`${base}/membres`)} sx={{ flexDirection: 'column', gap: 0.75, width: 76, borderRadius: 3, py: 1 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: 'sand.dark', color: 'text.primary', fontSize: 16 }}>+{membres.length - 8}</Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 650 }}>Tous</Typography>
                  </ButtonBase>
                )}
              </Box>
            )}
          </SectionCard>
        </Box>

        {/* Alertes stock */}
        <SectionCard
          icon={<NotificationImportantRoundedIcon />} title="À surveiller"
          subtitle="Ingrédients à racheter ou à consommer"
          action={<Button component={RouterLink} to={`${base}/stock`} size="small" endIcon={<ArrowForwardRoundedIcon />}>Stock</Button>}
        >
          {!ingredients ? (
            [0, 1, 2].map((i) => <Skeleton key={i} height={52} />)
          ) : alerts.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 3, bgcolor: tint('success', 0.1), color: 'success.main' }}>
              <CheckCircleRoundedIcon />
              <Typography sx={{ fontWeight: 650 }}>Tout est en ordre dans le garde-manger.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {alerts.slice(0, 6).map((ing) => {
                const { status, expiringSoon, qty } = computeStatus(ing);
                const meta = expiringSoon && !['expire', 'epuise'].includes(status)
                  ? { label: 'Expire bientôt', color: 'warning' }
                  : STATUS_META[status] || { label: status, color: 'default' };
                return (
                  <Box key={ing.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 3, '&:hover': { bgcolor: 'sand.main' } }}>
                    <Avatar src={ing.photoURL || undefined} variant="rounded" sx={{ bgcolor: 'sand.dark', color: 'text.primary', borderRadius: '12px' }}>
                      {(ing.nom || '?').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 650 }} noWrap>{ing.nom}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatNumber(qty)} {ing.uniteMesure} restant(s)</Typography>
                    </Box>
                    <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />
                  </Box>
                );
              })}
              {alerts.length > 6 && (
                <Typography variant="body2" color="text.secondary" sx={{ px: 1, pt: 1 }}>+ {alerts.length - 6} autre(s)</Typography>
              )}
            </Box>
          )}
        </SectionCard>
      </Box>
    </Box>
  );
}

export default AccueilPage;
