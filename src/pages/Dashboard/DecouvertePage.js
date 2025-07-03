import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import KitchenIcon from '@mui/icons-material/Kitchen';
import PublicIcon from '@mui/icons-material/Public';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createPlat } from '../../services/platService';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const PEXELS_API_KEY = process.env.REACT_APP_PEXELS_API_KEY;

const fetchPexelsImage = async (dishName) => {
  if (!PEXELS_API_KEY) {
    console.error('Clé API Pexels manquante.');
    return 'https://via.placeholder.com/300x220?text=Image+Indisponible';
  }
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(dishName + ' food')}&per_page=1`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );
    const data = await response.json();
    return data.photos[0]?.src.medium || 'https://via.placeholder.com/300x220?text=Image+Indisponible';
  } catch (error) {
    console.error('Erreur Pexels:', error);
    return 'https://via.placeholder.com/300x220?text=Image+Indisponible';
  }
};

const fetchNewDishesWithGemini = async (existingDishNames = [], batchSize = 12) => {
  if (!GEMINI_API_KEY) {
    console.error('Clé API Gemini manquante.');
    return [];
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const categories = ['Petit-déjeuner', 'Dîner', 'Repas du soir', 'Dessert', 'Apéritif', 'Boisson'];
  const dishes = [];

  try {
    const prompt = `
      Recherche et génère une liste de ${batchSize} plats culinaires uniques, incluant des plats africains et internationaux, pour des catégories variées parmi : ${categories.join(', ')}. Les plats doivent être différents des suivants : ${existingDishNames.join(', ') || 'aucun'}. Fournis les informations suivantes pour chaque plat en français dans un format JSON structuré entouré de \`\`\`json\n...\n\`\`\` :
      [
        {
          "nom": "Nom unique du plat",
          "description": "Description courte et attrayante (50-100 mots)",
          "tempsPreparation": "Temps de préparation en minutes (nombre)",
          "tempsCuisson": "Temps de cuisson en minutes (nombre, 0 si non applicable)",
          "difficulte": "Facile, Moyenne ou Difficile",
          "instructions": "Étapes détaillées de la recette (100-200 mots)",
          "ingredientsNecessaires": [
            {"nom": "Nom de l'ingrédient", "quantite": "Quantité", "uniteMesure": "Unité"}
          ],
          "categoriePlat": "Une des catégories : ${categories.join(', ')}",
          "origine": "Pays ou région d'origine (ex. Cameroun, Japon, Italie)",
          "utilisation": "Comment le plat est consommé (ex. Frais, en boisson, plat principal)",
          "richeEn": "Nutriments principaux (ex. Vitamine C, Protéines)"
        }
      ]
      Assure-toi que chaque plat est unique, varié, et n'a pas été généré précédemment. Pour les boissons et apéritifs, adapte les champs (ex. tempsCuisson peut être 0). Retourne uniquement le JSON entouré de \`\`\`json.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Extraire le JSON
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsedDishes = JSON.parse(jsonMatch[1]);
      for (const [index, dish] of parsedDishes.entries()) {
        dish.id = `generated-${Date.now()}-${index}`;
        dish.photoURL = await fetchPexelsImage(dish.nom);
        dish.description = dish.description || 'Plat traditionnel.';
        dish.tempsPreparation = dish.tempsPreparation || 0;
        dish.tempsCuisson = dish.tempsCuisson || 0;
        dish.difficulte = dish.difficulte || 'Facile';
        dish.instructions = dish.instructions || 'Suivez les étapes traditionnelles.';
        dish.ingredientsNecessaires = dish.ingredientsNecessaires || [];
        dish.origine = dish.origine || 'Origine inconnue';
        dish.utilisation = dish.utilisation || 'À consommer selon la tradition.';
        dish.richeEn = dish.richeEn || 'Nutriments variés';
        dishes.push(dish);
      }
    } else {
      console.warn('Réponse JSON invalide:', text);
    }
  } catch (error) {
    console.error('Erreur lors de la génération des plats avec Gemini:', error);
  }
  return dishes;
};

function DecouvertePage() {
  const [plats, setPlats] = useState([]);
  const [filteredPlats, setFilteredPlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [ratings, setRatings] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [generatedDishNames, setGeneratedDishNames] = useState([]);

  const loadNewDishes = async () => {
    setLoading(true);
    try {
      const newDishes = await fetchNewDishesWithGemini(generatedDishNames);
      if (newDishes.length > 0) {
        setPlats(newDishes);
        setFilteredPlats(newDishes);
        setGeneratedDishNames((prev) => [
          ...prev,
          ...newDishes.map((dish) => dish.nom),
        ]);
      } else {
        setSnackbar({
          open: true,
          message: 'Erreur lors de la génération des nouveaux plats.',
          severity: 'error',
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement des plats:', err);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des plats.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNewDishes();
  }, []);

  const handleFilterChange = (e) => {
    const meal = e.target.value;
    setSelectedMeal(meal);
    if (meal) {
      setFilteredPlats(plats.filter((plat) => plat.categoriePlat === meal));
    } else {
      setFilteredPlats(plats);
    }
  };

  const handleAddToDatabase = async (plat) => {
    try {
      await createPlat(plat);
      setSnackbar({
        open: true,
        message: `${plat.nom} ajouté à la base de données avec succès !`,
        severity: 'success',
      });
    } catch (err) {
      console.error('Erreur lors de l’ajout du plat :', err);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l’ajout du plat.',
        severity: 'error',
      });
    }
  };

  const toggleFavorite = (platId) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(platId)) newFavorites.delete(platId);
      else newFavorites.add(platId);
      return newFavorites;
    });
  };

  const setRating = (platId, rating) => {
    setRatings((prev) => ({ ...prev, [platId]: rating }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/300x220?text=Image+Indisponible';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2, color: '#555' }}>Chargement des plats...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fafafa', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        component="h2"
        gutterBottom
        sx={{
          mb: 5,
          fontWeight: 700,
          color: '#1a237e',
          textAlign: { xs: 'center', md: 'left' },
          fontFamily: '"Roboto", sans-serif',
        }}
      >
        Découverte Culinaire
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 5,
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={loadNewDishes}
          sx={{
            borderRadius: 20,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            backgroundColor: '#4caf50',
            '&:hover': { backgroundColor: '#388e3c' },
          }}
        >
          Découvrir de Nouveaux Plats
        </Button>
        <FormControl sx={{ minWidth: { xs: '100%', sm: 220 }, bgcolor: '#fff', borderRadius: 2 }}>
          <InputLabel id="meal-filter-label" sx={{ color: '#555' }}>Filtrer par repas</InputLabel>
          <Select
            labelId="meal-filter-label"
            value={selectedMeal}
            label="Filtrer par repas"
            onChange={handleFilterChange}
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' },
            }}
          >
            <MenuItem value="">Tous les repas</MenuItem>
            {['Petit-déjeuner', 'Dîner', 'Repas du soir', 'Dessert', 'Apéritif', 'Boisson'].map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {filteredPlats.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" sx={{ fontFamily: '"Roboto", sans-serif' }}>
            Aucun plat trouvé pour cette catégorie.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredPlats.map((plat) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={plat.id}>
              <Card
                sx={{
                  minHeight: '420px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 3,
                  bgcolor: '#fff',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.03)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="220"
                  image={plat.photoURL}
                  alt={plat.nom}
                  onError={handleImageError}
                  sx={{
                    objectFit: 'cover',
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                  }}
                />
                <CardContent sx={{ flex: 1, p: 2, pb: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      color: '#1a237e',
                      fontSize: '1.1rem',
                      fontFamily: '"Roboto", sans-serif',
                      lineHeight: 1.4,
                    }}
                  >
                    {plat.nom}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip
                      label={plat.categoriePlat}
                      size="small"
                      variant="outlined"
                      sx={{
                        mr: 1,
                        borderColor: '#3f51b5',
                        color: '#3f51b5',
                        fontWeight: 500,
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: '"Roboto", sans-serif' }}
                    >
                      {plat.origine}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 1.5,
                      fontFamily: '"Roboto", sans-serif',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {plat.description}
                  </Typography>
                  {(plat.categoriePlat !== 'Boisson' && plat.categoriePlat !== 'Apéritif') ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: '#757575' }} />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontFamily: '"Roboto", sans-serif', fontSize: '0.8rem' }}
                        >
                          {plat.tempsPreparation} min | {plat.tempsCuisson} min
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <KitchenIcon fontSize="small" sx={{ mr: 1, color: '#757575' }} />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontFamily: '"Roboto", sans-serif', fontSize: '0.8rem' }}
                        >
                          {plat.difficulte}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <KitchenIcon fontSize="small" sx={{ mr: 1, color: '#757575' }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: '"Roboto", sans-serif', fontSize: '0.8rem' }}
                      >
                        {plat.utilisation}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <PublicIcon fontSize="small" sx={{ mr: 1, color: '#757575' }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: '"Roboto", sans-serif', fontSize: '0.8rem' }}
                    >
                      {plat.richeEn}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <IconButton
                        key={star}
                        onClick={() => setRating(plat.id, star)}
                        size="small"
                        sx={{ p: 0.5 }}
                      >
                        {ratings[plat.id] >= star ? (
                          <StarIcon fontSize="small" sx={{ color: '#4caf50' }} />
                        ) : (
                          <StarBorderIcon fontSize="small" sx={{ color: '#bdbdbd' }} />
                        )}
                      </IconButton>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title={favorites.has(plat.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
                      <IconButton
                        onClick={() => toggleFavorite(plat.id)}
                        size="small"
                        sx={{
                          color: favorites.has(plat.id) ? '#d32f2f' : '#757575',
                          '&:hover': { color: '#b71c1c' },
                        }}
                      >
                        {favorites.has(plat.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Ajouter à ma liste">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => handleAddToDatabase(plat)}
                        sx={{
                          ml: 1,
                          borderRadius: 20,
                          px: 2,
                          py: 0.5,
                          textTransform: 'none',
                          fontWeight: 500,
                          backgroundColor: '#3f51b5',
                          '&:hover': { backgroundColor: '#303f9f' },
                        }}
                      >
                        Ajouter
                      </Button>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%', fontFamily: '"Roboto", sans-serif' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DecouvertePage;



//code fonctionnel mais generant des images aleatoires a revoir

// import React, { useState, useEffect } from 'react';
// import {
//   Typography,
//   Box,
//   Grid,
//   Button,
//   CircularProgress,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Card,
//   CardContent,
//   CardMedia,
//   CardActions,
//   IconButton,
//   Chip,
//   Tooltip,
//   Snackbar,
//   Alert,
// } from '@mui/material';
// import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
// import StarIcon from '@mui/icons-material/Star';
// import StarBorderIcon from '@mui/icons-material/StarBorder';
// import FavoriteIcon from '@mui/icons-material/Favorite';
// import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
// import AccessTimeIcon from '@mui/icons-material/AccessTime';
// import KitchenIcon from '@mui/icons-material/Kitchen';
// import PublicIcon from '@mui/icons-material/Public';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { createPlat } from '../../services/platService';

// const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// const fetchNewDishesWithGemini = async (existingDishNames = [], batchSize = 12) => {
//   if (!GEMINI_API_KEY) {
//     console.error('Clé API Gemini manquante.');
//     return [];
//   }

//   const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
//   const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
//   const categories = ['Petit-déjeuner', 'Dîner', 'Repas du soir', 'Dessert', 'Apéritif', 'Boisson'];
//   const dishes = [];

//   try {
//     const prompt = `
//       Recherche et génère une liste de ${batchSize} plats culinaires uniques, incluant des plats africains et internationaux, pour des catégories variées parmi : ${categories.join(', ')}. Les plats doivent être différents des suivants : ${existingDishNames.join(', ') || 'aucun'}. Fournis les informations suivantes pour chaque plat en français dans un format JSON structuré entouré de \`\`\`json\n...\n\`\`\` :
//       [
//         {
//           "nom": "Nom unique du plat",
//           "description": "Description courte et attrayante (50-100 mots)",
//           "tempsPreparation": "Temps de préparation en minutes (nombre)",
//           "tempsCuisson": "Temps de cuisson en minutes (nombre, 0 si non applicable)",
//           "difficulte": "Facile, Moyenne ou Difficile",
//           "instructions": "Étapes détaillées de la recette (100-200 mots)",
//           "ingredientsNecessaires": [
//             {"nom": "Nom de l'ingrédient", "quantite": "Quantité", "uniteMesure": "Unité"}
//           ],
//           "categoriePlat": "Une des catégories : ${categories.join(', ')}",
//           "origine": "Pays ou région d'origine (ex. Cameroun, Japon, Italie)",
//           "utilisation": "Comment le plat est consommé (ex. Frais, en boisson, plat principal)",
//           "richeEn": "Nutriments principaux (ex. Vitamine C, Protéines)"
//         }
//       ]
//       Assure-toi que chaque plat est unique, varié, et n'a pas été généré précédemment. Pour les boissons et apéritifs, adapte les champs (ex. tempsCuisson peut être 0). Retourne uniquement le JSON entouré de \`\`\`json.
//     `;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = await response.text();

