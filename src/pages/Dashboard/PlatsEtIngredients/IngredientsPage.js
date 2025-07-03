// src/pages/Dashboard/PlatsEtIngredients/IngredientsPage.js
import React, { useState, useEffect } from 'react';
import {
  createIngredient,
  getIngredients,
  updateIngredient,
  deleteIngredient,
  INGREDIENT_STATUS // Import INGREDIENT_STATUS
} from '../../../services/ingredientService';

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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIngredientId, setCurrentIngredientId] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    uniteMesure: '',
    categorie: '',
    photoURL: '',
    prix: '', 
  });

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await getIngredients();
      setIngredients(data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des ingrédients :', err);
      setError('Erreur lors du chargement des ingrédients : ' + err.message);
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setIsEditing(false);
    setFormData({ nom: '', uniteMesure: '', categorie: '', photoURL: '', prix: '' }); // Initialiser prix
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (ingredient) => {
    setIsEditing(true);
    setCurrentIngredientId(ingredient.id);
    setFormData({
      nom: ingredient.nom,
      uniteMesure: ingredient.uniteMesure,
      categorie: ingredient.categorie,
      photoURL: ingredient.photoURL,
      prix: ingredient.prix ? ingredient.prix.toString() : '', // Charger le prix, le convertir en string
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setCurrentIngredientId(null);
    setFormData({ nom: '', uniteMesure: '', categorie: '', photoURL: '', prix: '' }); // Réinitialiser prix
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photoURL: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
        setFormData((prev) => ({ ...prev, photoURL: '' })); // Vider si pas de fichier
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        prix: parseFloat(formData.prix), // Convertir le prix en nombre avant de sauvegarder
      };

      if (isEditing) {
        await updateIngredient(currentIngredientId, dataToSave);
        setSuccess('Ingrédient mis à jour avec succès !');
      } else {
        // When creating a new ingredient, initialize its stock properties with default values
        await createIngredient({
          ...dataToSave,
          stockQuantity: 0, // Default to 0 for new ingredients
          datePeremption: null,
          seuilMinimum: 0,
          status: INGREDIENT_STATUS.NOT_USED, // Default status for newly added ingredient
          totalConsumedQuantity: 0,
        });
        setSuccess('Ingrédient ajouté avec succès !');
      }
      fetchIngredients();
      handleCloseDialog();
    } catch (err) {
      console.error('Erreur lors de l\'opération sur l\'ingrédient :', err);
      setError('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet ingrédient ? Cela le supprimera aussi de votre stock.')) {
      setError('');
      setSuccess('');
      try {
        await deleteIngredient(id);
        setSuccess('Ingrédient supprimé avec succès !');
        fetchIngredients();
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'ingrédient :', err);
        setError('Erreur : ' + err.message);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Gérer les Ingrédients
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddCircleOutlineIcon />}
        onClick={handleOpenAddDialog}
        sx={{ mb: 3 }}
      >
        Ajouter un Nouvel Ingrédient
      </Button>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Chargement des ingrédients...</Typography>
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

      {!loading && ingredients.length === 0 && (
        <Typography variant="body1" align="center" sx={{ mt: 4 }}>
          Aucun ingrédient enregistré pour l'instant. Ajoutez-en un !
        </Typography>
      )}

      {!loading && ingredients.length > 0 && (
        <Grid container spacing={3}>
          {ingredients.map((ingredient) => (
            <Grid item xs={12} sm={6} md={4} key={ingredient.id}> {/* Utilisation de item xs={...} pour Grid */}
              <Paper elevation={2} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                {ingredient.photoURL ? (
                  <Avatar src={ingredient.photoURL} alt={ingredient.nom} sx={{ width: 80, height: 80, mb: 2 }} />
                ) : (
                  <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: 'secondary.main' }}>
                    <Typography variant="h5">{ingredient.nom ? ingredient.nom.charAt(0).toUpperCase() : '?'}</Typography>
                  </Avatar>
                )}
                <Typography variant="h6" gutterBottom>{ingredient.nom}</Typography>
                <Typography variant="body2" color="text.secondary">Unité: {ingredient.uniteMesure}</Typography>
                <Typography variant="body2" color="text.secondary">Catégorie: {ingredient.categorie}</Typography>
                <Typography variant="body2" color="text.secondary">Prix: {ingredient.prix !== undefined ? `${ingredient.prix.toFixed(2)} FCFA` : 'N/A'}</Typography>
                <Box sx={{ mt: 'auto', display: 'flex', gap: 1, pt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEditDialog(ingredient)}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(ingredient.id)}
                  >
                    Supprimer
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Modifier un Ingrédient' : 'Ajouter un Nouvel Ingrégient'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nom de l'ingrédient"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Unité de Mesure (ex: g, ml, pièce, cuillère)"
              name="uniteMesure"
              value={formData.uniteMesure}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
                fullWidth
                label="Prix par unité"
                name="prix"
                value={formData.prix}
                onChange={handleChange}
                margin="normal"
                type="number"
                inputProps={{ step: "0.01" }}
                required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Catégorie</InputLabel>
              <Select
                name="categorie"
                value={formData.categorie}
                label="Catégorie"
                onChange={handleChange}
                required
              >
                <MenuItem value="Légumes">Légumes</MenuItem>
                <MenuItem value="Viandes">Viandes</MenuItem>
                <MenuItem value="Poissons">Poissons</MenuItem>
                <MenuItem value="Crustacés">Crustacés</MenuItem>
                <MenuItem value="Épices">Épices</MenuItem>
                <MenuItem value="Produits laitiers">Produits laitiers</MenuItem>
                <MenuItem value="Céréales">Céréales</MenuItem>
                <MenuItem value="Assaisonnement">Assaisonnement</MenuItem>
                <MenuItem value="Fruits">Fruits</MenuItem>
                <MenuItem value="Condiment">Condiment</MenuItem>
                <MenuItem value="Autres">Autres</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ my: 2 }}>
              <InputLabel htmlFor="ingredient-photo-upload">Photo de l'ingrédient (facultatif)</InputLabel>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="ingredient-photo-upload"
                type="file"
                name="photoURL"
                onChange={handlePhotoChange}
              />
              <label htmlFor="ingredient-photo-upload">
                <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />} sx={{ mt: 1 }}>
                  Choisir une photo
                </Button>
              </label>
              {formData.photoURL && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Avatar src={formData.photoURL} alt="Photo de l'ingrédient" sx={{ width: 100, height: 100 }} />
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>Annuler</Button>
          <Button onClick={handleSubmit} startIcon={<SaveIcon />} variant="contained" color="primary" disabled={loading}>
            {isEditing ? 'Sauvegarder' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default IngredientsPage;