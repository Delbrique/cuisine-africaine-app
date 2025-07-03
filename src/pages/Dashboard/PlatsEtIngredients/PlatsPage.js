// src/pages/Dashboard/PlatsEtIngredients/PlatsPage.js
import React, { useState, useEffect } from 'react';
import {
  createPlat,
  getPlats,
  updatePlat,
  deletePlat,
} from '../../../services/platService';
import { getIngredients } from '../../../services/ingredientService';

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
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  OutlinedInput,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';

function PlatsPage() {
  const theme = useTheme();
  const [plats, setPlats] = useState([]);
  const [ingredientsDisponibles, setIngredientsDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlatId, setCurrentPlatId] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    photoURL: '',
    tempsPreparation: '',
    tempsCuisson: '',
    difficulte: 'Facile',
    instructions: '',
    ingredientsNecessaires: [],
    categoriePlat: '',
    utilisation: '',
    richeEn: '',
  });

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedIngredientIds, setSelectedIngredientIds] = useState([]);

  const fixedCategories = [
    "Viande", "Poisson", "Volaille", "Végétarien", "Légumes", "Crudité",
    "Fruit", "Sauce", "Autre", "Petit-déjeuner"
  ];

  useEffect(() => {
    fetchPlats();
    fetchIngredientsDisponibles();
  }, []);

  const fetchPlats = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await getPlats();
      setPlats(data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des plats :', err);
      setError('Erreur lors du chargement des plats : ' + err.message);
      setLoading(false);
    }
  };

  const fetchIngredientsDisponibles = async () => {
    try {
      const data = await getIngredients();
      setIngredientsDisponibles(data);
    } catch (err) {
      console.error('Erreur lors du chargement des ingrédients disponibles :', err);
    }
  };

  const handleOpenAddDialog = () => {
    setIsEditing(false);
    setFormData({
      nom: '', description: '', photoURL: '', tempsPreparation: '', tempsCuisson: '',
      difficulte: 'Facile', instructions: '', ingredientsNecessaires: [],
      categoriePlat: '', utilisation: '', richeEn: '',
    });
    setSelectedIngredientIds([]);
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleOpenEditDialog = (plat) => {
    setIsEditing(true);
    setCurrentPlatId(plat.id);

    const hydratedIngredients = plat.ingredientsNecessaires ? plat.ingredientsNecessaires.map(ing => {
      const fullIngData = ingredientsDisponibles.find(i => i.id === ing.ingredientId);
      return {
        ingredientId: ing.ingredientId,
        nom: ing.nom || (fullIngData ? fullIngData.nom : 'Ingrédient Inconnu'),
        quantite: parseFloat(ing.quantite) || 0,
        uniteMesure: ing.uniteMesure || (fullIngData ? fullIngData.uniteMesure : 'N/A'),
      };
    }) : [];

    setFormData({
      nom: plat.nom, description: plat.description, photoURL: plat.photoURL,
      tempsPreparation: plat.tempsPreparation || '', tempsCuisson: plat.tempsCuisson || '',
      difficulte: plat.difficulte || 'Facile', instructions: plat.instructions || '',
      ingredientsNecessaires: hydratedIngredients,
      categoriePlat: plat.categoriePlat || '', utilisation: plat.utilisation || '', richeEn: plat.richeEn || '',
    });
    setSelectedIngredientIds(hydratedIngredients.map(ing => ing.ingredientId));
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setCurrentPlatId(null);
    setFormData({
      nom: '', description: '', photoURL: '', tempsPreparation: '', tempsCuisson: '',
      difficulte: 'Facile', instructions: '', ingredientsNecessaires: [],
      categoriePlat: '', utilisation: '', richeEn: '',
    });
    setSelectedIngredientIds([]);
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
      setFormData((prev) => ({ ...prev, photoURL: '' }));
    }
  };

  const handleMultipleIngredientsSelect = (event) => {
    const {
      target: { value },
    } = event;
    const newSelectedIds = typeof value === 'string' ? value.split(',') : value;
    setSelectedIngredientIds(newSelectedIds);

    const updatedIngredients = newSelectedIds.map(id => {
      const existing = formData.ingredientsNecessaires.find(ing => ing.ingredientId === id);
      if (existing) {
        return existing;
      } else {
        const fullIngData = ingredientsDisponibles.find(ing => ing.id === id);
        return {
          ingredientId: id,
          nom: fullIngData ? fullIngData.nom : 'Ingrédient inconnu',
          quantite: '',
          uniteMesure: fullIngData ? fullIngData.uniteMesure : '',
        };
      }
    });
    setFormData(prev => ({
      ...prev,
      ingredientsNecessaires: updatedIngredients,
    }));
  };

  const handleIngredientDetailsChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      ingredientsNecessaires: prev.ingredientsNecessaires.map(ing =>
        ing.ingredientId === id ? { ...ing, [field]: value } : ing
      ),
    }));
  };

  const handleRemoveSelectedIngredient = (idToRemove) => {
    setSelectedIngredientIds(prev => prev.filter(id => id !== idToRemove));
    setFormData(prev => ({
      ...prev,
      ingredientsNecessaires: prev.ingredientsNecessaires.filter(ing => ing.ingredientId !== idToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.categoriePlat !== 'Fruit') {
        const incompleteIngredients = formData.ingredientsNecessaires.filter(ing =>
            !ing.quantite || parseFloat(ing.quantite) <= 0 || !ing.uniteMesure
        );
        if (incompleteIngredients.length > 0) {
            setError('Veuillez spécifier une quantité positive et une unité de mesure pour tous les ingrédients sélectionnés.');
            setLoading(false);
            return;
        }
        
        const finalIngredientsNecessaires = formData.ingredientsNecessaires.map(ing => ({
            ...ing,
            quantite: parseFloat(ing.quantite) || 0,
        }));
        setFormData(prev => ({ ...prev, ingredientsNecessaires: finalIngredientsNecessaires }));
    }

    let platDataToSave = {
      nom: formData.nom,
      description: formData.description,
      photoURL: formData.photoURL,
      categoriePlat: formData.categoriePlat,
    };

    if (formData.categoriePlat === 'Fruit') {
      platDataToSave = {
        ...platDataToSave,
        utilisation: formData.utilisation,
        richeEn: formData.richeEn,
        ingredientsNecessaires: [],
      };
    } else {
      platDataToSave = {
        ...platDataToSave,
        tempsPreparation: parseInt(formData.tempsPreparation, 10) || 0,
        tempsCuisson: parseInt(formData.tempsCuisson, 10) || 0,
        difficulte: formData.difficulte,
        instructions: formData.instructions,
        ingredientsNecessaires: formData.ingredientsNecessaires.map(ing => ({
          ...ing,
          quantite: parseFloat(ing.quantite) || 0,
        })),
      };
    }

    try {
      if (isEditing) {
        await updatePlat(currentPlatId, platDataToSave);
        setSuccess('Plat mis à jour avec succès !');
      } else {
        await createPlat(platDataToSave);
        setSuccess('Plat ajouté avec succès !');
      }
      fetchPlats();
      handleCloseDialog();
    } catch (err) {
      console.error('Erreur lors de l\'opération sur le plat :', err);
      setError('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) {
      setError('');
      setSuccess('');
      try {
        await deletePlat(id);
        setSuccess('Plat supprimé avec succès !');
        fetchPlats();
      } catch (err) {
      console.error('Erreur lors de la suppression du plat :', err);
        setError('Erreur : ' + err.message);
      }
    }
  };

  const filteredPlats = selectedCategory
    ? plats.filter((plat) => plat.categoriePlat === selectedCategory)
    : plats;

  const displayedPlats = filteredPlats;

  const dynamicCategories = [...new Set(plats.map(p => p.categoriePlat).filter(Boolean))];
  const allFilterCategories = [...new Set([...fixedCategories, ...dynamicCategories])];


  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Gérer les Plats
      </Typography>

      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3,
      }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleOpenAddDialog}
        >
          Ajouter un Nouveau Plat
        </Button>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="filter-category-label">Filtrer par catégorie</InputLabel>
            <Select
              labelId="filter-category-label"
              id="filter-category-select"
              value={selectedCategory}
              label="Filtrer par catégorie"
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{
                borderRadius: '8px',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.dark',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'secondary.main',
                  borderWidth: '2px',
                },
              }}
            >
              <MenuItem value="">Toutes les catégories</MenuItem>
              {allFilterCategories.sort().map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedCategory !== '' && (
            <Button
              variant="text"
              color="secondary"
              onClick={() => { setSelectedCategory(''); }}
              sx={{
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                fontWeight: 'bold',
                textTransform: 'none',
              }}
            >
              Réinitialiser
            </Button>
          )}
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Chargement des plats...</Typography>
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

      {!loading && plats.length === 0 && (
        <Typography variant="body1" align="center" sx={{ mt: 4 }}>
          Aucun plat enregistré pour l'instant. Ajoutez-en un !
        </Typography>
      )}

      {!loading && filteredPlats.length === 0 && plats.length > 0 && selectedCategory !== '' && (
        <Typography variant="body1" align="center" sx={{ mt: 4 }}>
          Aucun plat trouvé pour la catégorie "{selectedCategory}".
        </Typography>
      )}

      {/* Rendu des plats filtrés (et alignement des cartes) */}
      {!loading && displayedPlats.length > 0 && (
        <Grid container spacing={3} alignItems="stretch">
          {displayedPlats.map((plat) => (
            <Grid item xs={12} sm={6} md={4} key={plat.id}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  borderRadius: '8px',
                  boxShadow: '0px 2px 10px rgba(0,0,0,0.08)',
                }}
              >
                {plat.photoURL ? (
                  <Avatar src={plat.photoURL} alt={plat.nom} sx={{ width: 100, height: 100, mb: 2, borderRadius: '8px', objectFit: 'cover' }} variant="square" />
                ) : (
                  <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.light', borderRadius: '8px' }} variant="square">
                    <Typography variant="h5" color="white">{plat.nom ? plat.nom.charAt(0).toUpperCase() : '?'}</Typography>
                  </Avatar>
                )}
                <Typography variant="h6" gutterBottom textAlign="center" sx={{ fontWeight: 'bold' }}>{plat.nom}</Typography>

                <Box sx={{
                  flexGrow: 1,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  minHeight: '280px',
                  pb: 2,
                }}>
                  {plat.categoriePlat === 'Fruit' ? (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" color="text.secondary">Utilisation: {plat.utilisation || 'N/A'}</Typography>
                      <Typography variant="body2" color="text.secondary">Riche en: {plat.richeEn || 'N/A'}</Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          flexGrow: 1,
                          mt: 1,
                          maxHeight: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 5,
                          WebkitBoxOrient: 'vertical',
                          whiteSpace: 'normal',
                        }}
                      >
                        Description: {plat.description || 'N/A'}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" color="text.secondary">Préparation: {plat.tempsPreparation} min</Typography>
                      <Typography variant="body2" color="text.secondary">Cuisson: {plat.tempsCuisson} min</Typography>
                      <Typography variant="body2" color="text.secondary">Difficulté: {plat.difficulte}</Typography>
                      <Box sx={{ flexGrow: 1, mt: 1 }} />
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: plat.categoriePlat !== 'Fruit' ? 0.5 : 0 }}>Catégorie: {plat.categoriePlat || 'N/A'}</Typography>

                  {plat.categoriePlat !== 'Fruit' && (
                    <Box sx={{
                      mt: 2,
                      width: '100%',
                      flexShrink: 0,
                      height: '120px',
                      overflowY: 'auto',
                    }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Ingrédients:</Typography>
                      <List dense sx={{ height: 'calc(100% - 24px)', overflowY: 'auto', bgcolor: 'background.paper', border: '1px solid #eee', borderRadius: 1 }}>
                        {formData.ingredientsNecessaires.length === 0 ? (
                          <ListItem><ListItemText primary="Aucun ingrédient spécifié" sx={{ fontStyle: 'italic' }} /></ListItem>
                        ) : (
                          formData.ingredientsNecessaires.map((ing, i) => (
                            <ListItem key={ing.ingredientId || i} disablePadding>
                              <ListItemText primary={`${ing.quantite} ${ing.uniteMesure} de ${ing.nom}`} sx={{ pl: 1 }} />
                            </ListItem>
                          ))
                        )}
                      </List>
                    </Box>
                  )}
                  {plat.categoriePlat === 'Fruit' && (
                     <Box sx={{
                        mt: 2,
                        width: '100%',
                        flexShrink: 0,
                        height: '120px',
                     }}>
                     </Box>
                  )}
                </Box>

                <Box sx={{
                  mt: 'auto',
                  display: 'flex',
                  gap: 1,
                  pt: 2,
                  width: '100%',
                  justifyContent: 'center',
                }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEditDialog(plat)}
                    sx={{ flexGrow: 1 }}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(plat.id)}
                    sx={{ flexGrow: 1 }}
                  >
                    Supprimer
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog d'ajout/édition de plat */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>{isEditing ? 'Modifier un Plat' : 'Ajouter un Nouveau Plat'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nom du Plat"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Catégorie du Plat</InputLabel>
              <Select
                name="categoriePlat"
                value={formData.categoriePlat}
                label="Catégorie du Plat"
                onChange={handleChange}
              >
                <MenuItem value=""><em>Sélectionner une catégorie</em></MenuItem>
                <MenuItem value="Petit-déjeuner">Petit-déjeuner</MenuItem>
                <MenuItem value="Viande">Viande</MenuItem>
                <MenuItem value="Poisson">Poisson</MenuItem>
                <MenuItem value="Volaille">Volaille</MenuItem>
                <MenuItem value="Végétarien">Végétarien</MenuItem>
                <MenuItem value="Légumes">Légumes</MenuItem>
                <MenuItem value="Crudité">Crudité</MenuItem>
                <MenuItem value="Fruit">Fruit</MenuItem>
                <MenuItem value="Sauce">Sauce</MenuItem>
                <MenuItem value="Autre">Autre</MenuItem>
              </Select>
            </FormControl>

            {/* CHAMPS SPÉCIFIQUES À LA CATÉGORIE */}
            {formData.categoriePlat === 'Fruit' ? (
              <React.Fragment>
                <TextField
                  fullWidth
                  label="Description du Fruit"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={3}
                />
                <TextField
                  fullWidth
                  label="Utilisation"
                  name="utilisation"
                  value={formData.utilisation}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={2}
                />
                <TextField
                  fullWidth
                  label="Riche en"
                  name="richeEn"
                  value={formData.richeEn}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <TextField
                  fullWidth
                  label="Description (Recette complète)"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={4}
                  required
                />
                <TextField
                  fullWidth
                  label="Temps de Préparation (minutes)"
                  name="tempsPreparation"
                  type="number"
                  value={formData.tempsPreparation}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Temps de Cuisson (minutes)"
                  name="tempsCuisson"
                  type="number"
                  value={formData.tempsCuisson}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Difficulté</InputLabel>
                  <Select
                    name="difficulte"
                    value={formData.difficulte}
                    label="Difficulté"
                    onChange={handleChange}
                  >
                    <MenuItem value="Facile">Facile</MenuItem>
                    <MenuItem value="Moyenne">Moyenne</MenuItem>
                    <MenuItem value="Difficile">Difficile</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Instructions de Préparation"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={4}
                  required
                />

                {/* NOUVELLE SECTION POUR LA SÉLECTION MULTIPLE ET LA SAISIE DES DÉTAILS */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Sélectionner les Ingrédients</Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="ingredients-multiple-label">Ingrédients Nécessaires</InputLabel>
                  <Select
                    labelId="ingredients-multiple-label"
                    id="ingredients-multiple-chip"
                    multiple
                    name="selectedIngredientIds"
                    value={selectedIngredientIds}
                    onChange={handleMultipleIngredientsSelect}
                    input={<OutlinedInput id="select-multiple-chip-input" label="Ingrédients Nécessaires" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => {
                          const ingredient = ingredientsDisponibles.find(ing => ing.id === id);
                          return (
                            <Chip
                              key={id}
                              label={ingredient ? ingredient.nom : 'Inconnu'}
                              onDelete={() => handleRemoveSelectedIngredient(id)}
                              deleteIcon={<CloseIcon />}
                            />
                          );
                        })}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 224,
                          width: 250,
                        },
                      },
                    }}
                  >
                    {ingredientsDisponibles.map((ingredient) => (
                      <MenuItem key={ingredient.id} value={ingredient.id}>
                        {ingredient.nom} ({ingredient.uniteMesure})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* SECTION POUR LA SAISIE DES QUANTITÉS ET UNITÉS POUR CHAQUE INGRÉDIENT SÉLECTIONNÉ */}
                {formData.ingredientsNecessaires.length > 0 && (
                  <Box sx={{ mt: 3, border: '1px solid #eee', borderRadius: 1, p: 2, bgcolor: theme.palette.grey[100] }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Détails des Ingrédients Sélectionnés</Typography>
                    {error && (error.includes('quantité positive') || error.includes('unité de mesure')) && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                      </Alert>
                    )}
                    <Grid container spacing={2}>
                      {formData.ingredientsNecessaires.map((ing) => (
                        <Grid item xs={12} sm={6} key={ing.ingredientId}>
                          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: theme => theme.palette.grey[100] }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{ing.nom}</Typography>
                            <TextField
                              label="Quantité"
                              type="number"
                              value={ing.quantite}
                              onChange={(e) => handleIngredientDetailsChange(ing.ingredientId, 'quantite', e.target.value)}
                              fullWidth
                              size="small"
                              inputProps={{ min: "0.01", step: "0.01" }}
                              required
                            />
                            <TextField
                              label="Unité de Mesure"
                              value={ing.uniteMesure}
                              onChange={(e) => handleIngredientDetailsChange(ing.ingredientId, 'uniteMesure', e.target.value)}
                              fullWidth
                              size="small"
                              required
                            />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </React.Fragment>
            )}

            <Box sx={{ my: 2 }}>
                <InputLabel htmlFor="plat-photo-upload-dialog">Photo du Plat (facultatif)</InputLabel>
                <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="plat-photo-upload-dialog"
                    type="file"
                    name="photoURL"
                    onChange={handlePhotoChange}
                />
                <label htmlFor="plat-photo-upload-dialog">
                    <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />} sx={{ mt: 1 }}>
                        Choisir une photo
                    </Button>
                </label>
                {formData.photoURL && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                        <Avatar src={formData.photoURL} alt="Photo du Plat" sx={{ width: 150, height: 150, borderRadius: '8px', objectFit: 'cover' }} variant="square" />
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

export default PlatsPage;