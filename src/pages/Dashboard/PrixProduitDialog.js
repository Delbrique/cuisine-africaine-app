// Fiche « prix d'un produit » : résumé en une phrase, petite courbe, où l'acheter moins cher.
// Volontairement légère : pensée pour être consultée au marché, sur un téléphone.
import React, { useEffect, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Collapse, Typography } from '@mui/material';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';
import { ResponsiveDialog } from '../../components/ui';
import TendanceChart from '../../components/ui/TendanceChart';
import { historiqueProduit } from '../../services/prixService';
import { VILLE } from '../../services/lieuxService';
import { formatFcfa } from '../../utils';

const PERIODES = [{ jours: 30, label: '1 mois' }, { jours: 90, label: '3 mois' }, { jours: 365, label: '1 an' }];
const dateCourte = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const lundi = (semaine) => new Date(`${semaine}T12:00:00`);

export default function PrixProduitDialog({ open, onClose, nom }) {
  const [jours, setJours] = useState(90);
  const [unite, setUnite] = useState(null);
  const [h, setH] = useState(null);
  const [detail, setDetail] = useState(false);

  useEffect(() => { if (open) { setUnite(null); setDetail(false); } }, [open, nom]);

  useEffect(() => {
    if (!open || !nom) return;
    setH((prev) => (prev ? { ...prev, rechargement: true } : null));
    historiqueProduit(nom, { jours, unite }).then(setH).catch(() => setH({ releves: [], erreur: true }));
  }, [open, nom, jours, unite]);

  const u = h?.unite || 'unité';
  const prix = (v) => `${formatFcfa(Math.round(v))}/${u}`;
  const evo = h?.evolution;
  const EvoIcon = evo == null || Math.abs(evo) < 0.02 ? TrendingFlatRoundedIcon : evo > 0 ? TrendingUpRoundedIcon : TrendingDownRoundedIcon;
  const evoTexte = evo == null ? null
    : Math.abs(evo) < 0.02 ? 'stable'
      : `${evo > 0 ? 'en hausse' : 'en baisse'} de ${Math.round(Math.abs(evo) * 100)} %`;
  const periodeTexte = PERIODES.find((p) => p.jours === jours)?.label;
  const actuel = h?.semaines?.length ? h.semaines[h.semaines.length - 1] : null;

  return (
    <ResponsiveDialog open={open} onClose={onClose} title={`Prix : ${nom || ''}`} maxWidth="sm">
      {/* Filtres : une seule ligne, au-dessus de tout le contenu. */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
        {PERIODES.map((p) => (
          <Chip key={p.jours} label={p.label} onClick={() => setJours(p.jours)} color={jours === p.jours ? 'primary' : 'default'} variant={jours === p.jours ? 'filled' : 'outlined'} />
        ))}
        {h?.unites?.length > 1 && h.unites.map((x) => (
          <Chip key={x} label={`par ${x}`} onClick={() => setUnite(x)} variant={x === h.unite ? 'filled' : 'outlined'} color={x === h.unite ? 'secondary' : 'default'} />
        ))}
      </Box>

      {!h ? (
        <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
      ) : !h.releves.length ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Pas encore de prix relevé pour ce produit</Typography>
          <Typography color="text.secondary">
            Au marché, touchez « J'ai payé… » pour noter votre prix : il aidera toutes les familles de {VILLE}.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ opacity: h.rechargement ? 0.5 : 1, transition: 'opacity .2s' }}>
          {/* 1. La phrase-résumé : le prix ACTUEL (dernière semaine), le même qu'au bout de la courbe. */}
          <Typography sx={{ fontSize: 34, fontWeight: 750, lineHeight: 1.1 }}>{prix(actuel.mediane)}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Prix actuel à {VILLE} · semaine du {dateCourte(lundi(actuel.semaine))}
          </Typography>
          {evoTexte && (
            <Typography sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
              <EvoIcon fontSize="small" /> {evoTexte} sur {periodeTexte}
            </Typography>
          )}

          {/* 2. La petite courbe (au moins 2 semaines de relevés) */}
          {h.semaines.length > 1 && (
            <Box sx={{ mt: 2.5 }}>
              <TendanceChart
                points={h.semaines.map((s) => ({ y: s.mediane, date: lundi(s.semaine), legende: `semaine du ${dateCourte(lundi(s.semaine))} · ${s.n} relevé${s.n > 1 ? 's' : ''}` }))}
                formatY={(v) => formatFcfa(Math.round(v))}
                formatX={(p) => dateCourte(p.date)}
                resume={`Prix médian par semaine de ${nom}, de ${prix(h.semaines[0].mediane)} à ${prix(h.semaines[h.semaines.length - 1].mediane)}.`}
              />
              <Typography variant="caption" color="text.secondary">
                Prix médian par semaine · sur la période : {prix(h.mediane)} (médian), de {prix(h.min)} à {prix(h.max)} · {h.releves.length} relevé{h.releves.length > 1 ? 's' : ''}
              </Typography>
            </Box>
          )}

          {/* 3. Où l'acheter moins cher : une simple liste */}
          {h.parLieu.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>OÙ L'ACHETER MOINS CHER</Typography>
              {h.parLieu.slice(0, 5).map((l, i) => (
                <Box key={l.lieuNom} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ width: 22, fontWeight: 800, color: 'text.secondary' }}>{i + 1}</Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 650 }} noWrap>{l.lieuNom}</Typography>
                    <Typography variant="caption" color="text.secondary">{l.n} relevé{l.n > 1 ? 's' : ''}</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 750, whiteSpace: 'nowrap' }}>{prix(l.mediane)}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* 4. Le détail, caché par défaut (accès à toutes les valeurs sans survol) */}
          <Button size="small" onClick={() => setDetail((v) => !v)} sx={{ mt: 2 }}>
            {detail ? 'Masquer les relevés' : `Voir les ${h.releves.length} relevés`}
          </Button>
          <Collapse in={detail}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mt: 1, fontSize: 14, '& td, & th': { py: 0.75, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'left' }, '& th': { color: 'text.secondary', fontWeight: 700, fontSize: 12 } }}>
              <thead><tr><th>Date</th><th>Lieu</th><th style={{ textAlign: 'right' }}>Prix</th></tr></thead>
              <tbody>
                {[...h.releves].reverse().map((r) => (
                  <tr key={r.id}>
                    <td>{dateCourte(new Date(r.t))}</td>
                    <td>{r.lieuNom || '—'}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{prix(r.prixUnitaire)}</td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Collapse>
        </Box>
      )}
    </ResponsiveDialog>
  );
}
