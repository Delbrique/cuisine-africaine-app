// src/pages/FamilleDashboardPage.js
import React, { useState, useEffect } from 'react';
import { getMembres, updateMembre, deleteMembre } from '../services/membreService';
import { getPlats } from '../services/platService'; // Importez le service des plats pour afficher les noms des plats préférés

// Importations des composants Material-UI
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Avatar,
  CircularProgress,
  Alert,
  FormGroup,
  InputLabel,
  Select, // Ajouté pour la sélection des plats préférés
  MenuItem, // Ajouté pour la sélection des plats préférés
  OutlinedInput, // Ajouté pour le Select multiple
  Chip, // Ajouté pour afficher les plats sélectionnés
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

// Pour le style du Select multiple (pour les Chips)
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function FamilleDashboardPage() {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allPlats, setAllPlats] = useState([]); // Pour stocker tous les plats disponibles

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentMembre, setCurrentMembre] = useState(null); // Membre en cours d'édition
  const [editFormData, setEditFormData] = useState({
    nomComplet: '',
    age: '',
    sexe: '',
    antecedentsMedicaux: [],
    autreAntecedent: '',
    roleFamille: [],
    autreRoleFamille: '',
    photoProfil: '',
    platsPreferes: [], // Ajout du champ platsPreferes
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setError('');
    setLoading(true);
    try {
      const membresData = await getMembres();
      setMembres(membresData);

      const platsData = await getPlats();
      setAllPlats(platsData);

      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des données :', err);
      setError('Erreur lors du chargement des données : ' + err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      setError('');
      setSuccess('');
      try {
        await deleteMembre(id);
        setSuccess('Membre supprimé avec succès !');
        fetchAllData(); // Rafraîchir la liste et les plats
      } catch (err) {
        console.error('Erreur lors de la suppression du membre :', err);
        setError('Erreur lors de la suppression du membre : ' + err.message);
      }
    }
  };

  const handleOpenEditDialog = (membre) => {
    setCurrentMembre(membre);
    // Préparez le formulaire d'édition avec les données du membre
    const antecedents = membre.antecedentsMedicaux || [];
    const roles = membre.roleFamille || [];
    const platsP = membre.platsPreferes || [];

    let autreAntecedentText = '';
    let filteredAntecedents = [];
    if (antecedents.some(a => a.startsWith('Autre: '))) {
        autreAntecedentText = antecedents.find(a => a.startsWith('Autre: ')).replace('Autre: ', '');
        filteredAntecedents = antecedents.filter(a => !a.startsWith('Autre: '));
    } else {
        filteredAntecedents = antecedents;
    }

    let autreRoleText = '';
    let filteredRoles = [];
    if (roles.some(r => r.startsWith('Autre: '))) {
        autreRoleText = roles.find(r => r.startsWith('Autre: ')).replace('Autre: ', '');
        filteredRoles = roles.filter(r => !r.startsWith('Autre: '));
    } else {
        filteredRoles = roles;
    }

    setEditFormData({
      nomComplet: membre.nomComplet,
      age: membre.age,
      sexe: membre.sexe,
      antecedentsMedicaux: filteredAntecedents,
      autreAntecedent: autreAntecedentText,
      roleFamille: filteredRoles,
      autreRoleFamille: autreRoleText,
      photoProfil: membre.photoProfil,
      platsPreferes: platsP,
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setCurrentMembre(null);
    setEditFormData({
      nomComplet: '', age: '', sexe: '', antecedentsMedicaux: [],
      autreAntecedent: '', roleFamille: [], autreRoleFamille: '',
      photoProfil: '', platsPreferes: [],
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === 'platsPreferes') {
        setEditFormData(prev => ({
            ...prev,
            [name]: typeof value === 'string' ? value.split(',') : value,
        }));
    } else if (type === 'checkbox') {
        const checkboxValue = e.target.value;
        setEditFormData(prev => {
            let updatedAntecedents = prev.antecedentsMedicaux;
            let updatedAutreAntecedent = prev.autreAntecedent;
            let updatedRoles = prev.roleFamille;
            let updatedAutreRole = prev.autreRoleFamille;

            if (name.includes('antecedent')) {
                if (checkboxValue === 'RAS') {
                    updatedAntecedents = checked ? ['RAS'] : prev.antecedentsMedicaux.filter(a => a !== 'RAS');
                    updatedAutreAntecedent = checked ? '' : updatedAutreAntecedent;
                } else if (checkboxValue === 'Autre') {
                    updatedAutreAntecedent = checked ? '' : '';
                    if (checked && prev.antecedentsMedicaux.includes('RAS')) {
                       updatedAntecedents = prev.antecedentsMedicaux.filter(a => a !== 'RAS');
                    }
                } else {
                    if (checked) {
                        updatedAntecedents = [...prev.antecedentsMedicaux.filter(a => a !== 'RAS'), checkboxValue];
                    } else {
                        updatedAntecedents = prev.antecedentsMedicaux.filter(a => a !== checkboxValue);
                    }
                }
            } else if (name.includes('role')) {
                if (checkboxValue === 'Autre') {
                    updatedAutreRole = checked ? '' : '';
                } else {
                    if (checked) {
                        updatedRoles = [...prev.roleFamille, checkboxValue];
                    } else {
                        updatedRoles = prev.roleFamille.filter(r => r !== checkboxValue);
                    }
                }
            }
            return {
                ...prev,
                antecedentsMedicaux: updatedAntecedents,
                autreAntecedent: updatedAutreAntecedent,
                roleFamille: updatedRoles,
                autreRoleFamille: updatedAutreRole
            };
        });
    } else if (type === 'file') {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditFormData(prev => ({ ...prev, photoProfil: reader.result })); // Stocke la chaîne base64
        };
        reader.readAsDataURL(file);
      } else {
          setEditFormData(prev => ({ ...prev, photoProfil: '' })); // Vider si pas de fichier
      }
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (!currentMembre) return;

      let finalAntecedents = [...editFormData.antecedentsMedicaux];
      if (editFormData.autreAntecedent.trim() !== '') {
          finalAntecedents = finalAntecedents.filter(a => a !== 'RAS');
          finalAntecedents.push(`Autre: ${editFormData.autreAntecedent.trim()}`);
      } else {
          finalAntecedents = finalAntecedents.filter(a => !a.startsWith('Autre: '));
      }
      if (finalAntecedents.length === 0 && editFormData.autreAntecedent.trim() === '') {
          finalAntecedents = ['RAS'];
      }


      let finalRoles = [...editFormData.roleFamille];
      if (editFormData.autreRoleFamille.trim() !== '') {
          finalRoles.push(`Autre: ${editFormData.autreRoleFamille.trim()}`);
      } else {
          finalRoles = finalRoles.filter(r => !r.startsWith('Autre: '));
      }


      const updatedData = {
        nomComplet: editFormData.nomComplet,
        age: parseInt(editFormData.age, 10),
        sexe: editFormData.sexe,
        antecedentsMedicaux: finalAntecedents,
        roleFamille: finalRoles,
        photoProfil: editFormData.photoProfil,
        platsPreferes: editFormData.platsPreferes,
      };

      await updateMembre(currentMembre.id, updatedData);
      setSuccess('Membre mis à jour avec succès !');
      handleCloseEditDialog();
      fetchAllData();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du membre :', err);
      setError('Erreur lors de la mise à jour : ' + err.message);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
        Tableau de Bord des Membres de la Famille
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Chargement des membres...</Typography>
        </Box>
      )}

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

      {!loading && membres.length === 0 && (
        <Typography variant="body1" align="center" sx={{ mt: 4 }}>
          Aucun membre de la famille enregistré pour l'instant. Ajoutez-en via la page de configuration.
        </Typography>
      )}

      {!loading && membres.length > 0 && (
        <Grid container spacing={3}>
          {membres.map((membre) => (
            <Grid item xs={12} sm={6} md={4} key={membre.id}>
              <Paper elevation={2} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                {membre.photoProfil ? (
                  <Avatar src={membre.photoProfil} alt={membre.nomComplet} sx={{ width: 100, height: 100, mb: 2 }} />
                ) : (
                  <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main' }}>
                    <Typography variant="h4">{membre.nomComplet ? membre.nomComplet.charAt(0) : '?'}</Typography>
                  </Avatar>
                )}
                <Typography variant="h6" gutterBottom>{membre.nomComplet}</Typography>
                <Typography variant="body2" color="text.secondary">Email: {membre.email}</Typography>
                <Typography variant="body2" color="text.secondary">Age: {membre.age}</Typography>
                <Typography variant="body2" color="text.secondary">Sexe: {membre.sexe}</Typography>

                {/* Affichage des rôles */}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Rôle(s):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {Array.isArray(membre.roleFamille) && membre.roleFamille.length > 0 ? (
                    membre.roleFamille.map((role, i) => (
                      <Chip key={i} label={role} size="small" color="info" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">Non spécifié</Typography>
                  )}
                </Box>

                {/* Affichage des antécédents */}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Antécédents:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {Array.isArray(membre.antecedentsMedicaux) && membre.antecedentsMedicaux.length > 0 ? (
                    membre.antecedentsMedicaux.map((antecedent, i) => (
                      <Chip key={i} label={antecedent} size="small" color="warning" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">RAS</Typography>
                  )}
                </Box>

                {/* Affichage des Plats Préférés */}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Plats Préférés:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {Array.isArray(membre.platsPreferes) && membre.platsPreferes.length > 0 ? (
                        membre.platsPreferes.map((platId, i) => {
                            const plat = allPlats.find(p => p.id === platId);
                            return plat ? <Chip key={i} label={plat.nom} size="small" color="success" /> : null;
                        })
                    ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">Aucun</Typography>
                    )}
                </Box>


                <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEditDialog(membre)}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(membre.id)}
                  >
                    Supprimer
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog d'édition de membre */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Modifier Membre : {currentMembre?.nomComplet}</DialogTitle>
        <DialogContent>
          {editFormData && (
            <Box component="form" onSubmit={handleEditSubmit} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Nom Complet"
                name="nomComplet"
                value={editFormData.nomComplet}
                onChange={handleEditFormChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Age"
                type="number"
                name="age"
                value={editFormData.age}
                onChange={handleEditFormChange}
                margin="normal"
                required
              />
              <FormControl component="fieldset" margin="normal" fullWidth>
                <FormLabel component="legend">Sexe</FormLabel>
                <RadioGroup
                  row
                  name="sexe"
                  value={editFormData.sexe}
                  onChange={handleEditFormChange}
                >
                  <FormControlLabel value="homme" control={<Radio />} label="Homme" />
                  <FormControlLabel value="femme" control={<Radio />} label="Femme" />
                </RadioGroup>
              </FormControl>

              <FormControl component="fieldset" margin="normal" fullWidth>
                <FormLabel component="legend">Antécédents Médicaux</FormLabel>
                <FormGroup row>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={editFormData.antecedentsMedicaux.includes('RAS')}
                                onChange={handleEditFormChange}
                                value="RAS"
                                name="antecedentRAS"
                            />
                        }
                        label="RAS (Rien à Signaler)"
                    />
                  <FormControlLabel
                    control={
                        <Checkbox
                            checked={editFormData.antecedentsMedicaux.includes('Diabète')}
                            onChange={handleEditFormChange}
                            value="Diabète"
                            name="antecedentDiabete"
                            disabled={editFormData.antecedentsMedicaux.includes('RAS')}
                        />
                    }
                    label="Diabète"
                  />
                  <FormControlLabel
                    control={
                        <Checkbox
                            checked={editFormData.antecedentsMedicaux.includes('Hypertension')}
                            onChange={handleEditFormChange}
                            value="Hypertension"
                            name="antecedentHypertension"
                            disabled={editFormData.antecedentsMedicaux.includes('RAS')}
                        />
                    }
                    label="Hypertension"
                  />
                  <FormControlLabel
                    control={
                        <Checkbox
                            checked={editFormData.antecedentsMedicaux.includes('Allergie alimentaire')}
                            onChange={handleEditFormChange}
                            value="Allergie alimentaire"
                            name="antecedentAllergie"
                            disabled={editFormData.antecedentsMedicaux.includes('RAS')}
                        />
                    }
                    label="Allergie alimentaire"
                  />
                  <FormControlLabel
                    control={
                        <Checkbox
                            checked={editFormData.autreAntecedent !== ''}
                            onChange={handleEditFormChange}
                            value="Autre"
                            name="autreAntecedent"
                            disabled={editFormData.antecedentsMedicaux.includes('RAS')}
                        />
                    }
                    label="Autres :"
                  />
                  {(editFormData.autreAntecedent !== '' || (editFormData.autreAntecedent === '' && editFormData.antecedentsMedicaux.some(a => a.startsWith('Autre: ')))) && !editFormData.antecedentsMedicaux.includes('RAS') && (
                    <TextField
                      size="small"
                      name="autreAntecedent"
                      value={editFormData.autreAntecedent}
                      onChange={handleEditFormChange}
                      placeholder="Spécifiez"
                      sx={{ ml: 1 }}
                    />
                  )}
                </FormGroup>
              </FormControl>

              <FormControl component="fieldset" margin="normal" fullWidth>
                <FormLabel component="legend">Rôle dans la Famille</FormLabel>
                <FormGroup row>
                  <FormControlLabel
                    control={<Checkbox name="roleMere" value="Mère" checked={editFormData.roleFamille.includes('Mère')} onChange={handleEditFormChange} />}
                    label="Mère"
                  />
                  <FormControlLabel
                    control={<Checkbox name="rolePere" value="Père" checked={editFormData.roleFamille.includes('Père')} onChange={handleEditFormChange} />}
                    label="Père"
                  />
                  <FormControlLabel
                    control={<Checkbox name="roleEnfant" value="Enfant" checked={editFormData.roleFamille.includes('Enfant')} onChange={handleEditFormChange} />}
                    label="Enfant"
                  />
                  <FormControlLabel
                    control={<Checkbox name="roleGrandParent" value="Grand-parent" checked={editFormData.roleFamille.includes('Grand-parent')} onChange={handleEditFormChange} />}
                    label="Grand-parent"
                  />
                  <FormControlLabel
                    control={<Checkbox name="autreRoleFamille" value="Autre" checked={editFormData.autreRoleFamille !== ''} onChange={handleEditFormChange} />}
                    label="Autres :"
                  />
                  {(editFormData.autreRoleFamille !== '' || (editFormData.autreRoleFamille === '' && editFormData.roleFamille.some(r => r.startsWith('Autre: ')))) && (
                    <TextField
                      size="small"
                      name="autreRoleFamille"
                      value={editFormData.autreRoleFamille}
                      onChange={handleEditFormChange}
                      placeholder="Spécifiez le rôle"
                      sx={{ ml: 1 }}
                    />
                  )}
                </FormGroup>
              </FormControl>

              {/* Plats Préférés dans le dialogue d'édition */}
              <FormControl fullWidth margin="normal">
                  <InputLabel id="edit-plats-preferes-label">Plats Préférés</InputLabel>
                  <Select
                      labelId="edit-plats-preferes-label"
                      id="edit-plats-preferes-multiple-chip"
                      multiple
                      value={editFormData.platsPreferes}
                      onChange={handleEditFormChange}
                      input={<OutlinedInput id="edit-select-multiple-chip" label="Plats Préférés" />}
                      renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => {
                                  const plat = allPlats.find(p => p.id === value);
                                  return plat ? <Chip key={value} label={plat.nom} /> : null;
                              })}
                          </Box>
                      )}
                      MenuProps={MenuProps}
                      name="platsPreferes"
                  >
                      {allPlats.length === 0 ? (
                          <MenuItem disabled>Aucun plat disponible. Ajoutez-en d'abord via "Gérer les Plats".</MenuItem>
                      ) : (
                          allPlats.map((plat) => (
                              <MenuItem key={plat.id} value={plat.id}>
                                  {plat.nom}
                              </MenuItem>
                          ))
                      )}
                  </Select>
              </FormControl>

              <Box sx={{ my: 2 }}>
                <InputLabel htmlFor="edit-photo-upload">Photo de Profil (facultatif)</InputLabel>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="edit-photo-upload"
                  type="file"
                  name="photoProfil"
                  onChange={handleEditFormChange}
                />
                <label htmlFor="edit-photo-upload">
                  <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />} sx={{ mt: 1 }}>
                    Choisir une photo
                  </Button>
                </label>
                {editFormData.photoProfil && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Avatar src={editFormData.photoProfil} alt="Photo de Profil" sx={{ width: 100, height: 100 }} />
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} startIcon={<CancelIcon />}>Annuler</Button>
          <Button onClick={handleEditSubmit} startIcon={<SaveIcon />} variant="contained" color="primary">
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default FamilleDashboardPage;