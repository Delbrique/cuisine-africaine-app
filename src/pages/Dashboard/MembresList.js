// src/pages/Dashboard/MembresList.js
import React, { useState, useEffect } from 'react';
import { getMembres, updateMembre, deleteMembre } from '../../services/membreService';
import { getPlats } from '../../services/platService';
import { useNavigate } from 'react-router-dom';

import {
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
  Select,
  MenuItem,
  OutlinedInput,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

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

// Suggestions pour les Autocompletes et listes déroulantes (AJOUTÉES ICI)
const couleursSuggestions = ['Bleu', 'Vert', 'Rouge', 'Jaune', 'Noir', 'Blanc', 'Rose', 'Violet', 'Orange', 'Gris',
  'Turquoise', 'Bordeaux', 'Beige', 'Cyan', 'Indigo', 'Marron', 'Or', 'Argent',
  'Corail', 'Lavande', 'Sable', 'Émeraude', 'Menthe', 'Caramel'];
const filmsSeriesSuggestions = [
  'Science-fiction', 'Fantastique', 'Action', 'Comédie', 'Drame', 'Thriller', 'Horreur', 'Documentaire',
  'Animation', 'Aventure', 'Romance', 'Historique', 'Policier', 'Musical', 'Western', 'Satire', 'Super-héros', 'Suspense', 'Zombie'
];
const animauxCompagnieSuggestions = ['Chien', 'Chat', 'Oiseau', 'Poisson', 'Hamster', 'Lapin', 'Furet',
  'Tortue', 'Cochon d’Inde', 'Cheval', 'Poney', 'Serpent', 'Lézard', 'Perroquet', 'Chinchilla',
  'Araignée', 'Souris', 'Rat', 'Canari', 'Cacatoès'];
const loisirsSuggestions = [
  'Lecture', 'Sport', 'Musique', 'Jardinage', 'Cuisine', 'Voyages', 'Jeux vidéo', 'Randonnée',
  'Peinture', 'Photographie', 'Écriture', 'Bénévolat', 'Pêche', 'Chasse', 'Danse', 'Théâtre',
  'Bricolage', 'Modélisme', 'Astronomie', 'Camping', 'Méditation', 'Blogging', 'Plongée'
];
const languesSuggestions = [
  'Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Arabe', 'Chinois', 'Russe',
  'Portugais', 'Japonais', 'Coréen', 'Hindi', 'Bambara', 'Swahili', 'Peul', 'Wolof',
  'Lingala', 'Tigrigna', 'Malgache', 'Ewondo', 'Fang', 'Bassa', 'Duala'
];
const groupeSanguinSuggestions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];


