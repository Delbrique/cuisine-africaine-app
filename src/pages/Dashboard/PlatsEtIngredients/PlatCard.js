import React from 'react';
import { Box, ButtonBase, Card, Chip, Typography } from '@mui/material';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import EggAltRoundedIcon from '@mui/icons-material/EggAltRounded';
import SpaRoundedIcon from '@mui/icons-material/SpaRounded';
import { DishImage } from '../../../components/ui';
import { CATEGORY_COLORS } from '../../../constants';

/** Carte « magazine » d'un plat. */
export default function PlatCard({ plat, onClick, badge, footer, compact = false }) {
  // `compact` : version réduite sur téléphone (grille de 2 colonnes).
  const small = (xs, sm) => (compact ? { xs, sm } : sm);
  const isFruit = plat.categoriePlat === 'Fruit';
  const total = (Number(plat.tempsPreparation) || 0) + (Number(plat.tempsCuisson) || 0);
  const nbIng = (plat.ingredientsNecessaires || []).length;

  return (
    <Card sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all .25s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 22px 44px rgba(31,20,16,.13)' }, '&:hover img': { transform: 'scale(1.05)' } }}>
      <ButtonBase onClick={onClick} sx={{ display: 'block', textAlign: 'left', flex: 1 }}>
        <DishImage src={plat.photoURL} name={plat.nom} height={180} sx={{ height: small(120, 180), '& img': { transition: 'transform .5s' } }}>
          <Box sx={{ position: 'absolute', top: small(8, 12), left: small(8, 12), right: small(8, 12), display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            {plat.categoriePlat ? (
              <Chip label={plat.categoriePlat} size="small" color={CATEGORY_COLORS[plat.categoriePlat] || 'primary'} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,.2)' }} />
            ) : <span />}
            {badge}
          </Box>
        </DishImage>
        <Box sx={{ p: small(1.25, 2) }}>
          <Typography variant="h6" sx={{ fontFamily: '"Fraunces Variable", serif', fontWeight: 650, fontSize: small(15.5, 19), mb: 0.5 }} noWrap>{plat.nom}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: compact ? { xs: 'none', sm: '-webkit-box' } : '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>
            {plat.description || 'Pas encore de description.'}
          </Typography>
          <Box sx={{ display: 'flex', gap: small(1, 2), mt: small(0.5, 1.5), color: 'text.secondary', '& svg': { fontSize: 17 }, '& .opt': { display: compact ? { xs: 'none', sm: 'flex' } : 'flex' } }}>
            {isFruit ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                <SpaRoundedIcon color="secondary" />
                <Typography variant="caption" sx={{ fontWeight: 650 }} noWrap>{plat.richeEn || 'Fruit frais'}</Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TimerRoundedIcon color="primary" />
                  <Typography variant="caption" sx={{ fontWeight: 650 }}>{total ? `${total} min` : '—'}</Typography>
                </Box>
                <Box className="opt" sx={{ alignItems: 'center', gap: 0.5 }}>
                  <EggAltRoundedIcon color="primary" />
                  <Typography variant="caption" sx={{ fontWeight: 650 }}>{nbIng} ingrédient{nbIng > 1 ? 's' : ''}</Typography>
                </Box>
                {plat.difficulte && <Typography variant="caption" sx={{ fontWeight: 650, ml: 'auto' }}>{plat.difficulte}</Typography>}
              </>
            )}
          </Box>
        </Box>
      </ButtonBase>
      {footer}
    </Card>
  );
}