//     // Extraire le JSON
//     const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
//     if (jsonMatch && jsonMatch[1]) {
//       const parsedDishes = JSON.parse(jsonMatch[1]);
//       parsedDishes.forEach((dish, index) => {
//         dish.id = `generated-${Date.now()}-${index}`;
//         // Utiliser Lorem Picsum pour les images
//         dish.photoURL = `https://picsum.photos/seed/${encodeURIComponent(dish.nom)}/300/180`;
//         // Ajouter des valeurs par défaut
//         dish.description = dish.description || 'Plat traditionnel.';
//         dish.tempsPreparation = dish.tempsPreparation || 0;
//         dish.tempsCuisson = dish.tempsCuisson || 0;
//         dish.difficulte = dish.difficulte || 'Facile';
//         dish.instructions = dish.instructions || 'Suivez les étapes traditionnelles.';
//         dish.ingredientsNecessaires = dish.ingredientsNecessaires || [];
//         dish.origine = dish.origine || 'Origine inconnue';
//         dish.utilisation = dish.utilisation || 'À consommer selon la tradition.';
//         dish.richeEn = dish.richeEn || 'Nutriments variés';
//         dishes.push(dish);
//       });
//     } else {
//       console.warn('Réponse JSON invalide:', text);
//     }
//   } catch (error) {
//     console.error('Erreur lors de la génération des plats avec Gemini:', error);
//   }
//   return dishes;
// };

