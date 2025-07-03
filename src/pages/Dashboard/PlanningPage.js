// src/pages/Dashboard/PlanningPage.js
import React, { useState, useEffect } from 'react';
import { getPlats } from '../../services/platService';
import { createPlanning, getMostRecentPlanning, updatePlanning } from '../../services/planningService';
import { updateIngredientStock, getIngredientById, INGREDIENT_STATUS } from '../../services/ingredientService'; // Import necessary functions and constants
import { auth } from '../../firebase/firebase';
import html2pdf from 'html2pdf.js';

import {
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  Avatar, // Importez Avatar pour afficher les photos
} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

function PlanningPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allPlats, setAllPlats] = useState([]);
  const [currentPlanning, setCurrentPlanning] = useState(null);

  const joursSemaine = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const typesRepas = ['petitDejeuner', 'dejeuner', 'diner'];

  const initialPlanningState = joursSemaine.reduce((acc, day) => {
    acc[day] = {
      petitDejeuner: { platId: '', nomPlat: '', photoURL: '' }, // Ajoutez photoURL
      dejeuner: { platId: '', nomPlat: '', photoURL: '' },      // Ajoutez photoURL
      diner: { platId: '', nomPlat: '', photoURL: '' },          // Ajoutez photoURL
    };
    return acc;
  }, {});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const platsData = await getPlats();
      setAllPlats(platsData);

      const recentPlanning = await getMostRecentPlanning();
      if (recentPlanning && recentPlanning.planning) {
        Object.keys(recentPlanning.planning).forEach(day => {
          typesRepas.forEach(mealType => {
            const platInPlanning = recentPlanning.planning[day][mealType];
            if (platInPlanning && platInPlanning.platId) {
              const fullPlat = platsData.find(p => p.id === platInPlanning.platId);
              if (fullPlat) {
                platInPlanning.nomPlat = fullPlat.nom;
                platInPlanning.photoURL = fullPlat.photoURL || ''; // Mettre à jour photoURL
              } else {
                // Si le plat n'est plus trouvé, réinitialiser ou marquer comme inconnu
                platInPlanning.nomPlat = 'Plat inconnu';
                platInPlanning.photoURL = '';
                platInPlanning.platId = ''; // Optionnel: vider l'ID si le plat n'existe plus
              }
            } else {
                recentPlanning.planning[day][mealType] = { platId: '', nomPlat: '', photoURL: '' }; // Assurez-vous d'initialiser
            }
          });
        });
        // S'assurer que tous les jours/repas sont initialisés même s'ils n'étaient pas dans le planning récent
        joursSemaine.forEach(day => {
            typesRepas.forEach(mealType => {
                if (!recentPlanning.planning[day][mealType]) {
                    recentPlanning.planning[day][mealType] = { platId: '', nomPlat: '', photoURL: '' };
                }
            });
        });

        setCurrentPlanning(recentPlanning);
      } else {
        setCurrentPlanning({
          id: null,
          semaineDebut: getMondayOfWeek(new Date()).toISOString().split('T')[0],
          semaineFin: getSundayOfWeek(new Date()).toISOString().split('T')[0],
          planning: initialPlanningState,
          creePar: auth.currentUser ? auth.currentUser.uid : 'anonymous',
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données :', err);
      setError('Erreur lors du chargement des plats ou du planning : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMondayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getSundayOfWeek = (date) => {
    const d = new Date(getMondayOfWeek(date));
    return new Date(d.setDate(d.getDate() + 6));
  };

  const getPlatsUsedInCurrentWeek = (excludeDay = null, excludeMealType = null) => {
    const usedPlatIds = new Set();
    if (currentPlanning && currentPlanning.planning) {
      joursSemaine.forEach(day => {
        typesRepas.forEach(mealType => {
          if (!(day === excludeDay && mealType === excludeMealType)) {
            const plat = currentPlanning.planning[day][mealType];
            if (plat && plat.platId) {
              usedPlatIds.add(plat.platId);
            }
          }
        });
      });
    }
    return Array.from(usedPlatIds);
  };

  const handlePlatSelectionChange = (day, mealType, platId) => {
    setError('');

    const selectedPlat = allPlats.find(p => p.id === platId);

    if (!platId) {
      setCurrentPlanning((prev) => ({
        ...prev,
        planning: {
          ...prev.planning,
          [day]: {
            ...prev.planning[day],
            [mealType]: { platId: '', nomPlat: '', photoURL: '' }, // Réinitialisez photoURL
          },
        },
      }));
      return;
    }

    const platsUsed = getPlatsUsedInCurrentWeek(day, mealType);
    if (platsUsed.includes(platId)) {
      const selectedPlatName = selectedPlat?.nom;
      setError(`"${selectedPlatName}" est déjà utilisé un autre jour cette semaine. Veuillez choisir un autre plat.`);
      return;
    }

    setCurrentPlanning((prev) => ({
      ...prev,
      planning: {
        ...prev.planning,
        [day]: {
          ...prev.planning[day],
          [mealType]: {
            platId: platId,
            nomPlat: selectedPlat ? selectedPlat.nom : '',
            photoURL: selectedPlat ? selectedPlat.photoURL || '' : '', // Mettre à jour photoURL ici
          },
        },
      },
    }));
  };

  const generateRandomPlanning = () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const newPlanningContent = joursSemaine.reduce((acc, day) => {
      acc[day] = {
        petitDejeuner: { platId: '', nomPlat: '', photoURL: '' },
        dejeuner: { platId: '', nomPlat: '', photoURL: '' },
        diner: { platId: '', nomPlat: '', photoURL: '' }
      };
      return acc;
    }, {});

    const categoryDistribution = {
        lundi: {
            petitDejeuner: ['Petit-déjeuner', 'Fruit'],
            dejeuner: ['Viande', 'Légumes'],
            diner: ['Poisson', 'Crudité']
        },
        mardi: {
            petitDejeuner: ['Petit-déjeuner', 'Fruit'],
            dejeuner: ['Volaille', 'Légumes'],
            diner: ['Végétarien', 'Fruit']
        },
        mercredi: {
            petitDejeuner: ['Petit-déjeuner', 'Fruit'],
            dejeuner: ['Poisson', 'Crudité'],
            diner: ['Viande', 'Légumes']
        },
        jeudi: {
            petitDejeuner: ['Petit-déjeuner', 'Fruit'],
            dejeuner: ['Végétarien', 'Légumes'],
            diner: ['Volaille', 'Fruit']
        },
        vendredi: {
            petitDejeuner: ['Petit-déjeuner', 'Fruit'],
            dejeuner: ['Viande', 'Crudité'],
            diner: ['Poisson', 'Légumes']
        },
        samedi: {
            petitDejeuner: ['Petit-déjeuner', 'Fruit'],
            dejeuner: ['Végétarien', 'Fruit'],
            diner: ['Viande', 'Volaille', 'Légumes', 'Crudité']
        },
        dimanche: {
            petitDejeuner: ['Petit-déjeuner', 'Fruit'],
            dejeuner: ['Poisson', 'Volaille', 'Légumes', 'Crudité'],
            diner: ['Végétarien', 'Viande', 'Fruit']
        }
    };

    const platsCategorized = {
        'Viande': allPlats.filter(p => p.categoriePlat === 'Viande'),
        'Poisson': allPlats.filter(p => p.categoriePlat === 'Poisson'),
        'Volaille': allPlats.filter(p => p.categoriePlat === 'Volaille'),
        'Végétarien': allPlats.filter(p => p.categoriePlat === 'Végétarien'),
        'Légumes': allPlats.filter(p => p.categoriePlat === 'Légumes'),
        'Crudité': allPlats.filter(p => p.categoriePlat === 'Crudité'),
        'Fruit': allPlats.filter(p => p.categoriePlat === 'Fruit'),
        'Petit-déjeuner': allPlats.filter(p => p.categoriePlat === 'Petit-déjeuner'),
        'Autre': allPlats.filter(p => p.categoriePlat === 'Autre' || !p.categoriePlat)
    };

    const usedPlatIdsForGeneration = new Set();

    joursSemaine.forEach(day => {
        typesRepas.forEach(mealType => {
            const categoriesForMeal = categoryDistribution[day][mealType];
            let selectedPlat = null;
            let found = false;

            for (let i = 0; i < categoriesForMeal.length; i++) {
                const category = categoriesForMeal[i];
                const eligiblePlats = (platsCategorized[category] || [])
                    .filter(plat => !usedPlatIdsForGeneration.has(plat.id));

                if (eligiblePlats.length > 0) {
                    const randomIndex = Math.floor(Math.random() * eligiblePlats.length);
                    selectedPlat = eligiblePlats[randomIndex];
                    found = true;
                    break;
                }
            }

            if (!found) {
                const fallbackPlats = (platsCategorized['Autre'] || [])
                    .filter(plat => !usedPlatIdsForGeneration.has(plat.id));

                if (fallbackPlats.length > 0) {
                    const randomIndex = Math.floor(Math.random() * fallbackPlats.length);
                    selectedPlat = fallbackPlats[randomIndex];
                } else {
                    selectedPlat = null;
                }
            }

            if (selectedPlat) {
                newPlanningContent[day][mealType] = {
                    platId: selectedPlat.id,
                    nomPlat: selectedPlat.nom,
                    photoURL: selectedPlat.photoURL || '', // Assurez-vous d'ajouter la photoURL ici
                };
                usedPlatIdsForGeneration.add(selectedPlat.id);
            } else {
                newPlanningContent[day][mealType] = { platId: '', nomPlat: 'Plat non trouvé ou tous les plats utilisés', photoURL: '' };
            }
        });
    });

    setCurrentPlanning(prev => ({
        ...prev,
        planning: newPlanningContent
    }));
    setLoading(false);
    setSuccess('Planning généré aléatoirement ! Vous pouvez l\'éditer ou le sauvegarder. (Vérification des doublons effectuée)');
  };

  const generateBreakfastOnly = () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const platsFruits = allPlats.filter(p => p.categoriePlat === 'Fruit');

    if (platsFruits.length === 0) {
        setError("Aucun plat de catégorie 'Fruit' n'est disponible pour le petit-déjeuner. Veuillez en ajouter d'abord.");
        setLoading(false);
        return;
    }

    const updatedPlanning = { ...currentPlanning.planning };
    const usedFruitPlatIds = new Set();

    joursSemaine.forEach(day => {
        let selectedPlat = null;
        const eligibleFruitPlats = platsFruits.filter(p => !usedFruitPlatIds.has(p.id));

        if (eligibleFruitPlats.length > 0) {
            const randomIndex = Math.floor(Math.random() * eligibleFruitPlats.length);
            selectedPlat = eligibleFruitPlats[randomIndex];
        } else {
            console.warn("Tous les plats de fruits ont été utilisés, réinitialisation de la liste des utilisés.");
            usedFruitPlatIds.clear();
            const randomIndex = Math.floor(Math.random() * platsFruits.length);
            selectedPlat = platsFruits[randomIndex];
        }

        if (selectedPlat) {
            updatedPlanning[day].petitDejeuner = {
                platId: selectedPlat.id,
                nomPlat: selectedPlat.nom,
                photoURL: selectedPlat.photoURL || '', // Assurez-vous d'ajouter la photoURL ici
            };
            usedFruitPlatIds.add(selectedPlat.id);
        } else {
            updatedPlanning[day].petitDejeuner = { platId: '', nomPlat: 'Fruit non trouvé', photoURL: '' };
        }
    });

    setCurrentPlanning(prev => ({
        ...prev,
        planning: updatedPlanning
    }));
    setLoading(false);
    setSuccess('Petits-déjeuners à base de fruits générés aléatoirement (sans doublon par défaut) !');
  };


  const handleSavePlanning = async () => {
    if (!currentPlanning || !currentPlanning.planning) {
      setError('Aucun planning à sauvegarder.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const cleanPlanning = {};
      const consumedIngredients = {}; // To track total consumption per ingredient for stock update

      for (const day of joursSemaine) {
        cleanPlanning[day] = {};
        for (const mealType of typesRepas) {
          const plannedMeal = currentPlanning.planning[day][mealType];
          if (plannedMeal && plannedMeal.platId) {
            cleanPlanning[day][mealType] = {
              platId: plannedMeal.platId,
              nomPlat: plannedMeal.nomPlat,
            };

            // Fetch the full plat details to get ingredients and quantities
            const fullPlat = allPlats.find(p => p.id === plannedMeal.platId);
            if (fullPlat && fullPlat.ingredientsNecessaires) {
              fullPlat.ingredientsNecessaires.forEach(ing => {
                if (consumedIngredients[ing.ingredientId]) {
                  consumedIngredients[ing.ingredientId] += ing.quantite;
                } else {
                  consumedIngredients[ing.ingredientId] = ing.quantite;
                }
              });
            }
          } else {
            cleanPlanning[day][mealType] = { platId: '', nomPlat: '' };
          }
        }
      }

      // Update stock for each consumed ingredient
      for (const ingredientId in consumedIngredients) {
        const quantityToDecrease = consumedIngredients[ingredientId];
        // Fetch current ingredient status for updateIngredientStock
        const currentIngredient = await getIngredientById(ingredientId);
        if (currentIngredient) {
            await updateIngredientStock(ingredientId, -quantityToDecrease, currentIngredient.status); // Decrease stock
        }
      }

      let saveMessage = '';
      if (currentPlanning.id) {
        await updatePlanning(currentPlanning.id, {
          planning: cleanPlanning,
          semaineDebut: currentPlanning.semaineDebut,
          semaineFin: currentPlanning.semaineFin,
        });
        saveMessage = 'Planning mis à jour avec succès et stock ajusté !';
      } else {
        const newId = await createPlanning({
          semaineDebut: currentPlanning.semaineDebut,
          semaineFin: currentPlanning.semaineFin,
          planning: cleanPlanning,
          creePar: auth.currentUser ? auth.currentUser.uid : 'anonymous',
        });
        setCurrentPlanning(prev => ({ ...prev, id: newId }));
        saveMessage = 'Nouveau planning créé avec succès et stock ajusté !';
      }

      setSuccess(saveMessage);
      fetchData(); // Re-fetch data to reflect updated stock

    } catch (err) {
      console.error('Erreur générale lors de la sauvegarde du planning et de l\'ajustement du stock :', err);
      setError('Erreur lors de la sauvegarde du planning et de l\'ajustement du stock : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlatToShoppingList = (platId) => {
    const plat = allPlats.find(p => p.id === platId);
    if (!plat || !plat.ingredientsNecessaires || plat.ingredientsNecessaires.length === 0) {
      setError('Ce plat ne contient pas d\'ingrédients à ajouter à la liste de marché.');
      return;
    }

    let shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || [];

    plat.ingredientsNecessaires.forEach(ingNeeded => {
      const existingItemIndex = shoppingList.findIndex(item => item.ingredientId === ingNeeded.ingredientId);

      if (existingItemIndex > -1) {
        shoppingList[existingItemIndex].quantite += ingNeeded.quantite;
      } else {
        shoppingList.push({
          ingredientId: ingNeeded.ingredientId,
          nom: ingNeeded.nom,
          quantite: ingNeeded.quantite,
          uniteMesure: ingNeeded.uniteMesure,
          checked: false
        });
      }
    });

    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    setSuccess(`Ingrédients de "${plat.nom}" ajoutés à la liste de marché !`);
    setError('');
    console.log("Liste de marché actuelle (localStorage):", shoppingList);
  };

  const generatePdf = () => {
    const element = document.getElementById('planning-table-container');
    if (element) {
      setLoading(true);
      setError('');
      setSuccess('');
      html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `Planning_Repas_Semaine_du_${currentPlanning.semaineDebut}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            logging: false,
            dpi: 300,
            letterRendering: true,
            useCORS: true, // TRÈS IMPORTANT pour les images externes (Firebase Storage, etc.)
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        })
        .from(element)
        .save()
        .then(() => {
          setSuccess('Le planning a été généré en PDF avec succès !');
          setLoading(false);
        })
        .catch(err => {
          console.error('Erreur lors de la génération du PDF :', err);
          setError('Erreur lors de la génération du PDF : ' + err.message);
          setLoading(false);
        });
    } else {
      setError('Impossible de trouver l\'élément du planning pour la génération PDF.');
    }
  };


  if (loading && !currentPlanning) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement du planning et des plats...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
        Planning des Repas de la Semaine
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

      {currentPlanning && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Semaine du {currentPlanning.semaineDebut} au {currentPlanning.semaineFin}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ShuffleIcon />}
              onClick={generateRandomPlanning}
              disabled={allPlats.length === 0}
            >
              Générer Planning Complet
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AutoAwesomeIcon />}
              onClick={generateBreakfastOnly}
              disabled={allPlats.filter(p => p.categoriePlat === 'Fruit').length === 0}
            >
              Générer Petits-déjeuners (Fruits)
            </Button>
            <Tooltip title="Assurez-vous d'avoir enregistré des plats dans différentes catégories (Viande, Poisson, Légumes, Petit-déjeuner, etc.) pour une génération variée.">
              <Button variant="outlined" color="info">Aide génération</Button>
            </Tooltip>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
            >
              Recharger Planning
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<PictureAsPdfIcon />}
              onClick={generatePdf}
              disabled={loading}
            >
              Télécharger en PDF
            </Button>
          </Box>

          <TableContainer component={Paper} id="planning-table-container">
            <Table sx={{ minWidth: 650 }} aria-label="planning repas">
              <TableHead>
                <TableRow>
                  <TableCell>Jour</TableCell>
                  <TableCell align="center">Petit-déjeuner</TableCell>
                  <TableCell align="center">Déjeuner</TableCell>
                  <TableCell align="center">Dîner</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {joursSemaine.map((day) => (
                  <TableRow key={day}>
                    <TableCell component="th" scope="row">
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>{day}</Typography>
                    </TableCell>
                    {typesRepas.map((mealType) => (
                      <TableCell key={`${day}-${mealType}`}>
                        <FormControl fullWidth size="small">
                          <InputLabel id={`${day}-${mealType}-label`}>Plat du {mealType === 'petitDejeuner' ? 'petit-déjeuner' : mealType}</InputLabel>
                          <Select
                            labelId={`${day}-${mealType}-label`}
                            value={currentPlanning.planning[day][mealType].platId}
                            label={`Plat du ${mealType === 'petitDejeuner' ? 'petit-déjeuner' : mealType}`}
                            onChange={(e) => handlePlatSelectionChange(day, mealType, e.target.value)}
                          >
                            <MenuItem value=""><em>-- Choisir un plat --</em></MenuItem>
                            {allPlats.map((plat) => {
                              const isPlatUsed = getPlatsUsedInCurrentWeek(day, mealType).includes(plat.id);
                              const isCurrentPlat = currentPlanning.planning[day][mealType].platId === plat.id;
                              if (mealType === 'petitDejeuner' && plat.categoriePlat !== 'Fruit') {
                                return null;
                              }
                              return (
                                <MenuItem
                                  key={plat.id}
                                  value={plat.id}
                                  disabled={isPlatUsed && !isCurrentPlat}
                                  sx={isPlatUsed && !isCurrentPlat ? { fontStyle: 'italic', color: 'text.disabled' } : {}}
                                >
                                  {plat.nom} ({plat.categoriePlat}) {isPlatUsed && !isCurrentPlat ? ' (déjà utilisé)' : ''}
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 0.5 }}>
                            {/* AJOUT ICI POUR AFFICHER LA PHOTO DU PLAT */}
                            {currentPlanning.planning[day][mealType].photoURL && (
                                <Avatar
                                    src={currentPlanning.planning[day][mealType].photoURL}
                                    alt={currentPlanning.planning[day][mealType].nomPlat}
                                    sx={{ width: 50, height: 50, mb: 1 }}
                                    variant="rounded" // Ou 'circular' si vous préférez
                                />
                            )}
                            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, textAlign: 'center' }}>
                                {currentPlanning.planning[day][mealType].nomPlat}
                            </Typography>
                            {currentPlanning.planning[day][mealType].platId && (
                                <Tooltip title={`Ajouter "${currentPlanning.planning[day][mealType].nomPlat}" à la liste de marché`}>
                                    <IconButton
                                        color="primary"
                                        size="small"
                                        onClick={() => handleAddPlatToShoppingList(currentPlanning.planning[day][mealType].platId)}
                                    >
                                        <AddShoppingCartIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            onClick={handleSavePlanning}
            sx={{ mt: 3, float: 'right' }}
          >
            Sauvegarder le Planning
          </Button>
        </Paper>
      )}
    </Box>
  );
}

export default PlanningPage;