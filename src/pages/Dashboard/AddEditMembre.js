// src/pages/Dashboard/AddEditMembre.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ContactEmergencyRoundedIcon from '@mui/icons-material/ContactEmergencyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { enqueueSnackbar } from 'notistack';

import { createMembre, getMembreById, updateMembre } from '../../services/membreService';
import { getPlats } from '../../services/platService';
import { PageHeader, PhotoPicker, SectionCard } from '../../components/ui';
import SplashScreen from '../../components/SplashScreen';
import {
  AllergyFields, BodyFields, EmergencyFields, IdentityFields, PersonalFields, PreferenceFields, RoleHealthFields,
} from '../../components/membres/MemberFields';
import { emptyMember, fromMembre, toMembre } from '../../components/membres/memberModel';
import { friendlyError } from '../../utils';

function AddEditMembre() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyMember());
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [plats, setPlats] = useState([]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    getPlats().then(setPlats).catch((err) => console.error('Erreur lors du chargement des plats :', err));
    if (!id) {
      setForm(emptyMember());
      setLoading(false);
      return;
    }
    setLoading(true);
    getMembreById(id)
      .then((m) => {
        if (m) setForm(fromMembre(m));
        else enqueueSnackbar('Membre introuvable.', { variant: 'error' });
      })
      .catch((err) => enqueueSnackbar(`Erreur lors du chargement du membre : ${friendlyError(err)}`, { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = toMembre(form);
      if (id) {
        await updateMembre(id, data);
        enqueueSnackbar('Membre mis à jour !', { variant: 'success' });
      } else {
        // En ajout, l'identifiant du membre est son email.
        await createMembre({ ...data, uid: form.email });
        enqueueSnackbar('Membre ajouté à la famille !', { variant: 'success' });
      }
      navigate('/famille-dashboard/membres');
    } catch (err) {
      console.error("Erreur lors de l'opération sur le membre :", err);
      enqueueSnackbar(friendlyError(err), { variant: 'error' });
      setBusy(false);
    }
  };

  if (loading) return <SplashScreen inline label="Chargement du membre" />;

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <PageHeader
        eyebrow="Famille"
        title={id ? `Modifier ${form.nomComplet || 'le membre'}` : 'Nouveau membre'}
        subtitle="Seuls le nom, l'email et l'âge sont obligatoires. Le reste aide à composer des menus adaptés."
      />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '300px 1fr' }, alignItems: 'start' }}>
        <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: 3, borderRadius: 5, bgcolor: 'sand.main' }}>
          <PhotoPicker round size={150} value={form.photoProfil} onChange={(v) => set({ photoProfil: v })} label="Photo de profil" />
          <Typography variant="h6" sx={{ textAlign: 'center' }}>{form.nomComplet || 'Nom du membre'}</Typography>
          <Typography variant="body2" color="text.secondary">{form.email || 'email@exemple.com'}</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minWidth: 0 }}>
          <SectionCard icon={<BadgeRoundedIcon />} title="Identité">
            <IdentityFields form={form} set={set} emailDisabled={Boolean(id)} />
          </SectionCard>
          <SectionCard icon={<MonitorHeartRoundedIcon />} title="Famille & santé" subtitle="Pour éviter les mauvaises surprises à table">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <RoleHealthFields form={form} set={set} />
              <AllergyFields form={form} set={set} />
              <BodyFields form={form} set={set} />
            </Box>
          </SectionCard>
          <SectionCard icon={<FavoriteRoundedIcon />} title="Goûts & loisirs">
            <PreferenceFields form={form} set={set} plats={plats} />
          </SectionCard>
          <SectionCard icon={<PersonRoundedIcon />} title="Informations personnelles">
            <PersonalFields form={form} set={set} />
          </SectionCard>
          <SectionCard icon={<ContactEmergencyRoundedIcon />} title="Contact d'urgence">
            <EmergencyFields form={form} set={set} />
          </SectionCard>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'sticky', bottom: { xs: 'calc(84px + env(safe-area-inset-bottom))', md: 16 }, zIndex: 5, mt: 3,
          display: 'flex', justifyContent: 'flex-end', gap: 1.5, p: 1.5, borderRadius: 4,
          bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 16px 40px rgba(31,20,16,.12)',
        }}
      >
        <Button color="inherit" onClick={() => navigate('/famille-dashboard/membres')} disabled={busy}>Annuler</Button>
        <Button type="submit" variant="contained" startIcon={<CheckRoundedIcon />} disabled={busy}>
          {busy ? 'Enregistrement…' : id ? 'Enregistrer' : 'Ajouter le membre'}
        </Button>
      </Box>
    </Box>
  );
}

export default AddEditMembre;