// function DecouvertePage() {
//   const [plats, setPlats] = useState([]);
//   const [filteredPlats, setFilteredPlats] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedMeal, setSelectedMeal] = useState('');
//   const [favorites, setFavorites] = useState(new Set());
//   const [ratings, setRatings] = useState({});
//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
//   const [generatedDishNames, setGeneratedDishNames] = useState([]);

//   const loadNewDishes = async () => {
//     setLoading(true);
//     try {
//       const newDishes = await fetchNewDishesWithGemini(generatedDishNames);
//       if (newDishes.length > 0) {
//         setPlats(newDishes);
//         setFilteredPlats(newDishes);
//         setGeneratedDishNames((prev) => [
//           ...prev,
//           ...newDishes.map((dish) => dish.nom),
//         ]);
//       } else {
//         setSnackbar({
//           open: true,
//           message: 'Erreur lors de la génération des nouveaux plats.',
//           severity: 'error',
//         });
//       }
//     } catch (err) {
//       console.error('Erreur lors du chargement des plats:', err);
//       setSnackbar({
//         open: true,
//         message: 'Erreur lors du chargement des plats.',
//         severity: 'error',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadNewDishes();
//   }, []);

//   const handleFilterChange = (e) => {
//     const meal = e.target.value;
//     setSelectedMeal(meal);
//     if (meal) {
//       setFilteredPlats(plats.filter((plat) => plat.categoriePlat === meal));
//     } else {
//       setFilteredPlats(plats);
//     }
//   };