function MembresList() {
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allPlats, setAllPlats] = useState([]);

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentMembre, setCurrentMembre] = useState(null);
  const [editFormData, setEditFormData] = useState({
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
    dateNaissance: '',
    lieuNaissance: '',
    languesParlees: '',
    nationalite: '',
    nomCompletContactUrgence: '',
    relationContactUrgence: '',
    telephoneContactUrgence: '',
    couleurPreferee: '',
    filmSeriePrefere: '',
    loisirsHobbies: [],
    animauxCompagnie: '',
  });

  // États locaux pour gérer l'affichage des champs "Autres" dans le dialogue
  const [showAutreAntecedentInDialog, setShowAutreAntecedentInDialog] = useState(false);
  const [showAutreRoleFamilleInDialog, setShowAutreRoleFamilleInDialog] = useState(false);
  const [showAutreAllergieInDialog, setShowAutreAllergieInDialog] = useState(false);

  const navigate = useNavigate();

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

    fetchMembres();
  }, []);

  const fetchMembres = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await getMembres();
      setMembres(data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des membres :', err);
      setError('Erreur lors du chargement des membres : ' + err.message);
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
        fetchMembres();
      } catch (err) {
        console.error('Erreur lors de la suppression du membre :', err);
        setError('Erreur lors de la suppression du membre : ' + err.message);
      }
    }
  };

  const handleOpenEditDialog = (membre) => {
    setCurrentMembre(membre);

    // Initialisation et gestion des champs "Autres" pour les antécédents, rôles et allergies
    const antecedents = membre.antecedentsMedicaux || [];
    let autreAntecedentText = '';
    let filteredAntecedents = [...antecedents];
    const hasAutreAntecedent = antecedents.some(a => a.startsWith('Autre: '));
    if (hasAutreAntecedent) {
        autreAntecedentText = antecedents.find(a => a.startsWith('Autre: ')).replace('Autre: ', '');
        filteredAntecedents = antecedents.filter(a => !a.startsWith('Autre: '));
        setShowAutreAntecedentInDialog(true);
    } else {
        setShowAutreAntecedentInDialog(false);
    }

    const roles = membre.roleFamille || [];
    let autreRoleText = '';
    let filteredRoles = [...roles];
    const hasAutreRole = roles.some(r => r.startsWith('Autre: '));
    if (hasAutreRole) {
        autreRoleText = roles.find(r => r.startsWith('Autre: ')).replace('Autre: ', '');
        filteredRoles = roles.filter(r => !r.startsWith('Autre: '));
        setShowAutreRoleFamilleInDialog(true);
    } else {
        setShowAutreRoleFamilleInDialog(false);
    }

    const allergies = membre.allergiesConnues || [];
    let autreAllergieText = '';
    let filteredAllergies = [...allergies];
    const hasAutreAllergie = allergies.some(a => a.startsWith('Autre: '));
    if (hasAutreAllergie) {
        autreAllergieText = allergies.find(a => a.startsWith('Autre: ')).replace('Autre: ', '');
        filteredAllergies = allergies.filter(a => !a.startsWith('Autre: '));
        setShowAutreAllergieInDialog(true);
    } else {
        setShowAutreAllergieInDialog(false);
    }

    // Gérer la profession et le niveau d'étude/autre profession
    let professionValue = membre.profession || '';
    let autreProfessionText = '';
    let niveauEtudeText = '';

    if (professionValue.startsWith('Autre: ')) {
        professionValue = 'Autre';
        autreProfessionText = professionValue.replace('Autre: ', '');
    } else if (professionValue.startsWith('Étudiant (Niveau: ')) {
        professionValue = 'Étudiant';
        niveauEtudeText = professionValue.replace('Étudiant (Niveau: ', '').slice(0, -1);
    }


    setEditFormData({
      email: membre.email || '',
      nomComplet: membre.nomComplet || '',
      age: membre.age || '',
      sexe: membre.sexe || 'homme',
      antecedentsMedicaux: filteredAntecedents,
      autreAntecedent: autreAntecedentText,
      roleFamille: filteredRoles,
      autreRoleFamille: autreRoleText,
      photoProfil: membre.photoProfil || '',
      platsPreferes: membre.platsPreferes || [],
      taille: membre.taille || '',
      poids: membre.poids || '',
      groupeSanguin: membre.groupeSanguin || '',
      telephone: membre.telephone || '',
      allergiesConnues: filteredAllergies,
      autreAllergie: autreAllergieText,
      profession: professionValue, // Le type de profession
      niveauEtude: niveauEtudeText, // Pour Étudiant
      autreProfession: autreProfessionText, // Pour Autre profession
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
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setCurrentMembre(null);
    setEditFormData({
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
    // Réinitialiser les états d'affichage des champs "Autres"
    setShowAutreAntecedentInDialog(false);
    setShowAutreRoleFamilleInDialog(false);
    setShowAutreAllergieInDialog(false);
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === 'platsPreferes' || name === 'loisirsHobbies') {
        setEditFormData(prev => ({
            ...prev,
            [name]: typeof value === 'string' ? value.split(',').map(item => item.trim()) : value, // S'assurer que c'est un tableau de strings
        }));
    } else if (name === 'profession') {
        // Gérer la profession: si Étudiant ou Autre est sélectionné, réinitialiser les champs liés
        setEditFormData(prev => ({
            ...prev,
            [name]: value,
            niveauEtude: value === 'Étudiant' ? prev.niveauEtude : '', // Conserver niveauEtude si c'est Étudiant
            autreProfession: value === 'Autre' ? prev.autreProfession : '', // Conserver autreProfession si c'est Autre
        }));
    }
    else if (type === 'checkbox') {
        const checkboxValue = e.target.value;

        setEditFormData(prev => {
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
                    setShowAutreAntecedentInDialog(false);
                } else if (checkboxValue === 'Autre') {
                    setShowAutreAntecedentInDialog(checked);
                    if (!checked) updatedAutreAntecedent = '';
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
                    setShowAutreRoleFamilleInDialog(checked);
                    if (!checked) updatedAutreRole = '';
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
                    setShowAutreAllergieInDialog(false);
                } else if (checkboxValue === 'Autre') {
                    setShowAutreAllergieInDialog(checked);
                    if (!checked) updatedAutreAllergie = '';
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
          setEditFormData(prev => ({ ...prev, photoProfil: reader.result }));
        };
        reader.readAsDataURL(file);
      } else {
        setEditFormData(prev => ({ ...prev, photoProfil: '' }));
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
      if (showAutreAntecedentInDialog && editFormData.autreAntecedent.trim() !== '') {
          finalAntecedents = finalAntecedents.filter(a => a !== 'RAS');
          finalAntecedents.push(`Autre: ${editFormData.autreAntecedent.trim()}`);
      } else {
          finalAntecedents = finalAntecedents.filter(a => !a.startsWith('Autre: '));
      }
      if (finalAntecedents.length === 0 && editFormData.autreAntecedent.trim() === '' && !showAutreAntecedentInDialog) {
          finalAntecedents = ['RAS'];
      }


      let finalRoles = [...editFormData.roleFamille];
      if (showAutreRoleFamilleInDialog && editFormData.autreRoleFamille.trim() !== '') {
          finalRoles.push(`Autre: ${editFormData.autreRoleFamille.trim()}`);
      } else {
          finalRoles = finalRoles.filter(r => !r.startsWith('Autre: '));
      }

      let finalAllergies = [...editFormData.allergiesConnues];
      if (showAutreAllergieInDialog && editFormData.autreAllergie.trim() !== '') {
          finalAllergies = finalAllergies.filter(a => a !== 'RAS');
          finalAllergies.push(`Autre: ${editFormData.autreAllergie.trim()}`);
      } else {
          finalAllergies = finalAllergies.filter(a => !a.startsWith('Autre: '));
      }
      if (finalAllergies.length === 0 && editFormData.autreAllergie.trim() === '' && !showAutreAllergieInDialog) {
        finalAllergies = ['RAS'];
      }

      let finalProfession = editFormData.profession;
      if (editFormData.profession === 'Étudiant' && editFormData.niveauEtude.trim() !== '') {
          finalProfession = `Étudiant (Niveau: ${editFormData.niveauEtude.trim()})`;
      } else if (editFormData.profession === 'Autre' && editFormData.autreProfession.trim() !== '') {
          finalProfession = `Autre: ${editFormData.autreProfession.trim()}`;
      }

      const updatedData = {
        nomComplet: editFormData.nomComplet,
        age: parseInt(editFormData.age, 10),
        sexe: editFormData.sexe,
        antecedentsMedicaux: finalAntecedents,
        roleFamille: finalRoles,
        photoProfil: editFormData.photoProfil,
        platsPreferes: editFormData.platsPreferes,
        taille: editFormData.taille,
        poids: editFormData.poids,
        groupeSanguin: editFormData.groupeSanguin,
        telephone: editFormData.telephone,
        allergiesConnues: finalAllergies,
        profession: finalProfession,
        situationMatrimoniale: editFormData.situationMatrimoniale,
        dateNaissance: editFormData.dateNaissance,
        lieuNaissance: editFormData.lieuNaissance,
        languesParlees: editFormData.languesParlees,
        nationalite: editFormData.nationalite,
        nomCompletContactUrgence: editFormData.nomCompletContactUrgence,
        relationContactUrgence: editFormData.relationContactUrgence,
        telephoneContactUrgence: editFormData.telephoneContactUrgence,
        couleurPreferee: editFormData.couleurPreferee,
        filmSeriePrefere: editFormData.filmSeriePrefere,
        loisirsHobbies: editFormData.loisirsHobbies,
        animauxCompagnie: editFormData.animauxCompagnie,
      };

      await updateMembre(currentMembre.id, updatedData);
      setSuccess('Membre mis à jour avec succès !');
      handleCloseEditDialog();
      fetchMembres();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du membre :', err);
      setError('Erreur lors de la mise à jour : ' + err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Gérer les Membres de la Famille
      </Typography>

      <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => navigate('/famille-dashboard/add-membre')}
          sx={{ mb: 3 }}
      >
          Ajouter un Nouveau Membre
      </Button>

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
          Aucun membre de la famille enregistré pour l'instant. Utilisez le bouton "Ajouter un Nouveau Membre".
        </Typography>
      )}

      {!loading && membres.length > 0 && (
        <Grid container spacing={3}>
          {membres.map((membre) => (
            <Grid xs={12} sm={6} md={4} key={membre.id}>
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

                {/* NOUVEAUX CHAMPS AFFICHÉS */}
                {membre.dateNaissance && <Typography variant="body2" color="text.secondary">Date de Naissance: {membre.dateNaissance}</Typography>}
                {membre.lieuNaissance && <Typography variant="body2" color="text.secondary">Lieu de Naissance: {membre.lieuNaissance}</Typography>}
                {membre.languesParlees && <Typography variant="body2" color="text.secondary">Langues Parlées: {membre.languesParlees}</Typography>}
                {membre.nationalite && <Typography variant="body2" color="text.secondary">Nationalité: {membre.nationalite}</Typography>}
                {membre.taille && <Typography variant="body2" color="text.secondary">Taille: {membre.taille} cm</Typography>}
                {membre.poids && <Typography variant="body2" color="text.secondary">Poids: {membre.poids} kg</Typography>}
                {membre.groupeSanguin && <Typography variant="body2" color="text.secondary">Groupe Sanguin: {membre.groupeSanguin}</Typography>}
                {membre.telephone && <Typography variant="body2" color="text.secondary">Téléphone: {membre.telephone}</Typography>}
                {membre.profession && <Typography variant="body2" color="text.secondary">Profession: {membre.profession}</Typography>}
                {membre.situationMatrimoniale && <Typography variant="body2" color="text.secondary">Situation Matrimoniale: {membre.situationMatrimoniale}</Typography>}

                {/* Contact d'Urgence */}
                {(membre.nomCompletContactUrgence || membre.telephoneContactUrgence) && (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">Contact d'Urgence:</Typography>
                        {membre.nomCompletContactUrgence && <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>- Nom: {membre.nomCompletContactUrgence}</Typography>}
                        {membre.relationContactUrgence && <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>- Relation: {membre.relationContactUrgence}</Typography>}
                        {membre.telephoneContactUrgence && <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>- Tel: {membre.telephoneContactUrgence}</Typography>}
                    </Box>
                )}

                {membre.couleurPreferee && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Couleur Préférée: {membre.couleurPreferee}</Typography>}
                {membre.filmSeriePrefere && <Typography variant="body2" color="text.secondary">Film/Série Préféré: {membre.filmSeriePrefere}</Typography>}

                {/* Loisirs/Hobbies (affichage de liste) */}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loisirs / Hobbies:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {Array.isArray(membre.loisirsHobbies) && membre.loisirsHobbies.length > 0 ? (
                        membre.loisirsHobbies.map((loisir, i) => (
                            <Chip key={i} label={loisir} size="small" color="default" />
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">Aucun</Typography>
                    )}
                </Box>

                {membre.animauxCompagnie && <Typography variant="body2" color="text.secondary">Animaux de Compagnie: {membre.animauxCompagnie}</Typography>}
                {/* FIN NOUVEAUX CHAMPS AFFICHÉS */}

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

                {/* Affichage des Allergies Connues */}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Allergies:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {Array.isArray(membre.allergiesConnues) && membre.allergiesConnues.length > 0 ? (
                    membre.allergiesConnues.map((allergie, i) => (
                      <Chip key={i} label={allergie} size="small" color="error" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">RAS</Typography>
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

              {/* NOUVEAUX CHAMPS DU DIALOGUE */}
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Détails Personnels</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Date de Naissance"
                            type="date"
                            name="dateNaissance"
                            value={editFormData.dateNaissance}
                            onChange={handleEditFormChange}
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
                            value={editFormData.lieuNaissance}
                            onChange={handleEditFormChange}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Langues Parlées"
                            name="languesParlees"
                            value={editFormData.languesParlees}
                            onChange={handleEditFormChange}
                            margin="normal"
                            placeholder="Ex: Français, Anglais, Espagnol"
                            InputProps={{
                                inputProps: { list: 'languesSuggestions' },
                            }}
                        />
                        <datalist id="languesSuggestions">
                            {languesSuggestions.map((langue, index) => (
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
                            value={editFormData.nationalite}
                            onChange={handleEditFormChange}
                            margin="normal"
                        />
                    </Grid>
                </Grid>

                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Santé et Contact</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Taille (cm)"
                            type="number"
                            name="taille"
                            value={editFormData.taille}
                            onChange={handleEditFormChange}
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
                            value={editFormData.poids}
                            onChange={handleEditFormChange}
                            margin="normal"
                            inputProps={{ min: 0 }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Groupe Sanguin"
                            name="groupeSanguin"
                            value={editFormData.groupeSanguin}
                            onChange={handleEditFormChange}
                            margin="normal"
                            placeholder="Ex: A+, O-"
                            InputProps={{
                                inputProps: { list: 'groupeSanguinSuggestions' },
                            }}
                            size="small"
                        />
                        <datalist id="groupeSanguinSuggestions">
                            {groupeSanguinSuggestions.map((group, index) => (
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
                            value={editFormData.telephone}
                            onChange={handleEditFormChange}
                            margin="normal"
                            placeholder="Ex: +237 6XX XXX XXX"
                        />
                    </Grid>
                </Grid>

                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Contact d'Urgence</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Nom Complet du Contact d'Urgence"
                            type="text"
                            name="nomCompletContactUrgence"
                            value={editFormData.nomCompletContactUrgence}
                            onChange={handleEditFormChange}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Relation avec le Contact d'Urgence"
                            type="text"
                            name="relationContactUrgence"
                            value={editFormData.relationContactUrgence}
                            onChange={handleEditFormChange}
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
                            value={editFormData.telephoneContactUrgence}
                            onChange={handleEditFormChange}
                            margin="normal"
                            placeholder="Ex: +237 6XX XXX XXX"
                        />
                    </Grid>
                </Grid>
              {/* FIN NOUVEAUX CHAMPS DU DIALOGUE */}


              {/* Allergies Connues */}
              <FormControl component="fieldset" margin="normal" fullWidth>
                  <FormLabel component="legend">Allergies Connues</FormLabel>
                  <FormGroup row>
                      <FormControlLabel
                          control={
                              <Checkbox
                                  checked={editFormData.allergiesConnues.includes('RAS')}
                                  onChange={handleEditFormChange}
                                  value="RAS"
                                  name="allergieRAS"
                              />
                          }
                          label="RAS (Rien à Signaler)"
                      />
                      <FormControlLabel
                          control={
                              <Checkbox
                                  checked={editFormData.allergiesConnues.includes('Arachides')}
                                  onChange={handleEditFormChange}
                                  value="Arachides"
                                  name="allergieArachides"
                                  disabled={editFormData.allergiesConnues.includes('RAS')}
                              />
                          }
                          label="Arachides"
                      />
                      <FormControlLabel
                          control={
                              <Checkbox
                                  checked={editFormData.allergiesConnues.includes('Gluten')}
                                  onChange={handleEditFormChange}
                                  value="Gluten"
                                  name="allergieGluten"
                                  disabled={editFormData.allergiesConnues.includes('RAS')}
                              />
                          }
                          label="Gluten"
                      />
                      <FormControlLabel
                          control={
                              <Checkbox
                                  checked={editFormData.allergiesConnues.includes('Fruits de mer')}
                                  onChange={handleEditFormChange}
                                  value="Fruits de mer"
                                  name="allergieFruitsDeMer"
                                  disabled={editFormData.allergiesConnues.includes('RAS')}
                              />
                          }
                          label="Fruits de mer"
                      />
                      <FormControlLabel
                          control={
                              <Checkbox
                                  checked={showAutreAllergieInDialog}
                                  onChange={(e) => handleEditFormChange({ target: { name: 'allergieAutre', value: 'Autre', checked: e.target.checked, type: 'checkbox' } })}
                                  value="Autre"
                                  name="autreAllergieCheckbox"
                                  disabled={editFormData.allergiesConnues.includes('RAS')}
                              />
                          }
                          label="Autres :"
                      />
                      {showAutreAllergieInDialog && !editFormData.allergiesConnues.includes('RAS') && (
                          <TextField
                              size="small"
                              name="autreAllergie"
                              value={editFormData.autreAllergie}
                              onChange={handleEditFormChange}
                              placeholder="Spécifiez l'allergie"
                              sx={{ ml: 1 }}
                          />
                      )}
                  </FormGroup>
              </FormControl>

              {/* Profession */}
              <FormControl component="fieldset" margin="normal" fullWidth>
                <FormLabel component="legend">Profession</FormLabel>
                <RadioGroup
                  row
                  name="profession"
                  value={editFormData.profession}
                  onChange={handleEditFormChange}
                >
                  <FormControlLabel value="Salarié" control={<Radio />} label="Salarié" />
                  <FormControlLabel value="Entrepreneur" control={<Radio />} label="Entrepreneur" />
                  <FormControlLabel value="Étudiant" control={<Radio />} label="Étudiant" />
                  <FormControlLabel value="Retraité" control={<Radio />} label="Retraité" />
                  <FormControlLabel value="Sans emploi" control={<Radio />} label="Sans emploi" />
                  <FormControlLabel value="Autre" control={<Radio />} label="Autre" />
                </RadioGroup>
                {editFormData.profession === 'Étudiant' && (
                  <TextField
                    fullWidth
                    label="Niveau d'étude"
                    name="niveauEtude"
                    value={editFormData.niveauEtude}
                    onChange={handleEditFormChange}
                    margin="normal"
                    sx={{ mt: 1 }}
                  />
                )}
                {editFormData.profession === 'Autre' && (
                  <TextField
                    fullWidth
                    label="Spécifiez la profession"
                    name="autreProfession"
                    value={editFormData.autreProfession}
                    onChange={handleEditFormChange}
                    margin="normal"
                    sx={{ mt: 1 }}
                  />
                )}
              </FormControl>

              {/* Situation Matrimoniale */}
              <FormControl fullWidth margin="normal">
                  <InputLabel id="edit-situation-matrimoniale-label">Situation Matrimoniale</InputLabel>
                  <Select
                      labelId="edit-situation-matrimoniale-label"
                      id="edit-situation-matrimoniale-select"
                      value={editFormData.situationMatrimoniale}
                      label="Situation Matrimoniale"
                      onChange={handleEditFormChange}
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

              {/* Antécédents Médicaux */}
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
                            checked={showAutreAntecedentInDialog}
                            onChange={(e) => handleEditFormChange({ target: { name: 'antecedentAutre', value: 'Autre', checked: e.target.checked, type: 'checkbox' } })}
                            value="Autre"
                            name="autreAntecedentCheckbox"
                            disabled={editFormData.antecedentsMedicaux.includes('RAS')}
                        />
                    }
                    label="Autres :"
                  />
                  {showAutreAntecedentInDialog && !editFormData.antecedentsMedicaux.includes('RAS') && (
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

              {/* Rôle dans la Famille */}
              <FormControl component="fieldset" margin="normal" fullWidth>
                <FormLabel component="legend">Rôle dans la Famille</FormLabel>
                <FormGroup row>
                  <FormControlLabel
                    control={<Checkbox checked={editFormData.roleFamille.includes('Mère')} onChange={handleEditFormChange} value="Mère" name="roleMere" />}
                    label="Mère"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={editFormData.roleFamille.includes('Père')} onChange={handleEditFormChange} value="Père" name="rolePere" />}
                    label="Père"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={editFormData.roleFamille.includes('Enfant')} onChange={handleEditFormChange} value="Enfant" name="roleEnfant" />}
                    label="Enfant"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={editFormData.roleFamille.includes('Grand-parent')} onChange={handleEditFormChange} value="Grand-parent" name="roleGrandParent" />}
                    label="Grand-parent"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={showAutreRoleFamilleInDialog} onChange={(e) => handleEditFormChange({ target: { name: 'roleAutre', value: 'Autre', checked: e.target.checked, type: 'checkbox' } })} value="Autre" name="autreRoleFamilleCheckbox" />}
                    label="Autres :"
                  />
                  {showAutreRoleFamilleInDialog && (
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

              {/* Préférences et Loisirs - Dialogue */}
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Préférences et Loisirs</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Couleur Préférée"
                    name="couleurPreferee"
                    value={editFormData.couleurPreferee}
                    onChange={handleEditFormChange}
                    margin="normal"
                    placeholder="Ex: Bleu, Vert émeraude"
                    InputProps={{
                        inputProps: { list: 'couleursSuggestions' },
                    }}
                  />
                  <datalist id="couleursSuggestions">
                      {couleursSuggestions.map((couleur, index) => (
                          <option key={index} value={couleur} />
                      ))}
                  </datalist>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Film/Série Préféré(e)"
                    name="filmSeriePrefere"
                    value={editFormData.filmSeriePrefere}
                    onChange={handleEditFormChange}
                    margin="normal"
                    placeholder="Ex: Le Seigneur des Anneaux, Friends"
                    InputProps={{
                        inputProps: { list: 'filmsSuggestions' },
                    }}
                  />
                  <datalist id="filmsSuggestions">
                      {filmsSeriesSuggestions.map((genre, index) => (
                          <option key={index} value={genre} />
                      ))}
                  </datalist>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                      <InputLabel id="edit-loisirs-hobbies-label">Loisirs / Hobbies</InputLabel>
                      <Select
                          labelId="edit-loisirs-hobbies-label"
                          id="edit-loisirs-hobbies-multiple-chip"
                          multiple
                          value={editFormData.loisirsHobbies}
                          onChange={handleEditFormChange}
                          input={<OutlinedInput id="edit-select-multiple-loisirs" label="Loisirs / Hobbies" />}
                          renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => (
                                      <Chip key={value} label={value} />
                                  ))}
                              </Box>
                          )}
                          MenuProps={MenuProps}
                          name="loisirsHobbies"
                      >
                          {loisirsSuggestions.map((loisir) => (
                              <MenuItem key={loisir} value={loisir}>
                                  {loisir}
                              </MenuItem>
                          ))}
                      </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Animaux de Compagnie"
                    name="animauxCompagnie"
                    value={editFormData.animauxCompagnie}
                    onChange={handleEditFormChange}
                    margin="normal"
                    placeholder="Ex: Chien (Buddy), Chat (Miaou)"
                    InputProps={{
                        inputProps: { list: 'animauxSuggestions' },
                    }}
                  />
                  <datalist id="animauxSuggestions">
                      {animauxCompagnieSuggestions.map((animal, index) => (
                          <option key={index} value={animal} />
                      ))}
                  </datalist>
                </Grid>
              </Grid>


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
    </Box>
  );
}

export default MembresList;