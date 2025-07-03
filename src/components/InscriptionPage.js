// src/components/InscriptionPage.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Réintroduit l'importation
import { auth } from '../firebase/firebase';
import { createMembre } from '../services/membreService';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Paper,
  Grid,
  Avatar,
  Alert,
  FormGroup,
  Link as MuiLink, // Pour le lien vers la page de connexion
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

function InscriptionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Réintroduit le state du mot de passe
  const [nomComplet, setNomComplet] = useState('');
  const [age, setAge] = useState('');
  const [sexe, setSexe] = useState('homme');
  const [antecedentsMedicaux, setAntecedentsMedicaux] = useState([]);
  const [autreAntecedent, setAutreAntecedent] = useState('');
  const [roleFamille, setRoleFamille] = useState([]);
  const [autreRoleFamille, setAutreRoleFamille] = useState('');
  const [photoProfil, setPhotoProfil] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleAntecedentChange = (e) => {
    const { value, checked } = e.target;

    if (value === 'RAS' && checked) {
      setAntecedentsMedicaux(['RAS']);
      setAutreAntecedent('');
    } else if (value !== 'RAS' && checked && antecedentsMedicaux.includes('RAS')) {
      setAntecedentsMedicaux((prev) => prev.filter((a) => a !== 'RAS').concat(value));
    } else if (value === 'Autre') {
      setAutreAntecedent(checked ? '' : '');
      if (checked && antecedentsMedicaux.includes('RAS')) {
        setAntecedentsMedicaux((prev) => prev.filter((a) => a !== 'RAS'));
      }
    } else {
      if (checked) {
        setAntecedentsMedicaux((prev) => [...prev, value]);
      } else {
        setAntecedentsMedicaux((prev) => prev.filter((a) => a !== value));
      }
    }
  };

  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    if (value === 'Autre') {
      setAutreRoleFamille(checked ? '' : '');
    } else {
      if (checked) {
        setRoleFamille((prev) => [...prev, value]);
      } else {
        setRoleFamille((prev) => prev.filter((r) => r !== value));
      }
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoProfil(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // Utilisation de createUserWithEmailAndPassword
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let finalAntecedents = antecedentsMedicaux;
      if (autreAntecedent && !antecedentsMedicaux.includes('RAS')) {
        finalAntecedents = [...antecedentsMedicaux.filter(a => a !== 'Autre'), `Autre: ${autreAntecedent}`];
      } else if (antecedentsMedicaux.includes('RAS') && autreAntecedent) {
        finalAntecedents = [`Autre: ${autreAntecedent}`];
      }

      const finalRoles = autreRoleFamille ? [...roleFamille, `Autre: ${autreRoleFamille}`] : roleFamille;

      const membreData = {
        uid: user.uid, // Utiliser l'UID de l'utilisateur authentifié
        email: user.email,
        nomComplet,
        age: parseInt(age),
        sexe,
        antecedentsMedicaux: finalAntecedents,
        roleFamille: finalRoles,
        photoProfil,
      };
      await createMembre(membreData); // Créer le membre dans Firestore avec l'UID de Firebase Auth

      setSuccess('Inscription réussie et connexion ! Vous serez redirigé pour configurer les autres membres de la famille...');
      setTimeout(() => {
        navigate('/configurer-famille');
      }, 2000);

    } catch (err) {
      console.error('Erreur lors de l\'inscription :', err);
      setError(`Erreur lors de l'inscription: ${err.message || "Vérifiez vos informations et réessayez."}`);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, mt: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Inscription
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

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField // Le champ Mot de passe est réintroduit
            label="Mot de passe"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <TextField
            label="Nom Complet"
            type="text"
            fullWidth
            margin="normal"
            value={nomComplet}
            onChange={(e) => setNomComplet(e.target.value)}
            required
          />
          <TextField
            label="Age"
            type="number"
            fullWidth
            margin="normal"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />

          <FormControl component="fieldset" margin="normal" fullWidth>
            <FormLabel component="legend">Sexe</FormLabel>
            <RadioGroup row value={sexe} onChange={(e) => setSexe(e.target.value)}>
              <FormControlLabel value="homme" control={<Radio />} label="Homme" />
              <FormControlLabel value="femme" control={<Radio />} label="Femme" />
            </RadioGroup>
          </FormControl>

          <FormControl component="fieldset" margin="normal" fullWidth>
            <FormLabel component="legend">Antécédents Médicaux</FormLabel>
            <Grid container spacing={1}>
              <Grid xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={antecedentsMedicaux.includes('RAS')}
                      onChange={handleAntecedentChange}
                      value="RAS"
                    />
                  }
                  label="RAS (Rien à Signaler)"
                />
              </Grid>
              <Grid xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={antecedentsMedicaux.includes('Diabète')}
                      onChange={handleAntecedentChange}
                      value="Diabète"
                      disabled={antecedentsMedicaux.includes('RAS')}
                    />
                  }
                  label="Diabète"
                />
              </Grid>
              <Grid xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={antecedentsMedicaux.includes('Hypertension')}
                      onChange={handleAntecedentChange}
                      value="Hypertension"
                      disabled={antecedentsMedicaux.includes('RAS')}
                    />
                  }
                  label="Hypertension"
                />
              </Grid>
              <Grid xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={antecedentsMedicaux.includes('Allergie alimentaire')}
                      onChange={handleAntecedentChange}
                      value="Allergie alimentaire"
                      disabled={antecedentsMedicaux.includes('RAS')}
                    />
                  }
                  label="Allergie alimentaire"
                />
              </Grid>
              <Grid xs={12} sm={4}>
                 <FormControlLabel
                  control={
                    <Checkbox
                      checked={autreAntecedent !== ''}
                      onChange={handleAntecedentChange}
                      value="Autre"
                      disabled={antecedentsMedicaux.includes('RAS')}
                    />
                  }
                  label="Autre :"
                />
                {autreAntecedent !== '' && !antecedentsMedicaux.includes('RAS') && (
                  <TextField
                    size="small"
                    label="Spécifiez autre"
                    value={autreAntecedent}
                    onChange={(e) => setAutreAntecedent(e.target.value)}
                    fullWidth
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
            </Grid>
          </FormControl>

          <FormControl component="fieldset" margin="normal" fullWidth>
            <FormLabel component="legend">Rôle dans la Famille</FormLabel>
            <Grid container spacing={1}>
              <Grid xs={6} sm={4}>
                <FormControlLabel
                  control={<Checkbox checked={roleFamille.includes('Mère')} onChange={handleRoleChange} value="Mère" />}
                  label="Mère"
                />
              </Grid>
              <Grid xs={6} sm={4}>
                <FormControlLabel
                  control={<Checkbox checked={roleFamille.includes('Père')} onChange={handleRoleChange} value="Père" />}
                  label="Père"
                />
              </Grid>
              <Grid xs={6} sm={4}>
                <FormControlLabel
                  control={<Checkbox checked={roleFamille.includes('Enfant')} onChange={handleRoleChange} value="Enfant" />}
                  label="Enfant"
                />
              </Grid>
              <Grid xs={6} sm={4}>
                <FormControlLabel
                  control={<Checkbox checked={roleFamille.includes('Grand-parent')} onChange={handleRoleChange} value="Grand-parent" />}
                  label="Grand-parent"
                />
              </Grid>
              <Grid xs={12} sm={4}>
                <FormControlLabel
                  control={<Checkbox checked={autreRoleFamille !== ''} onChange={handleRoleChange} value="Autre" />}
                  label="Autre :"
                />
                {autreRoleFamille !== '' && (
                  <TextField
                    size="small"
                    label="Spécifiez autre rôle"
                    value={autreRoleFamille}
                    onChange={(e) => setAutreRoleFamille(e.target.value)}
                    fullWidth
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
            </Grid>
          </FormControl>

          <Box sx={{ my: 2 }}>
            <FormLabel component="legend" htmlFor="photo-upload">Photo de Profil (facultatif)</FormLabel>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              onChange={handlePhotoChange}
            />
            <label htmlFor="photo-upload">
              <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />} sx={{ mt: 1 }}>
                Choisir une photo
              </Button>
            </label>
            {photoProfil && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Avatar src={photoProfil} alt="Photo de Profil" sx={{ width: 100, height: 100 }} />
              </Box>
            )}
          </Box>

          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, mb: 2 }}>
            S'inscrire
          </Button>
        </Box>

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Déjà un compte ?{' '}
          <MuiLink component={RouterLink} to="/login">
            Se connecter ici
          </MuiLink>
        </Typography>
      </Paper>
    </Container>
  );
}

export default InscriptionPage;