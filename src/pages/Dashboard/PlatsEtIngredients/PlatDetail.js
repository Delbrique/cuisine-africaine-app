import React from 'react';
import { Box, Button, Chip, Dialog, IconButton, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import SignalCellularAltRoundedIcon from '@mui/icons-material/SignalCellularAltRounded';
import { DishImage } from '../../../components/ui';
import { CATEGORY_COLORS } from '../../../constants';
import { formatNumber } from '../../../utils';

function Meta({ icon, label, value }) {
  return (
    <Box sx={{ flex: 1, minWidth: 90, p: 1.5, borderRadius: 3, bgcolor: 'sand.main', textAlign: 'center' }}>
      <Box sx={{ color: 'primary.main', '& svg': { fontSize: 20 } }}>{icon}</Box>
      <Typography sx={{ fontWeight: 750 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );
}

/** Fiche recette en lecture. */
export default function PlatDetail({ plat, onClose, onEdit, onDelete, extraActions }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const p = plat || {};
  const isFruit = p.categoriePlat === 'Fruit';
  const steps = (p.instructions || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);

  return (
    <Dialog open={Boolean(plat)} onClose={onClose} fullScreen={mobile} fullWidth maxWidth="md" scroll="body">
      {plat && (
        <>
          <DishImage src={p.photoURL} name={p.nom} height={mobile ? 280 : 340}>
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.35) 0%, transparent 30%, transparent 50%, rgba(20,12,8,.85) 100%)' }} />
            <IconButton onClick={onClose} sx={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', right: 12, color: '#fff', bgcolor: 'rgba(0,0,0,.3)', backdropFilter: 'blur(6px)' }}>
              <CloseRoundedIcon />
            </IconButton>
            <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: { xs: 2.5, sm: 4 }, color: '#fff' }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                {p.categoriePlat && <Chip label={p.categoriePlat} color={CATEGORY_COLORS[p.categoriePlat] || 'primary'} size="small" />}
                {p.origine && <Chip label={p.origine} size="small" sx={{ bgcolor: 'rgba(255,255,255,.2)', color: '#fff' }} />}
              </Box>
              <Typography variant="h4" sx={{ fontSize: { xs: 28, sm: 38 } }}>{p.nom}</Typography>
            </Box>
          </DishImage>

          <Box sx={{ p: { xs: 2.5, sm: 4 }, pb: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
            {!isFruit && (
              <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                <Meta icon={<TimerRoundedIcon />} label="Préparation" value={`${p.tempsPreparation || 0} min`} />
                <Meta icon={<LocalFireDepartmentRoundedIcon />} label="Cuisson" value={`${p.tempsCuisson || 0} min`} />
                <Meta icon={<SignalCellularAltRoundedIcon />} label="Difficulté" value={p.difficulte || '—'} />
              </Box>
            )}

            {p.description && <Typography sx={{ mb: 3, fontSize: 16.5, lineHeight: 1.7 }}>{p.description}</Typography>}

            {isFruit ? (
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mb: 3 }}>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'sand.main' }}>
                  <Typography variant="overline" color="text.secondary">Utilisation</Typography>
                  <Typography>{p.utilisation || '—'}</Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'sand.main' }}>
                  <Typography variant="overline" color="text.secondary">Riche en</Typography>
                  <Typography>{p.richeEn || '—'}</Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>Ingrédients</Typography>
                  {(p.ingredientsNecessaires || []).length === 0 ? (
                    <Typography color="text.secondary">Aucun ingrédient renseigné.</Typography>
                  ) : (
                    <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                      {p.ingredientsNecessaires.map((ing, i) => (
                        <Box component="li" key={ing.ingredientId || i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: '1px dashed', borderColor: 'divider' }}>
                          <Typography sx={{ fontWeight: 600 }}>{ing.nom}</Typography>
                          <Typography color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{formatNumber(ing.quantite)} {ing.uniteMesure}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>Préparation</Typography>
                  {steps.length === 0 ? (
                    <Typography color="text.secondary">Aucune instruction.</Typography>
                  ) : (
                    steps.map((s, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800, fontSize: 14 }}>
                          {i + 1}
                        </Box>
                        <Typography sx={{ pt: 0.4, lineHeight: 1.65 }}>{s.replace(/^\d+[.)]\s*/, '')}</Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {extraActions}
              {onDelete && <Button color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={onDelete}>Supprimer</Button>}
              {onEdit && <Button variant="contained" startIcon={<EditRoundedIcon />} onClick={onEdit}>Modifier</Button>}
            </Box>
          </Box>
        </>
      )}
    </Dialog>
  );
}
