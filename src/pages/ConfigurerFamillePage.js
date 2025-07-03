// src/pages/ConfigurerFamillePage.js
import React, { useState } from 'react';
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
  Divider,
  Alert,
  FormGroup,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AddIcon from '@mui/icons-material/Add';
import DoneIcon from '@mui/icons-material/Done';

function ConfigurerFamillePage() {
  const [membres, setMembres] = useState([
    {
      email: '',
      nomComplet: '',
      age: '',
      sexe: 'homme',
      antecedentsMedicaux: [],
      autreAntecedent: '',
      roleFamille: [],
      autreRoleFamille: '',
      photoProfil: '',
      platsPreferes: [], // Initialiser les plats préférés
    },
  ]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleAjouterMembre = () => {
    setMembres([
      ...membres,
      {
        email: '',
        nomComplet: '',
        age: '',
        sexe: 'homme',
        antecedentsMedicaux: [],
        autreAntecedent: '',
        roleFamille: [],
        autreRoleFamille: '',
        photoProfil: '',
        platsPreferes: [],
      },
    ]);
  };

  const handleMembreChange = (index, e) => {
    const { name, value, type, checked, files } = e.target;
    const updatedMembres = [...membres];

    if (type === 'checkbox') {
      const checkboxValue = e.target.value;
      let currentMembre = updatedMembres[index];
      let updatedAntecedents = [...currentMembre.antecedentsMedicaux];
      let updatedRoles = [...currentMembre.roleFamille];

      if (name.includes('antecedent')) {
        if (checkboxValue === 'RAS') {
          if (checked) {
            updatedAntecedents = ['RAS'];
            currentMembre.autreAntecedent = ''; // Vider le champ "Autre" si RAS est coché
          } else {
            updatedAntecedents = updatedAntecedents.filter(a => a !== 'RAS');
          }
        } else if (checkboxValue === 'Autre') {
          currentMembre.autreAntecedent = checked ? '' : currentMembre.autreAntecedent; // Toggle text field
          if (checked && updatedAntecedents.includes('RAS')) {
            updatedAntecedents = updatedAntecedents.filter(a => a !== 'RAS');
          }
          // Ne pas ajouter 'Autre' directement au tableau
        } else { // Autres antécédents spécifiques
          if (checked) {
            updatedAntecedents = updatedAntecedents.filter(a => a !== 'RAS').concat(checkboxValue);
          } else {
            updatedAntecedents = updatedAntecedents.filter(a => a !== checkboxValue);
          }
        }
        updatedMembres[index].antecedentsMedicaux = updatedAntecedents;
      } else if (name.includes('role')) {
        if (checkboxValue === 'Autre') {
          currentMembre.autreRoleFamille = checked ? '' : currentMembre.autreRoleFamille; // Toggle text field
        } else {
          if (checked) {
            updatedRoles = [...updatedRoles, checkboxValue];
          } else {
            updatedRoles = updatedRoles.filter(r => r !== checkboxValue);
          }
        }
        updatedMembres[index].roleFamille = updatedRoles;
      }
    } else if (type === 'file') {
        const file = files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updatedMembres[index].photoProfil = reader.result; // Stocke la chaîne base64
                setMembres(updatedMembres);
            };
            reader.readAsDataURL(file);
        } else {
            updatedMembres[index].photoProfil = '';
            setMembres(updatedMembres);
        }
    } else {
      updatedMembres[index][name] = value;
    }
    setMembres(updatedMembres);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      for (const membre of membres) {
        // Préparer les antécédents médicaux et rôles pour le stockage
        let finalAntecedents = [...membre.antecedentsMedicaux];
        if (membre.autreAntecedent.trim() !== '') {
            finalAntecedents = finalAntecedents.filter(a => a !== 'RAS');
            finalAntecedents.push(`Autre: ${membre.autreAntecedent.trim()}`);
        } else {
            finalAntecedents = finalAntecedents.filter(a => !a.startsWith('Autre: '));
        }
        if (finalAntecedents.length === 0 && membre.autreAntecedent.trim() === '') {
            finalAntecedents = ['RAS'];
        }

        let finalRoles = [...membre.roleFamille];
        if (membre.autreRoleFamille.trim() !== '') {
            finalRoles.push(`Autre: ${membre.autreRoleFamille.trim()}`);
        } else {
            finalRoles = finalRoles.filter(r => !r.startsWith('Autre: '));
        }

        const membreData = {
            // Utilisation de l'email comme UID de document si pas d'UID Firebase Auth
            // IMPORTANT : L'email doit être unique pour chaque membre de la famille dans Firestore pour cette approche.
            uid: membre.email,
            email: membre.email,
            nomComplet: membre.nomComplet,
            age: parseInt(membre.age, 10),
            sexe: membre.sexe,
            antecedentsMedicaux: finalAntecedents,
            roleFamille: finalRoles,
            photoProfil: membre.photoProfil, // La chaîne Base64
            platsPreferes: membre.platsPreferes || [],
        };
        await createMembre(membreData); // Utilise createMembre qui gère setDoc avec l'ID
      }
      setSuccess('Membres de la famille configurés avec succès ! Redirection vers le tableau de bord...');
      setMembres([
        { // Réinitialise le formulaire après succès
          email: '', nomComplet: '', age: '', sexe: 'homme', antecedentsMedicaux: [],
          autreAntecedent: '', roleFamille: [], autreRoleFamille: '', photoProfil: '', platsPreferes: [],
        },
      ]);
      // Rediriger vers la page famille_dashboard
      setTimeout(() => {
        navigate('/famille-dashboard/membres'); // Redirige vers la liste des membres
      }, 2000);

    } catch (err) {
      console.error('Erreur lors de la configuration des membres :', err);
      setError(`Erreur de configuration: ${err.message}`);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: 4, mt: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Configurer les Autres Membres de la Famille
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
          {membres.map((membre, index) => (
            <Box key={index} sx={{ mb: 4, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
              <Typography variant="h6" gutterBottom>
                Membre {index + 1}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Email"
                type="email"
                name="email"
                value={membre.email}
                onChange={(e) => handleMembreChange(index, e)}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Nom Complet"
                type="text"
                name="nomComplet"
                value={membre.nomComplet}
                onChange={(e) => handleMembreChange(index, e)}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Age"
                type="number"
                name="age"
                value={membre.age}
                onChange={(e) => handleMembreChange(index, e)}
                required
                margin="normal"
              />

              <FormControl component="fieldset" margin="normal" fullWidth>
                <FormLabel component="legend">Sexe</FormLabel>
                <RadioGroup
                  row
                  name={`sexe-${index}`}
                  value={membre.sexe}
                  onChange={(e) => handleMembreChange(index, { target: { name: 'sexe', value: e.target.value } })}
                >
                  <FormControlLabel value="homme" control={<Radio />} label="Homme" />
                  <FormControlLabel value="femme" control={<Radio />} label="Femme" />
                </RadioGroup>
              </FormControl>

              <FormControl component="fieldset" margin="normal" fullWidth>
                <FormLabel component="legend">Antécédents Médicaux</FormLabel>
                <Grid container spacing={1}>
                  <Grid item xs={6} sm={4}> {/* Utilisation de item xs={...} pour Grid */}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={membre.antecedentsMedicaux.includes('RAS')}
                          onChange={(e) => handleMembreChange(index, e)}
                          value="RAS"
                          name={`antecedentRAS-${index}`}
                        />
                      }
                      label="RAS (Rien à Signaler)"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={membre.antecedentsMedicaux.includes('Diabète')}
                          onChange={(e) => handleMembreChange(index, e)}
                          value="Diabète"
                          name={`antecedentDiabete-${index}`}
                          disabled={membre.antecedentsMedicaux.includes('RAS')}
                        />
                      }
                      label="Diabète"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={membre.antecedentsMedicaux.includes('Hypertension')}
                          onChange={(e) => handleMembreChange(index, e)}
                          value="Hypertension"
                          name={`antecedentHypertension-${index}`}
                          disabled={membre.antecedentsMedicaux.includes('RAS')}
                        />
                      }
                      label="Hypertension"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={membre.antecedentsMedicaux.includes('Allergie alimentaire')}
                          onChange={(e) => handleMembreChange(index, e)}
                          value="Allergie alimentaire"
                          name={`antecedentAllergie-${index}`}
                          disabled={membre.antecedentsMedicaux.includes('RAS')}
                        />
                      }
                      label="Allergie alimentaire"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={membre.autreAntecedent !== ''}
                          onChange={(e) => handleMembreChange(index, { target: { name: `antecedentAutreCheck-${index}`, value: 'Autre', checked: e.target.checked, type: 'checkbox' } })}
                          value="Autre"
                          disabled={membre.antecedentsMedicaux.includes('RAS')}
                        />
                      }
                      label="Autres :"
                    />
                    {(membre.autreAntecedent !== '' || (membre.autreAntecedent === '' && membre.antecedentsMedicaux.some(a => a.startsWith('Autre: ')))) && !membre.antecedentsMedicaux.includes('RAS') && (
                      <TextField
                        size="small"
                        name="autreAntecedent"
                        value={membre.autreAntecedent}
                        onChange={(e) => handleMembreChange(index, e)}
                        placeholder="Spécifiez"
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
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={<Checkbox checked={membre.roleFamille.includes('Mère')} onChange={(e) => handleMembreChange(index, e)} value="Mère" name={`roleMere-${index}`} />}
                      label="Mère"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={<Checkbox checked={membre.roleFamille.includes('Père')} onChange={(e) => handleMembreChange(index, e)} value="Père" name={`rolePere-${index}`} />}
                      label="Père"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={<Checkbox checked={membre.roleFamille.includes('Enfant')} onChange={(e) => handleMembreChange(index, e)} value="Enfant" name={`roleEnfant-${index}`} />}
                      label="Enfant"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControlLabel
                      control={<Checkbox checked={membre.roleFamille.includes('Grand-parent')} onChange={(e) => handleMembreChange(index, e)} value="Grand-parent" name={`roleGrandParent-${index}`} />}
                      label="Grand-parent"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={<Checkbox checked={membre.autreRoleFamille !== ''} onChange={(e) => handleMembreChange(index, { target: { name: `roleAutreCheck-${index}`, value: 'Autre', checked: e.target.checked, type: 'checkbox' } })} value="Autre" />}
                      label="Autres :"
                    />
                    {(membre.autreRoleFamille !== '' || (membre.autreRoleFamille === '' && membre.roleFamille.some(r => r.startsWith('Autre: ')))) && (
                      <TextField
                        size="small"
                        name="autreRoleFamille"
                        value={membre.autreRoleFamille}
                        onChange={(e) => handleMembreChange(index, e)}
                        placeholder="Spécifiez le rôle"
                        fullWidth
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Grid>
                </Grid>
              </FormControl>

              <Box sx={{ my: 2 }}>
                <FormLabel component="legend" htmlFor={`photo-upload-${index}`}>Photo de Profil (facultatif)</FormLabel>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id={`photo-upload-${index}`}
                  type="file"
                  name="photoProfil" // Le nom doit correspondre à la prop dans handleMembreChange
                  onChange={(e) => handleMembreChange(index, e)}
                />
                <label htmlFor={`photo-upload-${index}`}>
                  <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />} sx={{ mt: 1 }}>
                    Choisir une photo
                  </Button>
                </label>
                {membre.photoProfil && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Avatar src={membre.photoProfil} alt={`Photo de Profil ${index + 1}`} sx={{ width: 100, height: 100 }} />
                  </Box>
                )}
              </Box>
            </Box>
          ))}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAjouterMembre}
            >
              Ajouter un Autre Membre
            </Button>
            <Button type="submit" variant="contained" color="primary" endIcon={<DoneIcon />}>
              Continuer
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default ConfigurerFamillePage;