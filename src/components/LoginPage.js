// src/components/LoginPage.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useNavigate, Link as RouterLink } from 'react-router-dom'

import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Alert,
  Link as MuiLink, // Renommer pour éviter le conflit avec Link de react-router-dom
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google'; // Icône Google

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess('Connexion réussie ! Redirection vers le tableau de bord...');
      setTimeout(() => {
        navigate('/famille-dashboard/membres'); // Rediriger vers la page des membres après connexion
      }, 1500);
    } catch (err) {
      console.error('Erreur de connexion par email :', err);
      setError(`Erreur de connexion: ${err.message}`);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccess('Connexion Google réussie ! Redirection vers le tableau de bord...');
      setTimeout(() => {
        navigate('/famille-dashboard/membres'); // Rediriger vers la page des membres après connexion
      }, 1500);
    } catch (err) {
      console.error('Erreur de connexion Google :', err);
      setError(`Erreur de connexion Google: ${err.message}`);
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ padding: 4, mt: 8, borderRadius: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Connexion
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleEmailLogin} sx={{ mt: 2 }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Mot de passe"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, mb: 1 }}>
            Se connecter
          </Button>
          <Typography variant="body2" align="center" sx={{ my: 2 }}>
            OU
          </Typography>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{ mb: 2 }}
          >
            Se connecter avec Google
          </Button>
        </Box>

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Pas encore de compte ?{' '}
         <MuiLink component={RouterLink} to="/inscription">
            S'inscrire ici
          </MuiLink>
        </Typography>
      </Paper>
    </Container>
  );
}

export default LoginPage;