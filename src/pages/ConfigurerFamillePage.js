// src/pages/ConfigurerFamillePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Box, Button, Card, Divider, IconButton, Tooltip, Typography } from '@mui/material';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { enqueueSnackbar } from 'notistack';
import { createMembre } from '../services/membreService';
import { Logo, PhotoPicker, patternBg } from '../components/ui';
import { IdentityFields, RoleHealthFields } from '../components/membres/MemberFields';
import { emptyMember, toMembre } from '../components/membres/memberModel';
import { friendlyError, initials } from '../utils';

function ConfigurerFamillePage() {
  const [membres, setMembres] = useState([emptyMember()]);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const setAt = (index) => (patch) =>
    setMembres((list) => list.map((m, i) => (i === index ? { ...m, ...patch } : m)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      for (const membre of membres) {
        // L'email sert d'identifiant du document pour les membres sans compte.
        await createMembre({ ...toMembre(membre, { basic: true }), uid: membre.email });
      }
      enqueueSnackbar(`${membres.length} membre(s) ajouté(s) à la famille !`, { variant: 'success' });
      navigate('/famille-dashboard', { replace: true });
    } catch (err) {
      console.error('Erreur lors de la configuration des membres :', err);
      enqueueSnackbar(friendlyError(err), { variant: 'error' });
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          pt: 'calc(env(safe-area-inset-top) + 28px)', pb: 10, px: 2, color: '#FFF3E0', textAlign: 'center',
          background: `${patternBg('#FFF3E0', 0.12)}, linear-gradient(135deg, #E8622C, #A9370F)`,
        }}
      >
        <Logo size={42} color="#FFF3E0" sx={{ justifyContent: 'center', mb: 3 }} />
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 28, md: 38 } }}>Présentez-nous votre famille</Typography>
        <Typography sx={{ opacity: 0.85, mt: 1, maxWidth: 560, mx: 'auto' }}>
          Ajoutez les personnes avec qui vous partagez les repas. Leurs goûts et leur santé guideront les menus.
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 820, mx: 'auto', px: 2, mt: -6, pb: 'calc(env(safe-area-inset-bottom) + 120px)' }}>
        {membres.map((membre, index) => (
          <Card key={index} sx={{ mb: 2.5, boxShadow: '0 20px 50px rgba(31,20,16,.08)', animation: 'fadeUp .35s ease both' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2 }}>
              <Avatar src={membre.photoProfil || undefined} sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
                {membre.nomComplet ? initials(membre.nomComplet) : index + 1}
              </Avatar>
              <Typography variant="h6" sx={{ flex: 1 }} noWrap>{membre.nomComplet || `Membre ${index + 1}`}</Typography>
              {membres.length > 1 && (
                <Tooltip title="Retirer ce membre">
                  <IconButton onClick={() => setMembres((l) => l.filter((_, i) => i !== index))}><DeleteOutlineRoundedIcon /></IconButton>
                </Tooltip>
              )}
            </Box>
            <Divider />
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' } }}>
                <PhotoPicker round size={104} value={membre.photoProfil} onChange={(v) => setAt(index)({ photoProfil: v })} label="Photo" />
                <Box sx={{ flex: 1, width: '100%' }}><IdentityFields form={membre} set={setAt(index)} /></Box>
              </Box>
              <RoleHealthFields form={membre} set={setAt(index)} />
            </Box>
          </Card>
        ))}

        <Button fullWidth variant="outlined" size="large" startIcon={<PersonAddAlt1RoundedIcon />}
          onClick={() => setMembres((l) => [...l, emptyMember()])}
          sx={{ borderStyle: 'dashed', borderWidth: 2, py: 2 }}>
          Ajouter un autre membre
        </Button>

        <Box
          sx={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', justifyContent: 'center', gap: 1.5,
            px: 2, pt: 1.5, pb: 'calc(env(safe-area-inset-bottom) + 14px)',
            bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider',
          }}
        >
          <Button color="inherit" onClick={() => navigate('/famille-dashboard')} disabled={busy}>Plus tard</Button>
          <Button type="submit" variant="contained" size="large" endIcon={<CheckRoundedIcon />} disabled={busy} sx={{ minWidth: 220 }}>
            {busy ? 'Enregistrement…' : 'Enregistrer la famille'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default ConfigurerFamillePage;
