// src/pages/Dashboard/AddEditMembre.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createMembre, getMembreById, updateMembre } from '../../services/membreService';
import { getPlats } from '../../services/platService';

import {
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
  CircularProgress,
  InputLabel,
  FormGroup,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Autocomplete // Import Autocomplete
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

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

// Suggestions pour les Autocompletes et listes déroulantes
const couleursSuggestions = ['Bleu', 'Vert', 'Rouge', 'Jaune', 'Noir', 'Blanc', 'Rose', 'Violet', 'Orange', 'Gris'];
const filmsSeriesSuggestions = [
  'Science-fiction', 'Fantastique', 'Action', 'Comédie', 'Drame', 'Thriller', 'Horreur', 'Documentaire',
  'Animation', 'Aventure', 'Romance', 'Historique', 'Policier', 'Musical', 'Western'
];
const animauxCompagnieSuggestions = ['Chien', 'Chat', 'Oiseau', 'Poisson', 'Hamster', 'Lapin', 'Furet'];
const loisirsSuggestions = [
  'Lecture', 'Sport', 'Musique', 'Jardinage', 'Cuisine', 'Voyages', 'Jeux vidéo', 'Randonnée',
  'Peinture', 'Photographie', 'Écriture', 'Bénévolat', 'Pêche', 'Chasse', 'Danse', 'Théâtre'
];


function AddEditMembre() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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
    taille: '',
    poids: '',
    groupeSanguin: '',
    telephone: '',
    allergiesConnues: [],
    autreAllergie: '',
    profession: '',
    niveauEtude: '',
    autreProfession: '',
    situationMatrimoniale: '',
    // Nouveaux champs
    dateNaissance: '',
    lieuNaissance: '',
    languesParlees: '',
    nationalite: '',
    nomCompletContactUrgence: '',
    relationContactUrgence: '',
    telephoneContactUrgence: '',
    couleurPreferee: '',
    filmSeriePrefere: '',
    loisirsHobbies: [], // Changed to array for multi-select
    animauxCompagnie: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allPlats, setAllPlats] = useState([]);

  // État local pour gérer l'affichage des champs "Autres"
  const [showAutreAntecedent, setShowAutreAntecedent] = useState(false);
  const [showAutreRoleFamille, setShowAutreRoleFamille] = useState(false);
  const [showAutreAllergie, setShowAutreAllergie] = useState(false);

  useEffect(() => {
    const fetchAllPlats = async () => {
      try {
        const platsData = await getPlats();
        setAllPlats(platsData);
      } catch (err) {
        console.error('Erreur lors du chargement des plats disponibles :', err);
      }
    };
    fetchAllPlats();

    if (id) {
      fetchMembreData(id);
    } else {
      setFormData({
        email: '', nomComplet: '', age: '', sexe: 'homme',
        antecedentsMedicaux: [], autreAntecedent: '',
        roleFamille: [], autreRoleFamille: '',
        photoProfil: '', platsPreferes: [],
        taille: '', poids: '', groupeSanguin: '', telephone: '',
        allergiesConnues: [], autreAllergie: '',
        profession: '', niveauEtude: '', autreProfession: '', situationMatrimoniale: '',
        dateNaissance: '', lieuNaissance: '', languesParlees: '', nationalite: '',
        nomCompletContactUrgence: '', relationContactUrgence: '', telephoneContactUrgence: '',
        couleurPreferee: '', filmSeriePrefere: '', loisirsHobbies: [], animauxCompagnie: '',
      });
      setError('');
      setSuccess('');
    }
  }, [id]);

  const fetchMembreData = async (membreId) => {
    setLoading(true);
    setError('');
    try {
      const membre = await getMembreById(membreId);
      if (membre) {
        const antecedents = membre.antecedentsMedicaux || [];
        const roles = membre.roleFamille || [];
        const platsP = membre.platsPreferes || [];
        const allergies = membre.allergiesConnues || [];
        const profession = membre.profession || '';

        let autreAntecedentText = '';
        let filteredAntecedents = [...antecedents];
        const hasAutreAntecedent = antecedents.some(a => a.startsWith('Autre: '));
        if (hasAutreAntecedent) {
            autreAntecedentText = antecedents.find(a => a.startsWith('Autre: ')).replace('Autre: ', '');
            filteredAntecedents = antecedents.filter(a => !a.startsWith('Autre: '));
            setShowAutreAntecedent(true);
        } else {
            setShowAutreAntecedent(false);
        }

        let autreRoleText = '';
        let filteredRoles = [...roles];
        const hasAutreRole = roles.some(r => r.startsWith('Autre: '));
        if (hasAutreRole) {
            autreRoleText = roles.find(r => r.startsWith('Autre: ')).replace('Autre: ', '');
            filteredRoles = roles.filter(r => !r.startsWith('Autre: '));
            setShowAutreRoleFamille(true);
        } else {
            setShowAutreRoleFamille(false);
        }

        let autreAllergieText = '';
        let filteredAllergies = [...allergies];
        const hasAutreAllergie = allergies.some(a => a.startsWith('Autre: '));
        if (hasAutreAllergie) {
            autreAllergieText = allergies.find(a => a.startsWith('Autre: ')).replace('Autre: ', '');
            filteredAllergies = allergies.filter(a => !a.startsWith('Autre: '));
            setShowAutreAllergie(true);
        } else {
            setShowAutreAllergie(false);
        }

        let professionValue = profession;
        let autreProfessionText = '';
        let niveauEtudeText = '';

        if (profession.startsWith('Autre: ')) {
            professionValue = 'Autre';
            autreProfessionText = profession.replace('Autre: ', '');
        } else if (profession.startsWith('Étudiant (Niveau: ')) {
            professionValue = 'Étudiant';
            niveauEtudeText = profession.replace('Étudiant (Niveau: ', '').slice(0, -1);
        }

        setFormData({
          email: membre.email || '',
          nomComplet: membre.nomComplet || '',
          age: membre.age || '',
          sexe: membre.sexe || 'homme',
          antecedentsMedicaux: filteredAntecedents,
          autreAntecedent: autreAntecedentText,
          roleFamille: filteredRoles,
          autreRoleFamille: autreRoleText,
          photoProfil: membre.photoProfil || '',
          platsPreferes: platsP,
          taille: membre.taille || '',
          poids: membre.poids || '',
          groupeSanguin: membre.groupeSanguin || '',
          telephone: membre.telephone || '',
          allergiesConnues: filteredAllergies,
          autreAllergie: autreAllergieText,
          profession: professionValue,
          niveauEtude: niveauEtudeText,
          autreProfession: autreProfessionText,
          situationMatrimoniale: membre.situationMatrimoniale || '',
          dateNaissance: membre.dateNaissance || '',
          lieuNaissance: membre.lieuNaissance || '',
          languesParlees: membre.languesParlees || '',
          nationalite: membre.nationalite || '',
          nomCompletContactUrgence: membre.nomCompletContactUrgence || '',
          relationContactUrgence: membre.relationContactUrgence || '',
          telephoneContactUrgence: membre.telephoneContactUrgence || '',
          couleurPreferee: membre.couleurPreferee || '',
          filmSeriePrefere: membre.filmSeriePrefere || '',
          // S'assurer que loisirsHobbies est un tableau pour le Select multiple
          loisirsHobbies: Array.isArray(membre.loisirsHobbies) ? membre.loisirsHobbies : (membre.loisirsHobbies ? [membre.loisirsHobbies] : []),
          animauxCompagnie: membre.animauxCompagnie || '',
        });
      } else {
        setError("Membre non trouvé.");
      }
    } catch (err) {
      console.error("Erreur lors du chargement du membre pour édition:", err);
      setError("Erreur lors du chargement du membre: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === 'platsPreferes' || name === 'loisirsHobbies') { // Handle multi-select for loisirsHobbies
        setFormData(prev => ({
            ...prev,
            [name]: typeof value === 'string' ? value.split(',') : value,
        }));
    } else if (type === 'checkbox') {
        const checkboxValue = e.target.value;
        setFormData(prev => {
            let updatedAntecedents = [...prev.antecedentsMedicaux];
            let updatedAutreAntecedent = prev.autreAntecedent;
            let updatedRoles = [...prev.roleFamille];
            let updatedAutreRole = prev.autreRoleFamille;
            let updatedAllergies = [...prev.allergiesConnues];
            let updatedAutreAllergie = prev.autreAllergie;

            if (name.includes('antecedent')) {
                if (checkboxValue === 'RAS') {
                    updatedAntecedents = checked ? ['RAS'] : prev.antecedentsMedicaux.filter(a => a !== 'RAS');
                    updatedAutreAntecedent = checked ? '' : updatedAutreAntecedent;
                    setShowAutreAntecedent(false); // Hide 'Autre' field if RAS is checked
                } else if (checkboxValue === 'Autre') {
                    setShowAutreAntecedent(checked); // Toggle visibility of 'Autre' field
                    if (!checked) updatedAutreAntecedent = ''; // Clear text if unchecked
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
                    setShowAutreRoleFamille(checked); // Toggle visibility
                    if (!checked) updatedAutreRole = ''; // Clear text if unchecked
                } else {
                    if (checked) {
                        updatedRoles = [...prev.roleFamille, checkboxValue];
                    } else {
                        updatedRoles = prev.roleFamille.filter(r => r !== checkboxValue);
                    }
                }
            } else if (name.includes('allergie')) {
                if (checkboxValue === 'RAS') {
                    updatedAllergies = checked ? ['RAS'] : prev.allergiesConnues.filter(a => a !== 'RAS');
                    updatedAutreAllergie = checked ? '' : updatedAutreAllergie;
                    setShowAutreAllergie(false); // Hide 'Autre' field if RAS is checked
                } else if (checkboxValue === 'Autre') {
                    setShowAutreAllergie(checked); // Toggle visibility
                    if (!checked) updatedAutreAllergie = ''; // Clear text if unchecked
                    if (checked && prev.allergiesConnues.includes('RAS')) {
                       updatedAllergies = prev.allergiesConnues.filter(a => a !== 'RAS');
                    }
                } else {
                    if (checked) {
                        updatedAllergies = [...prev.allergiesConnues.filter(a => a !== 'RAS'), checkboxValue];
                    } else {
                        updatedAllergies = prev.allergiesConnues.filter(a => a !== checkboxValue);
                    }
                }
            }
            return {
                ...prev,
                antecedentsMedicaux: updatedAntecedents,
                autreAntecedent: updatedAutreAntecedent,
                roleFamille: updatedRoles,
                autreRoleFamille: updatedAutreRole,
                allergiesConnues: updatedAllergies,
                autreAllergie: updatedAutreAllergie,
            };
        });
    } else if (type === 'file') {
        const file = files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photoProfil: reader.result })); // Stocke la chaîne base64
            };
            reader.readAsDataURL(file);
        } else {
            setFormData(prev => ({ ...prev, photoProfil: '' })); // Vider si pas de fichier
        }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Generic handler for Autocomplete changes
  const handleAutocompleteChange = (name) => (event, value) => {
    setFormData(prev => ({ ...prev, [name]: value || '' })); // Ensure value is not null for TextField
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let finalAntecedents = [...formData.antecedentsMedicaux];
      if (showAutreAntecedent && formData.autreAntecedent.trim() !== '') {
          finalAntecedents = finalAntecedents.filter(a => a !== 'RAS');
          finalAntecedents.push(`Autre: ${formData.autreAntecedent.trim()}`);
      } else {
          finalAntecedents = finalAntecedents.filter(a => !a.startsWith('Autre: '));
      }
      if (finalAntecedents.length === 0 && formData.autreAntecedent.trim() === '' && !showAutreAntecedent) {
          finalAntecedents = ['RAS'];
      }


      let finalRoles = [...formData.roleFamille];
      if (showAutreRoleFamille && formData.autreRoleFamille.trim() !== '') {
          finalRoles.push(`Autre: ${formData.autreRoleFamille.trim()}`);
      } else {
          finalRoles = finalRoles.filter(r => !r.startsWith('Autre: '));
      }

      let finalAllergies = [...formData.allergiesConnues];
      if (showAutreAllergie && formData.autreAllergie.trim() !== '') {
          finalAllergies = finalAllergies.filter(a => a !== 'RAS'); // Remove RAS if other allergy is specified
          finalAllergies.push(`Autre: ${formData.autreAllergie.trim()}`);
      } else {
          finalAllergies = finalAllergies.filter(a => !a.startsWith('Autre: '));
      }
      if (finalAllergies.length === 0 && formData.autreAllergie.trim() === '' && !showAutreAllergie) {
        finalAllergies = ['RAS'];
      }


      let finalProfession = formData.profession;
      if (formData.profession === 'Étudiant' && formData.niveauEtude.trim() !== '') {
          finalProfession = `Étudiant (Niveau: ${formData.niveauEtude.trim()})`;
      } else if (formData.profession === 'Autre' && formData.autreProfession.trim() !== '') {
          finalProfession = `Autre: ${formData.autreProfession.trim()}`;
      }


      const memberDataToSave = {
        email: formData.email,
        nomComplet: formData.nomComplet,
        age: parseInt(formData.age, 10),
        sexe: formData.sexe,
        antecedentsMedicaux: finalAntecedents,
        roleFamille: finalRoles,
        photoProfil: formData.photoProfil,
        platsPreferes: formData.platsPreferes,
        taille: formData.taille,
        poids: formData.poids,
        groupeSanguin: formData.groupeSanguin,
        telephone: formData.telephone,
        allergiesConnues: finalAllergies,
        profession: finalProfession,
        situationMatrimoniale: formData.situationMatrimoniale,
        // Nouveaux champs à sauvegarder
        dateNaissance: formData.dateNaissance,
        lieuNaissance: formData.lieuNaissance,
        languesParlees: formData.languesParlees,
        nationalite: formData.nationalite,
        nomCompletContactUrgence: formData.nomCompletContactUrgence,
        relationContactUrgence: formData.relationContactUrgence,
        telephoneContactUrgence: formData.telephoneContactUrgence,
        couleurPreferee: formData.couleurPreferee,
        filmSeriePrefere: formData.filmSeriePrefere,
        loisirsHobbies: formData.loisirsHobbies, // Now an array
        animauxCompagnie: formData.animauxCompagnie,
      };

      if (id) {
        // En mode édition, l'UID et l'email ne sont pas modifiés via ce formulaire
        await updateMembre(id, memberDataToSave);
        setSuccess('Membre mis à jour avec succès !');
      } else {
        // En mode ajout, l'UID du membre est défini par son email
        await createMembre({ ...memberDataToSave, uid: formData.email });
        setSuccess('Membre ajouté avec succès !');
      }

      setTimeout(() => {
        navigate('/famille-dashboard/membres'); // Rediriger vers la liste des membres après succès
      }, 1500);

    } catch (err) {
      console.error("Erreur lors de l'opération sur le membre:", err);
      // Gérer les erreurs spécifiques pour la création
      let errorMessage = "Erreur : " + err.message;
      if (err.code === 'already-exists') { // Erreur potentielle de Firestore si l'ID (email) existe déjà
        errorMessage = "Cet email est déjà utilisé pour un autre membre. Veuillez en utiliser un autre.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && id && !formData.nomComplet) { // Afficher le loader seulement si on est en mode édition et les données ne sont pas encore chargées
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Chargement des données du membre...</Typography>
          </Box>
      );
  }

  return (
    <Paper elevation={3} sx={{ padding: 4, mt: 2, borderRadius: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        {id ? 'Modifier un Membre de la Famille' : 'Ajouter un Nouveau Membre'}
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
        {/* Informations de base */}
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Informations de Base</Typography>
        <TextField
          fullWidth
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleFormChange}
          margin="normal"
          required
          disabled={!!id}
        />
        <TextField
          fullWidth
          label="Nom Complet"
          type="text"
          name="nomComplet"
          value={formData.nomComplet}
          onChange={handleFormChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Age"
          type="number"
          name="age"
          value={formData.age}
          onChange={handleFormChange}
          margin="normal"
          required
        />
        <FormControl component="fieldset" margin="normal" fullWidth>
          <FormLabel component="legend">Sexe</FormLabel>
          <RadioGroup
            row
            name="sexe"
            value={formData.sexe}
            onChange={handleFormChange}
          >
            <FormControlLabel value="homme" control={<Radio />} label="Homme" />
            <FormControlLabel value="femme" control={<Radio />} label="Femme" />
          </RadioGroup>
        </FormControl>

        {/* Informations Personnelles Détaillées */}
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Détails Personnels</Typography>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Date de Naissance"
                    type="date"
                    name="dateNaissance"
                    value={formData.dateNaissance}
                    onChange={handleFormChange}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Lieu de Naissance"
                    type="text"
                    name="lieuNaissance"
                    value={formData.lieuNaissance}
                    onChange={handleFormChange}
                    margin="normal"
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
  fullWidth
  label="Langues Parlées"
  name="languesParlees"
  value={formData.languesParlees}
  onChange={handleFormChange}
  margin="normal"
  placeholder="Ex: Français, Anglais, Espagnol"
  InputProps={{
    inputProps: { list: 'languesSuggestions' },
  }}
/>
<datalist id="languesSuggestions">
  {[
    'Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Arabe', 'Chinois', 'Russe',
    'Portugais', 'Japonais', 'Coréen', 'Hindi', 'Bambara', 'Swahili', 'Peul', 'Wolof',
    'Lingala', 'Tigrigna', 'Malgache', 'Ewondo', 'Fang', 'Bassa', 'Duala'
  ].map((langue, index) => (
    <option key={index} value={langue} />
  ))}
</datalist>

            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Nationalité"
                    type="text"
                    name="nationalite"
                    value={formData.nationalite}
                    onChange={handleFormChange}
                    margin="normal"
                />
            </Grid>
        </Grid>

        {/* Informations physiques et de contact */}
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Santé et Contact</Typography>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Taille (cm)"
                    type="number"
                    name="taille"
                    value={formData.taille}
                    onChange={handleFormChange}
                    margin="normal"
                    inputProps={{ min: 0 }}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Poids (kg)"
                    type="number"
                    name="poids"
                    value={formData.poids}
                    onChange={handleFormChange}
                    margin="normal"
                    inputProps={{ min: 0 }}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
  fullWidth
  label="Groupe Sanguin"
  name="groupeSanguin"
  value={formData.groupeSanguin}
  onChange={handleFormChange}
  margin="normal"
  placeholder="Ex: A+, O-"
  InputProps={{
    inputProps: { list: 'groupeSanguinSuggestions' },
  }}
  size="small" // Ajustement de taille visuelle
/>
<datalist id="groupeSanguinSuggestions">
  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group, index) => (
    <option key={index} value={group} />
  ))}