//   const handleAddToDatabase = async (plat) => {
//     try {
//       await createPlat(plat);
//       setSnackbar({
//         open: true,
//         message: `${plat.nom} ajouté à la base de données avec succès !`,
//         severity: 'success',
//       });
//     } catch (err) {
//       console.error('Erreur lors de l’ajout du plat :', err);
//       setSnackbar({
//         open: true,
//         message: 'Erreur lors de l’ajout du plat.',
//         severity: 'error',
//       });
//     }
//   };

//   const toggleFavorite = (platId) => {
//     setFavorites((prev) => {
//       const newFavorites = new Set(prev);
//       if (newFavorites.has(platId)) newFavorites.delete(platId);
//       else newFavorites.add(platId);
//       return newFavorites;
//     });
//   };

//   const setRating = (platId, rating) => {
//     setRatings((prev) => ({ ...prev, [platId]: rating }));
//   };

//   const handleCloseSnackbar = () => {
//     setSnackbar((prev) => ({ ...prev, open: false }));
//   };

//   const handleImageError = (e) => {
//     e.target.src = 'https://via.placeholder.com/300x180?text=Image+Indisponible';
//   };

//   if (loading) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
//         <CircularProgress />
//         <Typography sx={{ ml: 2, color: '#555' }}>Chargement des plats...</Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fafafa', minHeight: '100vh' }}>
//       <Typography
//         variant="h4"
//         component="h2"
//         gutterBottom
//         sx={{
//           mb: 5,
//           fontWeight: 700,
//           color: '#1a237e',
//           textAlign: { xs: 'center', md: 'left' },
//           fontFamily: '"Roboto", sans-serif',
//         }}
//       >
//         Découverte Culinaire
//       </Typography>

