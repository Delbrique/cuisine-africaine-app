// src/components/InscriptionPage.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Link as MuiLink, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { auth } from '../firebase/firebase';
import { createMembre } from '../services/membreService';
import { useAuth } from '../auth/AuthContext';
import { friendlyError } from '../utils';
import { PhotoPicker } from './ui';
import AuthLayout from './auth/AuthLayout';
import PasswordField from './auth/PasswordField';
import { IdentityFields, RoleHealthFields } from './membres/MemberFields';
import { emptyMember, toMembre } from './membres/memberModel';

const STEPS = ['Compte', 'Profil', 'Famille & santé'];

function InscriptionPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyMember());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const next = (e) => {
    e.preventDefault();
    setError('');
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };

  const submit = async () => {
    setBusy(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, password);
      await createMembre({ ...toMembre({ ...form, email: user.email }, { basic: true }), uid: user.uid });
      await refreshProfile();
      navigate('/configurer-famille', { replace: true });
    } catch (err) {
      console.error("Erreur lors de l'inscription :", err);
      setError(friendlyError(err, 'Vérifiez vos informations et réessayez.'));
      if (err.code?.startsWith('auth/')) setStep(0);
      setBusy(false);
    }
  };

  return (
    <AuthLayout wide={step > 0}>
      <Typography variant="h4" component="h1" sx={{ mb: 0.75 }}>Créer votre compte</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Trois petites étapes et votre cuisine est prête.</Typography>

      <Stepper activeStep={step} alternativeLabel sx={{ mb: 3.5, '& .MuiStepLabel-label': { fontWeight: 600, fontSize: 13 } }}>
        {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

      <Box component="form" onSubmit={next} key={step} sx={{ animation: 'fadeUp .3s ease both' }}>
        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} required />
            <PasswordField
              label="Mot de passe" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
              required inputProps={{ minLength: 6 }} helperText="Au moins 6 caractères"
            />
          </Box>
        )}

        {step === 1 && (
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' } }}>
            <PhotoPicker round size={112} value={form.photoProfil} onChange={(v) => set({ photoProfil: v })} label="Photo" />
            <Box sx={{ flex: 1, width: '100%' }}>
              <IdentityFields form={form} set={set} showEmail={false} />
            </Box>
          </Box>
        )}

        {step === 2 && <RoleHealthFields form={form} set={set} />}

        <Box sx={{ display: 'flex', gap: 1.5, mt: 4 }}>
          {step > 0 && (
            <Button onClick={() => setStep(step - 1)} color="inherit" startIcon={<ArrowBackRoundedIcon />} disabled={busy}>
              Retour
            </Button>
          )}
          <Button type="submit" variant="contained" size="large" sx={{ flex: 1 }} disabled={busy}
            endIcon={step < STEPS.length - 1 ? <ArrowForwardRoundedIcon /> : undefined}>
            {step < STEPS.length - 1 ? 'Continuer' : busy ? 'Création du compte…' : 'Créer mon compte'}
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 3.5 }}>
        Déjà un compte ?{' '}
        <MuiLink component={RouterLink} to="/login" sx={{ fontWeight: 700 }} underline="hover">Se connecter</MuiLink>
      </Typography>
    </AuthLayout>
  );
}

export default InscriptionPage;