</datalist>

            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Numéro de Téléphone"
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleFormChange}
                    margin="normal"
                    placeholder="Ex: +237 6XX XXX XXX"
                />
            </Grid>
        </Grid>

        {/* Contact d'Urgence */}
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Contact d'Urgence</Typography>
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Nom Complet du Contact d'Urgence"
                    type="text"
                    name="nomCompletContactUrgence"
                    value={formData.nomCompletContactUrgence}
                    onChange={handleFormChange}
                    margin="normal"
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Relation avec le Contact d'Urgence"
                    type="text"
                    name="relationContactUrgence"
                    value={formData.relationContactUrgence}
                    onChange={handleFormChange}
                    margin="normal"
                    placeholder="Ex: Époux, Frère, Ami"
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Téléphone du Contact d'Urgence"
                    type="tel"
                    name="telephoneContactUrgence"
                    value={formData.telephoneContactUrgence}
                    onChange={handleFormChange}
                    margin="normal"
                    placeholder="Ex: +237 6XX XXX XXX"
                />
            </Grid>
        </Grid>

        <FormControl component="fieldset" margin="normal" fullWidth>
          <FormLabel component="legend">Allergies Connues</FormLabel>
          <Grid container spacing={1}>
            <Grid item xs={6} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.allergiesConnues.includes('RAS')}
                    onChange={handleFormChange}
                    value="RAS"
                    name="allergieRAS"
                  />
                }
                label="RAS (Rien à Signaler)"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.allergiesConnues.includes('Arachides')}
                    onChange={handleFormChange}
                    value="Arachides"
                    name="allergieArachides"
                    disabled={formData.allergiesConnues.includes('RAS')}
                  />
                }
                label="Arachides"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.allergiesConnues.includes('Gluten')}
                    onChange={handleFormChange}
                    value="Gluten"
                    name="allergieGluten"
                    disabled={formData.allergiesConnues.includes('RAS')}
                  />
                }
                label="Gluten"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.allergiesConnues.includes('Fruits de mer')}
                    onChange={handleFormChange}
                    value="Fruits de mer"
                    name="allergieFruitsDeMer"
                    disabled={formData.allergiesConnues.includes('RAS')}
                  />
                }
                label="Fruits de mer"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showAutreAllergie}
                    onChange={(e) => handleFormChange({ target: { name: 'allergieAutre', value: 'Autre', checked: e.target.checked, type: 'checkbox' } })}
                    value="Autre"
                    name="autreAllergieCheckbox"
                    disabled={formData.allergiesConnues.includes('RAS')}
                  />
                }
                label="Autres :"
              />
              {showAutreAllergie && !formData.allergiesConnues.includes('RAS') && (
                <TextField
                  size="small"
                  name="autreAllergie"
                  value={formData.autreAllergie}
                  onChange={handleFormChange}
                  placeholder="Spécifiez l'allergie"
                  fullWidth
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>
          </Grid>
        </FormControl>

        <FormControl component="fieldset" margin="normal" fullWidth>
          <FormLabel component="legend">Profession</FormLabel>
          <RadioGroup
            row
            name="profession"
            value={formData.profession}
            onChange={handleFormChange}
          >
            <FormControlLabel value="Salarié" control={<Radio />} label="Salarié" />
            <FormControlLabel value="Entrepreneur" control={<Radio />} label="Entrepreneur" />
            <FormControlLabel value="Étudiant" control={<Radio />} label="Étudiant" />
            <FormControlLabel value="Retraité" control={<Radio />} label="Retraité" />
            <FormControlLabel value="Sans emploi" control={<Radio />} label="Sans emploi" />
            <FormControlLabel value="Autre" control={<Radio />} label="Autre" />
          </RadioGroup>
          {formData.profession === 'Étudiant' && (
            <TextField
              fullWidth
              label="Niveau d'étude"
              name="niveauEtude"
              value={formData.niveauEtude}
              onChange={handleFormChange}
              margin="normal"
              sx={{ mt: 1 }}
            />
          )}
          {formData.profession === 'Autre' && (
            <TextField
              fullWidth
              label="Spécifiez la profession"
              name="autreProfession"
              value={formData.autreProfession}
              onChange={handleFormChange}
              margin="normal"
              sx={{ mt: 1 }}
            />
          )}
        </FormControl>

        <FormControl fullWidth margin="normal">
            <InputLabel id="situation-matrimoniale-label">Situation Matrimoniale</InputLabel>
            <Select
                labelId="situation-matrimoniale-label"
                id="situation-matrimoniale-select"
                value={formData.situationMatrimoniale}
                label="Situation Matrimoniale"
                onChange={handleFormChange}
                name="situationMatrimoniale"
                fullWidth
            >
                <MenuItem value=""><em>Non spécifié</em></MenuItem>
                <MenuItem value="Célibataire">Célibataire</MenuItem>
                <MenuItem value="Marié(e)">Marié(e)</MenuItem>
                <MenuItem value="Divorcé(e)">Divorcé(e)</MenuItem>
                <MenuItem value="Veuf/Veuve">Veuf/Veuve</MenuItem>
                <MenuItem value="Union Libre">Union Libre</MenuItem>
            </Select>
        </FormControl>

        <FormControl component="fieldset" margin="normal" fullWidth>
          <FormLabel component="legend">Antécédents Médicaux</FormLabel>
          <Grid container spacing={1}>
            <Grid item xs={6} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.antecedentsMedicaux.includes('RAS')}
                    onChange={handleFormChange}
                    value="RAS"
                    name="antecedentRAS"
                  />
                }
                label="RAS (Rien à Signaler)"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.antecedentsMedicaux.includes('Diabète')}
                    onChange={handleFormChange}
                    value="Diabète"
                    name="antecedentDiabete"
                    disabled={formData.antecedentsMedicaux.includes('RAS')}
                  />
                }
                label="Diabète"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.antecedentsMedicaux.includes('Hypertension')}
                    onChange={handleFormChange}
                    value="Hypertension"
                    name="antecedentHypertension"
                    disabled={formData.antecedentsMedicaux.includes('RAS')}
                  />
                }
                label="Hypertension"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.antecedentsMedicaux.includes('Allergie alimentaire')}
                    onChange={handleFormChange}
                    value="Allergie alimentaire"
                    name="antecedentAllergie"
                    disabled={formData.antecedentsMedicaux.includes('RAS')}
                  />
                }
                label="Allergie alimentaire"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showAutreAntecedent}
                    onChange={(e) => handleFormChange({ target: { name: 'antecedentAutre', value: 'Autre', checked: e.target.checked, type: 'checkbox' } })}
                    value="Autre"
                    name="autreAntecedentCheckbox"
                    disabled={formData.antecedentsMedicaux.includes('RAS')}
                  />
                }
                label="Autres :"
              />
              {showAutreAntecedent && !formData.antecedentsMedicaux.includes('RAS') && (
                <TextField
                  size="small"
                  name="autreAntecedent"
                  value={formData.autreAntecedent}
                  onChange={handleFormChange}
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
                control={<Checkbox checked={formData.roleFamille.includes('Mère')} onChange={handleFormChange} value="Mère" name="roleMere" />}
                label="Mère"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <FormControlLabel
                control={<Checkbox checked={formData.roleFamille.includes('Père')} onChange={handleFormChange} value="Père" name="rolePere" />}
                label="Père"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <FormControlLabel
                control={<Checkbox checked={formData.roleFamille.includes('Enfant')} onChange={handleFormChange} value="Enfant" name="roleEnfant" />}
                label="Enfant"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <FormControlLabel
                control={<Checkbox checked={formData.roleFamille.includes('Grand-parent')} onChange={handleFormChange} value="Grand-parent" name="roleGrandParent" />}
                label="Grand-parent"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={<Checkbox checked={showAutreRoleFamille} onChange={(e) => handleFormChange({ target: { name: 'roleAutre', value: 'Autre', checked: e.target.checked, type: 'checkbox' } })} value="Autre" name="autreRoleFamilleCheckbox" />}
                label="Autres :"
              />
              {showAutreRoleFamille && (
                <TextField
                  size="small"
                  name="autreRoleFamille"
                  value={formData.autreRoleFamille}
                  onChange={handleFormChange}
                  placeholder="Spécifiez le rôle"
                  fullWidth
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>
          </Grid>
        </FormControl>

        {/* Plats Préférés */}
        <FormControl fullWidth margin="normal">
            <InputLabel id="plats-preferes-label">Plats Préférés</InputLabel>
            <Select
                labelId="plats-preferes-label"
                id="plats-preferes-multiple-chip"
                multiple
                value={formData.platsPreferes}
                onChange={handleFormChange}
                input={<OutlinedInput id="select-multiple-chip" label="Plats Préférés" />}
                renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                            const plat = allPlats.find(p => p.id === value);
                            return <Chip key={value} label={plat ? plat.nom : value} />;
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

      {/* Préférences et Loisirs - Version avec TextField + datalist */}
<Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Préférences et Loisirs</Typography>
<Grid container spacing={2}>
  <Grid item xs={12} sm={6}>
    <TextField
      fullWidth
      label="Couleur Préférée"
      name="couleurPreferee"
      value={formData.couleurPreferee}
      onChange={handleFormChange}
      margin="normal"
      placeholder="Ex: Bleu, Vert émeraude"
      InputProps={{
        inputProps: { list: 'couleursSuggestions' },
      }}
    />
    <datalist id="couleursSuggestions">
      {[
        'Bleu', 'Vert', 'Rouge', 'Jaune', 'Noir', 'Blanc', 'Rose', 'Violet', 'Orange', 'Gris',
        'Turquoise', 'Bordeaux', 'Beige', 'Cyan', 'Indigo', 'Marron', 'Or', 'Argent',
        'Corail', 'Lavande', 'Sable', 'Émeraude', 'Menthe', 'Caramel'
      ].map((couleur, index) => (
        <option key={index} value={couleur} />
      ))}
    </datalist>
  </Grid>

  <Grid item xs={12} sm={6}>
    <TextField
      fullWidth
      label="Film/Série Préféré(e)"
      name="filmSeriePrefere"
      value={formData.filmSeriePrefere}
      onChange={handleFormChange}
      margin="normal"
      placeholder="Ex: Le Seigneur des Anneaux, Friends"
      InputProps={{
        inputProps: { list: 'filmsSuggestions' },
      }}
    />
    <datalist id="filmsSuggestions">
      {[
        'Action', 'Aventure', 'Animation', 'Biopic', 'Comédie', 'Comédie romantique',
        'Drame', 'Documentaire', 'Espionnage', 'Fantastique', 'Guerre', 'Historique',
        'Horreur', 'Musical', 'Mystère', 'Policier', 'Romance', 'Science-fiction',
        'Sport', 'Super-héros', 'Suspense', 'Thriller', 'Western', 'Zombie', 'Satire'
      ].map((genre, index) => (
        <option key={index} value={genre} />
      ))}
    </datalist>
  </Grid>

  <Grid item xs={12}>
    <TextField
      fullWidth
      label="Loisirs / Hobbies"
      name="loisirsHobbies"
      value={formData.loisirsHobbies.join(', ')}
      onChange={(e) =>
        setFormData((prev) => ({
          ...prev,
          loisirsHobbies: e.target.value.split(',').map(item => item.trim()),
        }))
      }
      margin="normal"
      placeholder="Ex: Lecture, Sport, Voyage"
      InputProps={{
        inputProps: { list: 'loisirsSuggestions' },
      }}
    />
    <datalist id="loisirsSuggestions">
      {[
        'Lecture', 'Écriture', 'Peinture', 'Dessin', 'Musique', 'Chant', 'Danse', 'Théâtre',
        'Photographie', 'Vidéos', 'Cuisine', 'Pâtisserie', 'Jardinage', 'Randonnée', 'Vélo',
        'Fitness', 'Yoga', 'Jeux vidéo', 'Jeux de société', 'Voyages', 'Plongée', 'Bricolage',
        'Modélisme', 'Astronomie', 'Pêche', 'Camping', 'Méditation', 'Blogging'
      ].map((loisir, index) => (
        <option key={index} value={loisir} />
      ))}
    </datalist>
  </Grid>

  <Grid item xs={12}>
    <TextField
      fullWidth
      label="Animaux de Compagnie"
      name="animauxCompagnie"
      value={formData.animauxCompagnie}
      onChange={handleFormChange}
      margin="normal"
      placeholder="Ex: Chien (Buddy), Chat (Miaou)"
      InputProps={{
        inputProps: { list: 'animauxSuggestions' },
      }}
    />
    <datalist id="animauxSuggestions">
      {[
        'Chien', 'Chat', 'Poisson', 'Tortue', 'Oiseau', 'Lapin', 'Hamster', 'Cochon d’Inde',
        'Furet', 'Cheval', 'Poney', 'Serpent', 'Lézard', 'Perroquet', 'Chinchilla',
        'Araignée', 'Souris', 'Rat', 'Canari', 'Cacatoès'
      ].map((animal, index) => (
        <option key={index} value={animal} />
      ))}
    </datalist>
  </Grid>
</Grid>


        <Box sx={{ my: 2 }}>
          <FormLabel component="legend" htmlFor="photo-upload">Photo de Profil (facultatif)</FormLabel>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="photo-upload"
            type="file"
            name="photoProfil"
            onChange={handleFormChange}
          />
          <label htmlFor="photo-upload">
            <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />} sx={{ mt: 1 }}>
              Choisir une photo
            </Button>
          </label>
          {formData.photoProfil && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Avatar src={formData.photoProfil} alt="Photo de Profil" sx={{ width: 100, height: 100 }} />
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button onClick={() => navigate('/famille-dashboard/membres')} startIcon={<CancelIcon />}>
            Annuler
          </Button>
          <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />}>
            {id ? 'Sauvegarder les modifications' : 'Ajouter le Membre'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

export default AddEditMembre;