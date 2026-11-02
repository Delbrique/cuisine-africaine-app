// src/components/LoginPage.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Divider, Link as MuiLink, TextField, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { auth } from '../firebase/firebase';
import { friendlyError } from '../utils';
import AuthLayout from './auth/AuthLayout';
import PasswordField from './auth/PasswordField';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const next = location.state?.from?.pathname || '/famille-dashboard';

  const run = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
      navigate(next, { replace: true });
    } catch (err) {
      console.error('Erreur de connexion :', err);
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  const handleEmailLogin = (e) => {
    e.preventDefault();
    run(() => signInWithEmailAndPassword(auth, email, password));
  };

  const handleGoogleLogin = () => run(() => signInWithPopup(auth, new GoogleAuthProvider()));

  return (
    <AuthLayout>
      <Typography variant="h4" component="h1" sx={{ mb: 0.75 }}>Bon retour 👋🏾</Typography>
      <Typography color="text.secondary" sx={{ mb: 3.5 }}>
        Connectez-vous pour retrouver le carnet de cuisine de votre famille.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

      <Button
        variant="outlined" fullWidth size="large" color="inherit" startIcon={<GoogleIcon />}
        onClick={handleGoogleLogin} disabled={busy}
      >
        Continuer avec Google
      </Button>

      <Divider sx={{ my: 3, color: 'text.secondary', fontSize: 13, fontWeight: 600 }}>ou avec votre email</Divider>

      <Box component="form" onSubmit={handleEmailLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Email" type="email" autoComplete="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} required />
        <PasswordField label="Mot de passe" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={busy} sx={{ mt: 1 }}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </Button>
      </Box>

      <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 3.5 }}>
        Pas encore de compte ?{' '}
        <MuiLink component={RouterLink} to="/inscription" sx={{ fontWeight: 700 }} underline="hover">
          Créer un compte
        </MuiLink>
      </Typography>
    </AuthLayout>
  );
}

export default LoginPage;
