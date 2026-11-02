// src/pages/Dashboard/MembresList.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Avatar, Box, Button, ButtonBase, Card, Chip, Drawer, IconButton, InputAdornment, Menu, MenuItem,
  ListItemIcon, TextField, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import { enqueueSnackbar } from 'notistack';

import { getMembres, deleteMembre } from '../../services/membreService';
import { getPlats } from '../../services/platService';
import { EmptyState, LoadingGrid, PageHeader, patternBg, useConfirm } from '../../components/ui';
import { label } from '../../components/membres/memberModel';
import { friendlyError, initials, normalize } from '../../utils';
import { tint } from '../../theme/theme';

const real = (list) => (Array.isArray(list) ? list.filter((x) => x && x !== 'RAS') : []);

function Info({ k, v }) {
  if (!v) return null;
  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650 }}>{k}</Typography>
      <Typography sx={{ fontWeight: 550 }}>{v}</Typography>
    </Box>
  );
}

function ChipList({ items, color, empty = 'Aucun' }) {
  return items.length ? (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {items.map((x, i) => <Chip key={i} label={label(x)} size="small" color={color} variant="outlined" />)}
    </Box>
  ) : (
    <Typography variant="body2" color="text.secondary">{empty}</Typography>
  );
}

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Box sx={{ mt: 0.5 }}>{children}</Box>
    </Box>
  );
}

function MemberDetail({ membre, plats, onClose, onEdit, onDelete }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const m = membre || {};
  const favoris = (m.platsPreferes || []).map((id) => plats.find((p) => p.id === id)?.nom).filter(Boolean);

  return (
    <Drawer
      anchor={mobile ? 'bottom' : 'right'} open={Boolean(membre)} onClose={onClose}
      PaperProps={{ sx: { width: { sm: 440 }, maxHeight: { xs: '92dvh', sm: '100%' }, borderRadius: { xs: '28px 28px 0 0', sm: '28px 0 0 28px' } } }}
    >
      {membre && (
        <>
          <Box sx={{ position: 'relative', pt: 'calc(env(safe-area-inset-top) + 28px)', pb: 3, px: 3, textAlign: 'center', color: '#FFF3E0', background: `${patternBg('#FFF3E0', 0.12)}, linear-gradient(135deg, #E8622C, #A9370F)` }}>
            <IconButton onClick={onClose} sx={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 12px)', right: 12, color: 'inherit' }}><CloseRoundedIcon /></IconButton>
            <Avatar src={m.photoProfil || undefined} sx={{ width: 96, height: 96, mx: 'auto', mb: 1.5, fontSize: 32, bgcolor: 'rgba(255,243,224,.2)', border: '4px solid rgba(255,243,224,.4)' }}>
              {initials(m.nomComplet)}
            </Avatar>
            <Typography variant="h5">{m.nomComplet}</Typography>
            <Typography sx={{ opacity: 0.85 }}>{[m.age && `${m.age} ans`, m.sexe === 'femme' ? 'Femme' : m.sexe === 'homme' ? 'Homme' : null].filter(Boolean).join(' · ')}</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
              <Button onClick={onEdit} variant="contained" startIcon={<EditRoundedIcon />} sx={{ bgcolor: '#FFF3E0', color: '#A9370F', '&:hover': { bgcolor: '#fff' } }}>Modifier</Button>
              <IconButton onClick={onDelete} sx={{ color: '#FFF3E0', bgcolor: 'rgba(255,243,224,.15)' }} aria-label="Supprimer"><DeleteOutlineRoundedIcon /></IconButton>
            </Box>
          </Box>
          <Box sx={{ p: 3, overflowY: 'auto', pb: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
            <Section title="Famille"><ChipList items={real(m.roleFamille)} color="secondary" empty="Rôle non précisé" /></Section>
            <Section title="Santé">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650 }}>Allergies</Typography><ChipList items={real(m.allergiesConnues)} color="error" empty="Aucune connue" /></Box>
                <Box><Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650 }}>Antécédents</Typography><ChipList items={real(m.antecedentsMedicaux)} color="warning" empty="Rien à signaler" /></Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mt: 1 }}>
                <Info k="Taille" v={m.taille && `${m.taille} cm`} />
                <Info k="Poids" v={m.poids && `${m.poids} kg`} />
                <Info k="Groupe" v={m.groupeSanguin} />
              </Box>
            </Section>
            <Section title="Goûts">
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                {favoris.length ? favoris.map((n) => <Chip key={n} icon={<FavoriteRoundedIcon />} label={n} size="small" color="primary" />) : <Typography variant="body2" color="text.secondary">Aucun plat préféré</Typography>}
              </Box>
              <ChipList items={m.loisirsHobbies || []} empty="" />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Info k="Couleur préférée" v={m.couleurPreferee} />
                <Info k="Film / série" v={m.filmSeriePrefere} />
                <Info k="Animaux" v={m.animauxCompagnie} />
              </Box>
            </Section>
            <Section title="Infos personnelles">
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Info k="Email" v={m.email} />
                <Info k="Téléphone" v={m.telephone} />
                <Info k="Naissance" v={[m.dateNaissance, m.lieuNaissance].filter(Boolean).join(' · ')} />
                <Info k="Nationalité" v={m.nationalite} />
                <Info k="Langues" v={m.languesParlees} />
                <Info k="Profession" v={m.profession && label(m.profession)} />
                <Info k="Situation" v={m.situationMatrimoniale} />
              </Box>
            </Section>
            {(m.nomCompletContactUrgence || m.telephoneContactUrgence) && (
              <Section title="Contact d'urgence">
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: tint('error', 0.07) }}>
                  <Typography sx={{ fontWeight: 700 }}>{m.nomCompletContactUrgence}</Typography>
                  <Typography variant="body2" color="text.secondary">{[m.relationContactUrgence, m.telephoneContactUrgence].filter(Boolean).join(' · ')}</Typography>
                </Box>
              </Section>
            )}
          </Box>
        </>
      )}
    </Drawer>
  );
}