//       <Box
//         sx={{
//           display: 'flex',
//           flexDirection: { xs: 'column', sm: 'row' },
//           justifyContent: 'space-between',
//           alignItems: { xs: 'stretch', sm: 'center' },
//           mb: 5,
//           gap: 2,
//         }}
//       >
//         <Button
//           variant="contained"
//           color="primary"
//           startIcon={<AddCircleOutlineIcon />}
//           onClick={loadNewDishes}
//           sx={{
//             borderRadius: 20,
//             px: 4,
//             py: 1.5,
//             fontWeight: 600,
//             textTransform: 'none',
//             backgroundColor: '#4caf50',
//             '&:hover': { backgroundColor: '#388e3c' },
//           }}
//         >
//           Découvrir de Nouveaux Plats
//         </Button>
//         <FormControl sx={{ minWidth: { xs: '100%', sm: 220 }, bgcolor: '#fff', borderRadius: 2 }}>
//           <InputLabel id="meal-filter-label" sx={{ color: '#555' }}>Filtrer par repas</InputLabel>
//           <Select
//             labelId="meal-filter-label"
//             value={selectedMeal}
//             label="Filtrer par repas"
//             onChange={handleFilterChange}
//             sx={{
//               borderRadius: 2,
//               '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' },
//             }}
//           >
//             <MenuItem value="">Tous les repas</MenuItem>
//             {['Petit-déjeuner', 'Dîner', 'Repas du soir', 'Dessert', 'Apéritif', 'Boisson'].map((cat) => (
//               <MenuItem key={cat} value={cat}>
//                 {cat}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//       </Box>

