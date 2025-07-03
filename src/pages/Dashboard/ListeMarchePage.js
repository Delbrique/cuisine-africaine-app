import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Divider,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import EmailIcon from '@mui/icons-material/Email';

import { updateIngredientStock, getIngredientById, INGREDIENT_STATUS, getIngredients } from '../../services/ingredientService';
import { getPlats } from '../../services/platService';
import { getMostRecentPlanning } from '../../services/planningService';
import { getMembres } from '../../services/membreService';

// Fonction utilitaire pour convertir un Blob en Base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

function ListeMarchePage() {
  const [shoppingList, setShoppingList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [allPlats, setAllPlats] = useState([]);
  const [allIngredientsFromStock, setAllIngredientsFromStock] = useState([]);
  const [membresFamille, setMembresFamille] = useState([]);
  const [loading, setLoading] = useState(false); // État de chargement pour les opérations

  // Fonction pour récupérer toutes les données nécessaires
  const fetchData = async () => {
    try {
      const platsData = await getPlats();
      setAllPlats(platsData);

      const ingredientsData = await getIngredients();
      setAllIngredientsFromStock(ingredientsData);

      const membresData = await getMembres();
      setMembresFamille(membresData);
    } catch (err) {
      console.error('Erreur lors du chargement des données :', err);
      setError('Erreur lors du chargement des plats, ingrédients ou membres pour la liste de marché.');
    }
  };

  const aggregateIngredients = useCallback((currentPlannedMeals, availablePlats, availableIngredients) => {
    const aggregated = {};

    currentPlannedMeals.forEach(mealEntry => {
      const fullPlat = availablePlats.find(plat => plat.id === mealEntry.platId);

      if (fullPlat && fullPlat.ingredientsNecessaires) {
        fullPlat.ingredientsNecessaires.forEach(platIngredient => {
          const stockIngredient = availableIngredients.find(ing => ing.id === platIngredient.ingredientId);

          const ingredientId = platIngredient.ingredientId;
          const nom = platIngredient.nom;
          const quantite = parseFloat(platIngredient.quantite) || 0;
          const uniteMesure = platIngredient.uniteMesure;
          const prixUnitaire = parseFloat(stockIngredient?.prix) || 0;

          if (aggregated[ingredientId]) {
            aggregated[ingredientId].quantite += quantite;
          } else {
            aggregated[ingredientId] = {
              ingredientId,
              nom,
              quantite,
              uniteMesure,
              prixUnitaire,
              checked: false,
            };
          }
        });
      }
    });
    return Object.values(aggregated);
  }, []);

  useEffect(() => {
    const storedList = JSON.parse(localStorage.getItem('shoppingList')) || [];
    const parsedStoredList = storedList.map(item => ({
      ...item,
      quantite: parseFloat(item.quantite) || 0,
      prixUnitaire: parseFloat(item.prixUnitaire) || 0,
    }));
    setShoppingList(parsedStoredList);
    fetchData();
  }, []);

  const handleGenerateShoppingList = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (allPlats.length === 0 || allIngredientsFromStock.length === 0) {
        await fetchData();
      }

      const recentPlanning = await getMostRecentPlanning();
      let currentPlannedMeals = [];

      if (recentPlanning && recentPlanning.planning) {
        Object.keys(recentPlanning.planning).forEach(day => {
          Object.keys(recentPlanning.planning[day]).forEach(mealType => {
            const meal = recentPlanning.planning[day][mealType];
            if (meal && meal.platId) {
              currentPlannedMeals.push({ platId: meal.platId });
            }
          });
        });
      }

      if (currentPlannedMeals.length === 0) {
        setError("Aucun plat n'est planifié pour la semaine. Veuillez remplir votre planning.");
        setSuccess('');
        return;
      }

      const newShoppingList = aggregateIngredients(currentPlannedMeals, allPlats, allIngredientsFromStock);

      for (const item of newShoppingList) {
        const currentIngredient = await getIngredientById(item.ingredientId);
        if (currentIngredient) {
          if (currentIngredient.status === INGREDIENT_STATUS.EXHAUSTED || currentIngredient.status === INGREDIENT_STATUS.NOT_USED) {
            await updateIngredientStock(item.ingredientId, item.quantite, currentIngredient.status);
          }
        }
      }

      setShoppingList(newShoppingList);
      localStorage.setItem('shoppingList', JSON.stringify(newShoppingList));
      setSuccess('Liste de marché générée à partir du planning de repas et stock potentiellement ajusté.');
      setError('');
    } catch (e) {
      console.error("Erreur lors de la génération de la liste ou de la mise à jour du stock :", e);
      setError("Erreur lors de la génération de la liste ou de la mise à jour du stock : " + e.message);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheck = (ingredientId) => {
    const updatedList = shoppingList.map(item =>
      item.ingredientId === ingredientId ? { ...item, checked: !item.checked } : item
    );
    setShoppingList(updatedList);
    localStorage.setItem('shoppingList', JSON.stringify(updatedList));
  };

  const handleRemoveItem = async (ingredientId) => {
    const updatedList = shoppingList.filter(item => item.ingredientId !== ingredientId);
    setShoppingList(updatedList);
    localStorage.setItem('shoppingList', JSON.stringify(updatedList));
    setSuccess('Ingrédient retiré de la liste.');
    setError('');
  };

  const handleClearAll = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vider toute la liste de marché ?')) {
      setShoppingList([]);
      localStorage.removeItem('shoppingList');
      setSuccess('Liste de marché vidée.');
      setError('');
    }
  };

  const generateShoppingListPdf = () => {
    return new Promise((resolve, reject) => {
      const doc = new jsPDF();
      const margin = 15;
      let yPosition = margin + 10;
      const lineHeight = 7;

      doc.setFontSize(20);
      doc.text('Liste de Marché', margin, yPosition);
      yPosition += lineHeight + 5;

      doc.setFontSize(10);
      const today = new Date().toLocaleDateString('fr-FR');
      doc.text(`Générée le : ${today}`, margin, yPosition);
      yPosition += lineHeight + 10;

      if (shoppingList.length === 0) {
        doc.setFontSize(12);
        doc.text("Votre liste de marché est vide. Rien à exporter.", margin, yPosition);
        doc.output('blob').then(resolve).catch(reject);
        return;
      }

      for (const item of shoppingList) {
        if (yPosition + lineHeight * 2 > doc.internal.pageSize.height - margin) {
          doc.addPage();
          yPosition = margin + 10;
        }

        doc.setFontSize(12);
        const itemPriceCalculated = (parseFloat(item.prixUnitaire) || 0) * (parseFloat(item.quantite) || 0);
        const itemCost = isNaN(itemPriceCalculated) ? 'N/A' : itemPriceCalculated.toFixed(0);

        const text = `${item.nom} : ${item.quantite} ${item.uniteMesure} (Est. ${itemCost} FCFA)`;
        doc.text(text, margin, yPosition + lineHeight);

        yPosition += lineHeight * 2;
        doc.line(margin, yPosition, doc.internal.pageSize.width - margin, yPosition);
        yPosition += 5;
      }

      const totalCost = shoppingList.reduce((acc, item) => {
        const itemPrice = parseFloat(item.prixUnitaire) || 0;
        const itemQuantity = parseFloat(item.quantite) || 0;
        return acc + (itemPrice * itemQuantity);
      }, 0);

      doc.setFontSize(14);
      doc.text(`Coût total  : ${totalCost.toFixed(0)} FCFA`, margin, yPosition + 10);

      doc.output('blob').then(resolve).catch(reject);
    });
  };

  const handleDownloadPdf = async () => {
    setIsPdfGenerating(true);
    setError('');
    setSuccess('');
    try {
      const pdfBlob = await generateShoppingListPdf();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `Liste_de_Marche_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(pdfUrl);
      setSuccess('La liste de marché a été générée en PDF et téléchargée avec succès !');
    } catch (err) {
      console.error('Erreur lors du téléchargement du PDF :', err);
      setError('Erreur lors du téléchargement du PDF : ' + err.message);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleSendShoppingListEmail = async () => {
    if (shoppingList.length === 0) {
      setError('La liste de marché est vide. Générez-la avant de l\'envoyer par e-mail.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const shoppingListPdfBlob = await generateShoppingListPdf();
      const shoppingListPdfBase64 = await blobToBase64(shoppingListPdfBlob);

      const emailsToSend = [];
      for (const membre of membresFamille) {
        if (!membre.email) continue;

        let messageBody = `Bonjour ${membre.nom},\n\n`;
        messageBody += `Voici la liste de marché pour nos prochains repas ! N'oubliez pas que chaque dépense dans notre alimentation est un investissement dans notre bien-être et notre bonheur familial. Ensemble, faisons de chaque repas un moment spécial.\n\n`;
        messageBody += `La liste de marché est jointe à cet e-mail.\n\n`;
        messageBody += `Merci de votre contribution !\nL'équipe Cuisine Africaine App.`;

        emailsToSend.push({
          to: membre.email,
          subject: `Votre Liste de Marché !`,
          body: messageBody,
          attachment: {
            filename: `Liste_de_Marche_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`,
            content: shoppingListPdfBase64,
            contentType: 'application/pdf',
          },
        });
      }

      // VRAI ENVOI AU BACKEND
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: emailsToSend }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi des e-mails.');
      }

      setSuccess('La liste de marché a été envoyée par e-mail à tous les membres de la famille !');
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la liste de marché par e-mail :', err);
      setError('Erreur lors de l\'envoi de la liste de marché par e-mail : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalCost = shoppingList.reduce((acc, item) => {
    const itemPrice = parseFloat(item.prixUnitaire) || 0;
    const itemQuantity = parseFloat(item.quantite) || 0;
    return acc + (itemPrice * itemQuantity);
  }, 0);

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
        Liste de Marché
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

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ShoppingCartIcon />}
          onClick={handleGenerateShoppingList}
          disabled={allPlats.length === 0 || allIngredientsFromStock.length === 0 || loading}
        >
          Générer la liste à partir du planning
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleDownloadPdf}
          startIcon={isPdfGenerating ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
          disabled={shoppingList.length === 0 || isPdfGenerating || loading}
        >
          {isPdfGenerating ? 'Génération...' : 'Télécharger en PDF'}
        </Button>
        <Button
          variant="contained"
          color="info"
          startIcon={<EmailIcon />}
          onClick={handleSendShoppingListEmail}
          disabled={shoppingList.length === 0 || membresFamille.length === 0 || membresFamille.filter(m => m.email).length === 0 || loading}
        >
          Envoyer par Mail
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<ClearAllIcon />}
          onClick={handleClearAll}
          disabled={shoppingList.length === 0 || loading}
        >
          Vider toute la liste
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Opération en cours...</Typography>
        </Box>
      )}

      {!loading && shoppingList.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="body1" align="center">
            Votre liste de marché est vide. Générez-la à partir du "Planning des Repas" !
          </Typography>
        </Paper>
      ) : (
        !loading && (
          <Paper elevation={2} sx={{ p: 3 }}>
            <List>
              {shoppingList.map((item) => (
                <React.Fragment key={item.ingredientId}>
                  <ListItem>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.checked}
                          onChange={() => handleToggleCheck(item.ingredientId)}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                          <Typography
                            sx={{ textDecoration: item.checked ? 'line-through' : 'none', flexGrow: 1 }}
                          >
                            {item.nom} : {item.quantite} {item.uniteMesure}
                            {item.prixUnitaire !== undefined && item.quantite !== undefined && (
                              ` (Est. ${(parseFloat(item.quantite) * parseFloat(item.prixUnitaire)).toFixed(0)} FCFA)`
                            )}
                          </Typography>
                        </Box>
                      }
                      sx={{ flexGrow: 1, mr: 2 }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveItem(item.ingredientId)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Typography variant="h6">
                Coût total : {totalCost.toFixed(0)} FCFA
              </Typography>
            </Box>
          </Paper>
        )
      )}
    </Box>
  );
}

export default ListeMarchePage;