function MemberCard({ membre, onOpen, onEdit, onDelete }) {
  const [anchor, setAnchor] = useState(null);
  const allergies = real(membre.allergiesConnues);
  const roles = real(membre.roleFamille);

  return (
    <Card sx={{ position: 'relative', transition: 'all .2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 18px 40px rgba(31,20,16,.1)' } }}>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }} aria-label="Actions">
        <MoreVertRoundedIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => { setAnchor(null); onEdit(); }}><ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>Modifier</MenuItem>
        <MenuItem onClick={() => { setAnchor(null); onDelete(); }} sx={{ color: 'error.main' }}><ListItemIcon><DeleteOutlineRoundedIcon fontSize="small" color="error" /></ListItemIcon>Supprimer</MenuItem>
      </Menu>
      <ButtonBase onClick={onOpen} sx={{ width: '100%', flexDirection: 'column', p: 3, pt: 3.5 }}>
        <Avatar src={membre.photoProfil || undefined} sx={{ width: 84, height: 84, mb: 1.75, fontSize: 28, bgcolor: 'primary.main', boxShadow: (t) => `0 0 0 4px ${t.vars.palette.background.paper}, 0 0 0 6px ${tint('primary', 0.25)(t)}` }}>
          {initials(membre.nomComplet)}
        </Avatar>
        <Typography variant="h6" sx={{ textAlign: 'center' }}>{membre.nomComplet || 'Sans nom'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {[membre.age && `${membre.age} ans`, roles.map(label).join(', ')].filter(Boolean).join(' · ') || '—'}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center', minHeight: 26 }}>
          {allergies.length > 0
            ? allergies.slice(0, 3).map((a) => <Chip key={a} label={label(a)} size="small" color="error" variant="outlined" />)
            : <Chip label="Aucune allergie" size="small" color="success" variant="outlined" />}
        </Box>
      </ButtonBase>
    </Card>
  );
}

function MembresList() {
  const [membres, setMembres] = useState(null);
  const [plats, setPlats] = useState([]);
  const [search, setSearch] = useState('');
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const fetchMembres = async () => {
    try {
      setMembres(await getMembres());
    } catch (err) {
      enqueueSnackbar(`Erreur lors du chargement des membres : ${friendlyError(err)}`, { variant: 'error' });
      setMembres([]);
    }
  };

  useEffect(() => {
    fetchMembres();
    getPlats().then(setPlats).catch(() => {});
  }, []);

  const selected = membres?.find((m) => m.id === params.get('membre')) || null;
  const open = (m) => setParams(m ? { membre: m.id } : {});
  const edit = (m) => navigate(`/famille-dashboard/edit-membre/${encodeURIComponent(m.id)}`);

  const handleDelete = async (m) => {
    const ok = await confirm({ title: `Supprimer ${m.nomComplet || 'ce membre'} ?`, message: 'Sa fiche sera définitivement supprimée.', confirmLabel: 'Supprimer' });
    if (!ok) return;
    try {
      await deleteMembre(m.id);
      open(null);
      enqueueSnackbar('Membre supprimé.', { variant: 'success' });
      fetchMembres();
    } catch (err) {
      enqueueSnackbar(friendlyError(err), { variant: 'error' });
    }
  };

  const filtered = useMemo(
    () => (membres || []).filter((m) => normalize(`${m.nomComplet} ${m.email} ${(m.roleFamille || []).join(' ')}`).includes(normalize(search))),
    [membres, search]
  );

  return (
    <Box>
      <PageHeader
        eyebrow="Famille"
        title="Les membres"
        subtitle="Profils, goûts et santé de chacun : de quoi cuisiner pour tout le monde."
        actions={<Button variant="contained" startIcon={<PersonAddAlt1RoundedIcon />} onClick={() => navigate('/famille-dashboard/add-membre')}>Ajouter un membre</Button>}
      />

      {membres && membres.length > 0 && (
        <TextField
          placeholder="Rechercher un membre…" value={search} onChange={(e) => setSearch(e.target.value)} size="small"
          sx={{ mb: 3, width: { xs: '100%', sm: 340 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}
        />
      )}

      {!membres ? (
        <LoadingGrid media={0} count={4} min={240} />
      ) : membres.length === 0 ? (
        <EmptyState
          icon={<GroupsRoundedIcon />} title="Aucun membre pour l'instant"
          description="Ajoutez les personnes de votre foyer pour adapter les repas à leurs goûts et à leur santé."
          action={<Button variant="contained" startIcon={<PersonAddAlt1RoundedIcon />} onClick={() => navigate('/famille-dashboard/add-membre')}>Ajouter un membre</Button>}
        />
      ) : (
        <>
          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {filtered.map((m) => (
              <MemberCard key={m.id} membre={m} onOpen={() => open(m)} onEdit={() => edit(m)} onDelete={() => handleDelete(m)} />
            ))}
          </Box>
          {filtered.length === 0 && <Typography color="text.secondary" sx={{ mt: 2 }}>Aucun membre ne correspond à « {search} ».</Typography>}
        </>
      )}

      <MemberDetail membre={selected} plats={plats} onClose={() => open(null)} onEdit={() => selected && edit(selected)} onDelete={() => selected && handleDelete(selected)} />
    </Box>
  );
}

export default MembresList;