//       {filteredPlats.length === 0 ? (
//         <Box sx={{ textAlign: 'center', py: 6 }}>
//           <Typography variant="h6" color="text.secondary" sx={{ fontFamily: '"Roboto", sans-serif' }}>
//             Aucun plat trouvé pour cette catégorie.
//           </Typography>
//         </Box>
//       ) : (
//         <Grid container spacing={3}>
//           {filteredPlats.map((plat) => (
//             <Grid item xs={12} sm={6} md={4} lg={3} key={plat.id}>
//               <Card
//                 sx={{
//                   minHeight: '460px',
//                   display: 'flex',
//                   flexDirection: 'column',
//                   justifyContent: 'space-between',
//                   borderRadius: 3,
//                   bgcolor: '#fff',
//                   boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
//                   overflow: 'hidden',
//                   transition: 'transform 0.3s ease, box-shadow 0.3s ease',
//                   '&:hover': {
//                     transform: 'scale(1.03)',
//                     boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
//                   },
//                 }}
//               >
//                 <CardMedia
//                   component="img"
//                   height="180"
//                   image={plat.photoURL}
//                   alt={plat.nom}
//                   onError={handleImageError}
//                   sx={{
//                     objectFit: 'cover',
//                     borderTopLeftRadius: 12,
//                     borderTopRightRadius: 12,
//                   }}
//                 />
//                 <CardContent sx={{ flex: 1, p: 2.5, pb: 1 }}>
//                   <Typography
//                     variant="h6"
//                     sx={{
//                       fontWeight: 600,
//                       mb: 1.5,
//                       color: '#1a237e',
//                       fontSize: '1.1rem',
//                       fontFamily: '"Roboto", sans-serif',
//                       lineHeight: 1.4,
//                     }}
//                   >
//                     {plat.nom}
//                   </Typography>
//                   <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
//                     <Chip
//                       label={plat.categoriePlat}
//                       size="small"
//                       sx={{
//                         mr: 1,
//                         bgcolor: '#4caf50',
//                         color: '#fff',
//                         fontWeight: 500,
//                         '&:hover': { bgcolor: '#388e3c' },
//                       }}
//                     />
//                     <Typography
//                       variant="caption"
//                       color="text.secondary"
//                       sx={{ fontFamily: '"Roboto", sans-serif' }}
//                     >
//                       {plat.origine}
//                     </Typography>
//                   </Box>
//                   <Typography
//                     variant="body2"
//                     color="text.secondary"
//                     sx={{
//                       mb: 2,
//                       fontFamily: '"Roboto", sans-serif',
//                       fontSize: '0.9rem',
//                       lineHeight: 1.6,
//                       overflow: 'hidden',
//                       textOverflow: 'ellipsis',
//                       display: '-webkit-box',
//                       WebkitLineClamp: 2,
//                       WebkitBoxOrient: 'vertical',
//                     }}
//                   >
//                     {plat.description}
//                   </Typography>
//                   {(plat.categoriePlat !== 'Boisson' && plat.categoriePlat !== 'Apéritif') ? (
//                     <>
//                       <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                         <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: '#757575' }} />
//                         <Typography
//                           variant="body2"
//                           color="text.secondary"
//                           sx={{ fontFamily: '"Roboto", sans-serif', fontSize: '0.85rem' }}
//                         >
//                           {plat.tempsPreparation} min | {plat.tempsCuisson} min
//                         </Typography>
//                       </Box>
//                       <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                         <KitchenIcon fontSize="small" sx={{ mr: 1, color: '#757575' }} />
//                         <Typography
//                           variant="body2"
//                           color="text.secondary"
//                           sx={{ fontFamily: '"Roboto", sans-serif', fontSize: '0.85rem' }}
//                         >
//                           {plat.difficulte}
//                         </Typography>
//                       </Box>
//                     </>
//                   ) : (
//                     <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                       <KitchenIcon fontSize="small" sx={{ mr: 1, color: '#757575' }} />
//                       <Typography
//                         variant="body2"
//                         color="text.secondary"
//                         sx={{ fontFamily: '"Roboto", sans-serif', fontSize: '0.85rem' }}
//                       >
//                         {plat.utilisation}
//                       </Typography>
//                     </Box>
//                   )}
//                   <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                     <PublicIcon fontSize="small" sx={{ mr: 1, color: '#757575' }} />
//                     <Typography
//                       variant="body2"
//                       color="text.secondary"
//                       sx={{ fontFamily: '"Roboto", sans-serif', fontSize: '0.85rem' }}
//                     >
//                       {plat.richeEn}
//                     </Typography>
//                   </Box>
//                 </CardContent>
//                 <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between', alignItems: 'center' }}>
//                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                     {[1, 2, 3, 4, 5].map((star) => (
//                       <IconButton
//                         key={star}
//                         onClick={() => setRating(plat.id, star)}
//                         size="small"
//                         sx={{ p: 0.5 }}
//                       >
//                         {ratings[plat.id] >= star ? (
//                           <StarIcon fontSize="small" sx={{ color: '#4caf50' }} />
//                         ) : (
//                           <StarBorderIcon fontSize="small" sx={{ color: '#bdbdbd' }} />
//                         )}
//                       </IconButton>
//                     ))}
//                   </Box>
//                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                     <Tooltip title={favorites.has(plat.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
//                       <IconButton
//                         onClick={() => toggleFavorite(plat.id)}
//                         size="small"
//                         sx={{
//                           color: favorites.has(plat.id) ? '#d32f2f' : '#757575',
//                           '&:hover': { color: '#b71c1c' },
//                         }}
//                       >
//                         {favorites.has(plat.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
//                       </IconButton>
//                     </Tooltip>
//                     <Tooltip title="Ajouter à ma liste">
//                       <Button
//                         variant="contained"
//                         size="small"
//                         startIcon={<AddCircleOutlineIcon />}
//                         onClick={() => handleAddToDatabase(plat)}
//                         sx={{
//                           ml: 1,
//                           borderRadius: 20,
//                           px: 2.5,
//                           py: 0.5,
//                           textTransform: 'none',
//                           fontWeight: 500,
//                           backgroundColor: '#4caf50',
//                           '&:hover': { backgroundColor: '#388e3c' },
//                         }}
//                       >
//                         Ajouter
//                       </Button>
//                     </Tooltip>
//                   </Box>
//                 </CardActions>
//               </Card>
//             </Grid>
//           ))}
//         </Grid>
//       )}

//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={6000}
//         onClose={handleCloseSnackbar}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//       >
//         <Alert
//           onClose={handleCloseSnackbar}
//           severity={snackbar.severity}
//           sx={{ width: '100%', fontFamily: '"Roboto", sans-serif' }}
//         >
//           {snackbar.message}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// }

// export default DecouvertePage;