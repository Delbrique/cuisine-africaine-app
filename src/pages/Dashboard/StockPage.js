// src/pages/Dashboard/StockPage.js
import React, { useState, useEffect } from 'react';
import {
  getIngredients,
  updateIngredient,
  deleteIngredient,
  updateIngredientStock,
  INGREDIENT_STATUS
} from '../../services/ingredientService';

import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
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
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SearchIcon from '@mui/icons-material/Search';
import SwapVertIcon from '@mui/icons-material/SwapVert'; // Pour le tri
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore'; // Pour l'achat
import { createIngredient } from '../../services/ingredientService'; // Import createIngredient

function StockPage() {
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
    alias: '',
    stockQuantity: '',
    datePeremption: '',
    seuilMinimum: '',
    status: '',
    totalConsumedQuantity: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nom'); // Critère de tri par défaut
  const [sortDirection, setSortDirection] = useState('asc'); // Direction de tri par défaut

  const EXPIRATION_WARNING_DAYS = 7; // Jours avant péremption pour afficher un avertissement

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await getIngredients();
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparaison précise

      const processedData = data.map(ing => {
        const expirationDate = ing.datePeremption && ing.datePeremption.seconds ? new Date(ing.datePeremption.seconds * 1000) : null;
        let currentStatus = ing.status;

        // Ensure stockQuantity is a number for consistent comparisons
        const stockQuantityNum = parseFloat(ing.stockQuantity);
        const seuilMinimumNum = parseFloat(ing.seuilMinimum || 0);

        if (expirationDate && expirationDate < now) {
          currentStatus = INGREDIENT_STATUS.EXPIRED;
        } else if (stockQuantityNum <= 0) {
          currentStatus = INGREDIENT_STATUS.EXHAUSTED;
        } else if (stockQuantityNum < seuilMinimumNum && stockQuantityNum > 0) {
          currentStatus = INGREDIENT_STATUS.LOW_STOCK;
        } else if (stockQuantityNum > 0 && currentStatus === INGREDIENT_STATUS.NOT_USED) {
            currentStatus = INGREDIENT_STATUS.IN_USE;
        } else if (stockQuantityNum > 0 && currentStatus === INGREDIENT_STATUS.EXHAUSTED) {
            currentStatus = INGREDIENT_STATUS.IN_USE;
        }
        
        if (ing.status !== currentStatus && ing.id) {
          updateIngredient(ing.id, { status: currentStatus })
            .then(() => console.log(`Statut de ${ing.nom} mis à jour dans Firestore: ${ing.status} -> ${currentStatus}`))
            .catch(e => console.error(`Erreur mise à jour statut Firebase pour ${ing.nom}:`, e));
        }

        return { ...ing, status: currentStatus, stockQuantity: stockQuantityNum }; // Ensure stockQuantity is number for rendering
      });

      setIngredients(processedData);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des ingrédients :', err);
      setError('Erreur lors du chargement des ingrédients : ' + err.message);
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setIsEditing(false);
    setFormData({
      nom: '', uniteMesure: '', categorie: '', photoURL: '', prix: '', alias: '',
      stockQuantity: 0, datePeremption: '', seuilMinimum: 0, status: INGREDIENT_STATUS.NOT_USED, totalConsumedQuantity: 0
    });
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleOpenEditDialog = (ingredient) => {
    setIsEditing(true);
    setCurrentIngredientId(ingredient.id);
    const formattedDate = ingredient.datePeremption && ingredient.datePeremption.seconds
      ? new Date(ingredient.datePeremption.seconds * 1000).toISOString().split('T')[0]
      : '';
    setFormData({
      nom: ingredient.nom,
      uniteMesure: ingredient.uniteMesure,
      categorie: ingredient.categorie,
      photoURL: ingredient.photoURL,
      prix: ingredient.prix !== undefined ? ingredient.prix.toString() : '',
      alias: ingredient.alias || '',
      stockQuantity: ingredient.stockQuantity !== undefined ? ingredient.stockQuantity.toString() : '',
      datePeremption: formattedDate,
      seuilMinimum: ingredient.seuilMinimum !== undefined ? ingredient.seuilMinimum.toString() : '',
      status: ingredient.status || INGREDIENT_STATUS.NOT_USED,
      totalConsumedQuantity: ingredient.totalConsumedQuantity || 0,
    });
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setCurrentIngredientId(null);
    setFormData({
      nom: '', uniteMesure: '', categorie: '', photoURL: '', prix: '', alias: '',
      stockQuantity: 0, datePeremption: '', seuilMinimum: 0, status: INGREDIENT_STATUS.NOT_USED, totalConsumedQuantity: 0
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        // Ensure numeric fields are parsed as numbers before saving
        prix: parseFloat(formData.prix),
        stockQuantity: parseFloat(formData.stockQuantity),
        datePeremption: formData.datePeremption ? new Date(formData.datePeremption) : null,
        seuilMinimum: parseFloat(formData.seuilMinimum),
        totalConsumedQuantity: parseFloat(formData.totalConsumedQuantity), // Ensure this is also parsed
      };

      if (isEditing) {
        await updateIngredient(currentIngredientId, dataToSave);
        setSuccess('Ingrédient mis à jour avec succès !');
      } else {
        await createIngredient(dataToSave);
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet ingrédient du stock ?')) {
      setError('');
      setSuccess('');
      try {
        await deleteIngredient(id);
        setSuccess('Ingrédient supprimé du stock avec succès !');
        fetchIngredients();
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'ingrédient :', err);
        setError('Erreur : ' + err.message);
      }
    }
  };

  const handleManualStockUpdate = async (ingredientId, quantityChange, currentStatus) => {
    if (isNaN(quantityChange) || quantityChange === 0) {
        setError('Veuillez entrer une quantité valide pour la mise à jour du stock.');
        return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
        await updateIngredientStock(ingredientId, quantityChange, currentStatus);
        setSuccess('Stock mis à jour avec succès !');
        fetchIngredients(); // Recharger pour voir les changements
    } catch (err) {
        console.error('Erreur lors de la mise à jour manuelle du stock :', err);
        setError('Erreur lors de la mise à jour du stock : ' + err.message);
    } finally {
        setLoading(false);
    }
  };


  // Helper pour formater la date de péremption pour l'affichage
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR');
  };

  // Helper pour obtenir la couleur et l'icône du statut
  const getStatusChipProps = (status) => {
    switch (status) {
      case INGREDIENT_STATUS.EXPIRED:
        return { label: 'Expiré', color: 'error', icon: <CancelRoundedIcon /> };
      case INGREDIENT_STATUS.EXHAUSTED:
        return { label: 'Épuisé', color: 'error', icon: <CancelRoundedIcon /> };
      case INGREDIENT_STATUS.LOW_STOCK:
        return { label: 'Faible Stock', color: 'warning', icon: <WarningIcon /> };
      case INGREDIENT_STATUS.IN_USE:
        return { label: 'En Cours d\'Utilisation', color: 'success', icon: <CheckCircleIcon /> };
      case INGREDIENT_STATUS.NOT_USED:
        return { label: 'Non Utilisé', color: 'info', icon: null };
      default:
        return { label: status, color: 'default', icon: null };
    }
  };

  // Logique pour le tri et le filtrage des ingrédients
  const sortedAndFilteredIngredients = [...ingredients]
    .filter(ingredient => {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      return (
        ingredient.nom.toLowerCase().includes(lowercasedSearchTerm) ||
        (ingredient.alias && ingredient.alias.toLowerCase().includes(lowercasedSearchTerm))
      );
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      // Gérer les dates de péremption pour le tri
      if (sortBy === 'datePeremption') {
        valA = a.datePeremption && a.datePeremption.seconds ? a.datePeremption.seconds : Infinity; // Mettre les nulls à la fin
        valB = b.datePeremption && b.datePeremption.seconds ? b.datePeremption.seconds : Infinity;
      }
      // Gérer les nombres
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      // Gérer les chaînes
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement des données de stock...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
        Gestion du Stock des Ingrédients
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleOpenAddDialog}
        >
          Ajouter un Ingrédient au Stock
        </Button>
        <TextField
          label="Rechercher un ingrédient"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
            variant="outlined"
            color="info"
            startIcon={<RefreshIcon />}
            onClick={fetchIngredients}
        >
            Rafraîchir le Stock
        </Button>
      </Box>

      {!loading && sortedAndFilteredIngredients.length === 0 && searchTerm === '' && (
        <Typography variant="body1" align="center" sx={{ mt: 4 }}>
          Aucun ingrédient dans le stock pour l'instant. Ajoutez-en un !
        </Typography>
      )}

      {!loading && sortedAndFilteredIngredients.length === 0 && searchTerm !== '' && (
        <Typography variant="body1" align="center" sx={{ mt: 4 }}>
          Aucun ingrédient trouvé pour "{searchTerm}".
        </Typography>
      )}

      {!loading && sortedAndFilteredIngredients.length > 0 && (
        <TableContainer component={Paper} elevation={3}>
          <Table sx={{ minWidth: 700 }} aria-label="stock ingredients table">
            <TableHead>
              <TableRow>
                <TableCell>Photo</TableCell>
                <TableCell>
                    <TableSortButton column="nom" sortBy={sortBy} sortDirection={sortDirection} onClick={handleSort}>Nom</TableSortButton>
                </TableCell>
                <TableCell>Catégorie</TableCell>
                <TableCell>
                    <TableSortButton column="stockQuantity" sortBy={sortBy} sortDirection={sortDirection} onClick={handleSort}>Quantité</TableSortButton>
                </TableCell>
                <TableCell>Unité</TableCell>
                <TableCell>
                    <TableSortButton column="prix" sortBy={sortBy} sortDirection={sortDirection} onClick={handleSort}>Prix</TableSortButton>
                </TableCell>
                <TableCell>
                    <TableSortButton column="seuilMinimum" sortBy={sortBy} sortDirection={sortDirection} onClick={handleSort}>Seuil Min</TableSortButton>
                </TableCell>
                <TableCell>
                    <TableSortButton column="datePeremption" sortBy={sortBy} sortDirection={sortDirection} onClick={handleSort}>Péremption</TableSortButton>
                </TableCell>
                <TableCell>
                    <TableSortButton column="status" sortBy={sortBy} sortDirection={sortDirection} onClick={handleSort}>Statut</TableSortButton>
                </TableCell>
                <TableCell>
                    <TableSortButton column="totalConsumedQuantity" sortBy={sortBy} sortDirection={sortDirection} onClick={handleSort}>Consommé</TableSortButton>
                </TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAndFilteredIngredients.map((ingredient) => {
                const chipProps = getStatusChipProps(ingredient.status);
                const expirationDate = ingredient.datePeremption && ingredient.datePeremption.seconds ? new Date(ingredient.datePeremption.seconds * 1000) : null;
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                const isExpiringSoon = expirationDate &&
                                       expirationDate.getTime() - now.getTime() < EXPIRATION_WARNING_DAYS * 24 * 60 * 60 * 1000 &&
                                       expirationDate >= now;
                const isLowStock = parseFloat(ingredient.stockQuantity) < (parseFloat(ingredient.seuilMinimum) || 0) && parseFloat(ingredient.stockQuantity) > 0;
                const isExhausted = parseFloat(ingredient.stockQuantity) <= 0;

                return (
                  <TableRow key={ingredient.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      {ingredient.photoURL ? (
                        <Avatar src={ingredient.photoURL} alt={ingredient.nom} sx={{ width: 40, height: 40 }} variant="square" />
                      ) : (
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light' }} variant="square">
                          {ingredient.nom ? ingredient.nom.charAt(0).toUpperCase() : '?'}
                        </Avatar>
                      )}
                    </TableCell>
                    <TableCell>{ingredient.nom} {ingredient.alias && `(${ingredient.alias})`}</TableCell>
                    <TableCell>{ingredient.categorie}</TableCell>
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {/* Assurez-vous que stockQuantity est un nombre avant d'appeler toFixed() */}
                            {typeof ingredient.stockQuantity === 'number' ? `${ingredient.stockQuantity.toFixed(2)}` : 'N/A'}
                            {isLowStock && !isExhausted && <Tooltip title="Faible stock"><WarningIcon color="warning" sx={{ ml: 0.5 }} /></Tooltip>}
                            {isExhausted && <Tooltip title="Épuisé"><CancelRoundedIcon color="error" sx={{ ml: 0.5 }} /></Tooltip>}
                        </Box>
                    </TableCell>
                    <TableCell>{ingredient.uniteMesure}</TableCell>
                    <TableCell>{ingredient.prix !== undefined ? `${parseFloat(ingredient.prix).toFixed(2)} FCFA` : 'N/A'}</TableCell>
                    <TableCell>{ingredient.seuilMinimum !== undefined ? `${parseFloat(ingredient.seuilMinimum).toFixed(2)}` : '0.00'}</TableCell>
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {formatDate(ingredient.datePeremption)}
                            {isExpiringSoon && <Tooltip title={`Expire bientôt (${EXPIRATION_WARNING_DAYS} jours)`}><WarningIcon color="error" sx={{ ml: 0.5 }} /></Tooltip>}
                            {ingredient.status === INGREDIENT_STATUS.EXPIRED && <Tooltip title="Expiré"><CancelRoundedIcon color="error" sx={{ ml: 0.5 }} /></Tooltip>}
                        </Box>
                    </TableCell>
                    <TableCell>
                        <Chip
                            label={chipProps.label}
                            color={chipProps.color}
                            icon={chipProps.icon}
                            size="small"
                        />
                    </TableCell>
                    <TableCell>{typeof ingredient.totalConsumedQuantity === 'number' ? `${ingredient.totalConsumedQuantity.toFixed(2)}` : 'N/A'}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Modifier">
                            <IconButton color="primary" onClick={() => handleOpenEditDialog(ingredient)}>
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer du stock">
                            <IconButton color="error" onClick={() => handleDelete(ingredient.id)}>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                        {/* Champ pour la mise à jour manuelle du stock */}
                        <TextField
                            type="number"
                            size="small"
                            placeholder="+/- Quantité"
                            sx={{ width: 100 }}
                            inputProps={{ step: "0.01" }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    handleManualStockUpdate(ingredient.id, parseFloat(event.target.value), ingredient.status);
                                    event.target.value = ''; // Réinitialiser le champ
                                }
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={(event) => {
                                                const inputElement = event.currentTarget.parentNode.querySelector('input');
                                                if (inputElement) {
                                                    handleManualStockUpdate(ingredient.id, parseFloat(inputElement.value), ingredient.status);
                                                    inputElement.value = '';
                                                }
                                            }}
                                            aria-label="update stock"
                                        >
                                            <LocalGroceryStoreIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog pour ajouter/modifier un ingrédient au stock (même que IngredientsPage mais avec tous les champs) */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Modifier un Ingrédient du Stock' : 'Ajouter un Nouvel Ingrédient au Stock'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField fullWidth label="Nom de l'ingrédient" name="nom" value={formData.nom} onChange={handleChange} margin="normal" required />
            <TextField fullWidth label="Alias (noms alternatifs)" name="alias" value={formData.alias} onChange={handleChange} margin="normal" multiline rows={2} />
            <TextField fullWidth label="Prix par unité" name="prix" value={formData.prix} onChange={handleChange} margin="normal" type="number" inputProps={{ step: "0.01" }} required />
            <TextField fullWidth label="Quantité en stock" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} margin="normal" type="number" inputProps={{ step: "0.01" }} required />
            <TextField fullWidth label="Seuil Minimum de Stock" name="seuilMinimum" value={formData.seuilMinimum} onChange={handleChange} margin="normal" type="number" inputProps={{ step: "0.01" }} helperText="Quantité minimale à maintenir" />
            <TextField fullWidth label="Date de Péremption" name="datePeremption" type="date" value={formData.datePeremption} onChange={handleChange} margin="normal" InputLabelProps={{ shrink: true }} />
            <FormControl fullWidth margin="normal">
              <InputLabel>Catégorie</InputLabel>
              <Select name="categorie" value={formData.categorie} label="Catégorie" onChange={handleChange} required>
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
              <InputLabel htmlFor="ingredient-photo-upload-dialog">Photo de l'ingrédient (facultatif)</InputLabel>
              <input accept="image/*" style={{ display: 'none' }} id="ingredient-photo-upload-dialog" type="file" name="photoURL" onChange={handlePhotoChange} />
              <label htmlFor="ingredient-photo-upload-dialog">
                <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />} sx={{ mt: 1 }}>Choisir une photo</Button>
              </label>
              {formData.photoURL && (<Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}><Avatar src={formData.photoURL} alt="Photo de l'ingrédient" sx={{ width: 100, height: 100 }} /></Box>)}
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

// Composant pour le bouton de tri de la table
function TableSortButton({ column, sortBy, sortDirection, onClick, children }) {
    return (
        <Button onClick={() => onClick(column)} sx={{ textTransform: 'none', fontWeight: 'bold' }}>
            {children}
            {sortBy === column && (
                sortDirection === 'asc' ? <SwapVertIcon fontSize="small" sx={{ ml: 0.5 }} /> : <SwapVertIcon fontSize="small" sx={{ transform: 'rotate(180deg)', ml: 0.5 }} />
            )}
        </Button>
    );
}

export default StockPage;