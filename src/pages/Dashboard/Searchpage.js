import React, { useState, useEffect, useRef } from 'react';
import { getPlats } from '../../services/platService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Typography, Box, Paper, Grid, Button, CircularProgress, Alert, TextField, Card, CardContent, CardMedia, Chip, InputAdornment, Divider, Avatar, List, ListItem, ListItemAvatar, ListItemText, IconButton, Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CategoryIcon from '@mui/icons-material/Category';
import TimerIcon from '@mui/icons-material/Timer';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

function SearchPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allPlats, setAllPlats] = useState([]);
  const [filteredPlats, setFilteredPlats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: 'Bonjour ! Je suis votre assistant culinaire IA spécialisé dans la cuisine camerounaise et africaine. Je peux vous aider avec :\n\n🍽️ Recettes traditionnelles et modernes\n🛒 Prix des ingrédients au Cameroun\n🥘 Conseils nutritionnels\n🌶️ Techniques de cuisine\n📍 Spécialités régionales\n\nQue puis-je faire pour vous aider aujourd\'hui ?',
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [geminiModel, setGeminiModel] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    console.log('Clé API Gemini :', GEMINI_API_KEY); // Débogage
    if (!GEMINI_API_KEY) {
      setError('Clé API Gemini manquante. Veuillez configurer REACT_APP_GEMINI_API_KEY dans votre fichier .env');
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      setGeminiModel(model);
      // Test initial pour vérifier la connexion
      model.generateContent('Test de connexion').then(() => {
        console.log('Connexion à Gemini réussie');
      }).catch((err) => {
        console.error('Erreur de connexion Gemini:', err);
        setError('Erreur de connexion à l\'API Gemini. Vérifiez votre clé API ou votre connexion réseau.');
      });
    } catch (err) {
      console.error('Erreur d\'initialisation Gemini:', err);
      setError('Erreur d\'initialisation de l\'IA. Vérifiez votre clé API ou contactez le support Google AI.');
    }
  }, []);

  useEffect(() => {
    fetchPlats();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchPlats = async () => {
    setLoading(true);
    setError('');
    try {
      const platsData = await getPlats();
      setAllPlats(platsData);
      setFilteredPlats(platsData);
    } catch (err) {
      console.error('Erreur lors du chargement des plats :', err);
      setError('Erreur lors du chargement des plats : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredPlats(allPlats);
      return;
    }

    const filtered = allPlats.filter((plat) =>
      (plat.nom || '').toLowerCase().includes(query.toLowerCase()) ||
      (plat.categoriePlat || '').toLowerCase().includes(query.toLowerCase()) ||
      (plat.description || '').toLowerCase().includes(query.toLowerCase()) ||
      (plat.ingredientsNecessaires || []).some((ing) =>
        (ing.nom || '').toLowerCase().includes(query.toLowerCase())
      )
    );

    setFilteredPlats(filtered);
  };

  const createContextualPrompt = (userMessage) => {
    const recettesContext = allPlats.length > 0
      ? `\n\nContexte des recettes disponibles dans l'application:\n${allPlats
          .slice(0, 10)
          .map(
            (plat) =>
              `- ${plat.nom} (${plat.categoriePlat || 'Non catégorisé'}): ${plat.description || 'Pas de description'}`
          )
          .join('\n')}`
      : '';

    return `Tu es un assistant culinaire expert spécialisé dans la cuisine camerounaise, africaine et internationale. Tu dois répondre uniquement aux questions liées à :
- La cuisine et les recettes (traditionnelles camerounaises, africaines, internationales)
- L'alimentation et la nutrition
- Les prix des ingrédients au Cameroun et en Afrique Centrale
- Les techniques culinaires
- Les spécialités régionales du Cameroun
- Les conseils nutritionnels adaptés au contexte africain
- L'histoire culinaire camerounaise et africaine

IMPORTANT: 
- Si la question n'est PAS liée à la cuisine, l'alimentation ou la gastronomie, réponds poliment que tu ne peux aider que pour les questions culinaires.
- Donne des informations pratiques avec des prix approximatifs en FCFA quand pertinent
- Mentionne les alternatives locales camerounaises quand possible
- Sois précis sur les quantités, temps de cuisson, et techniques

${recettesContext}

Question de l'utilisateur: ${userMessage}

Réponds en français de manière claire et utile:`;
  };

  const generateGeminiResponse = async (userMessage) => {
    if (!geminiModel) {
      throw new Error("Le modèle Gemini n'est pas initialisé. Vérifiez la clé API.");
    }

    try {
      const prompt = createContextualPrompt(userMessage);
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();

      if (!text || text.trim() === '') {
        return 'Désolé, je n\'ai pas pu générer une réponse appropriée. Pouvez-vous reformuler votre question sur la cuisine ou l\'alimentation ?';
      }

      return text;
    } catch (error) {
      console.error('Erreur Gemini AI:', error);
      if (error.message?.includes('SAFETY')) {
        return 'Je ne peux pas répondre à cette question pour des raisons de sécurité. Posez-moi plutôt une question sur la cuisine, les recettes ou l\'alimentation !';
      }
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        return 'Le service IA a atteint ses limites de quota. Réessayez dans quelques instants ou posez une question plus simple sur la cuisine.';
      }
      if (error.message?.includes('API key')) {
        return 'Clé API invalide. Vérifiez la configuration de REACT_APP_GEMINI_API_KEY dans votre fichier .env.';
      }
      return 'Erreur lors de la génération de la réponse. Vérifiez votre connexion internet ou réessayez plus tard.';
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const aiResponse = await generateGeminiResponse(userMessage.message);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        message: aiResponse,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        message: err.message || 'Désolé, je rencontre un problème technique. Vérifiez votre connexion internet et réessayez.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: 1,
        type: 'bot',
        message: 'Chat réinitialisé ! Comment puis-je vous aider avec vos questions culinaires ?',
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestionQuestions = [
    'Quels sont les prix des épices au marché de Yaoundé ?',
    'Comment préparer un Ndolé traditionnel ?',
    'Quels sont les substituts locaux pour les ingrédients importés ?',
    'Recette de Poulet DG camerounais',
    'Prix du poisson au Cameroun cette saison',
    'Conseils nutritionnels pour enfants camerounais',
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement de l'assistant de recherche...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
        Recherche & Assistant IA Culinaire
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<WarningIcon />}>
          {error}
        </Alert>
      )}

      {!GEMINI_API_KEY && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Configuration manquante : Ajoutez REACT_APP_GEMINI_API_KEY à votre fichier .env pour activer l'IA
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Section Recherche */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SearchIcon />
              Recherche de Recettes
            </Typography>

            <TextField
              fullWidth
              placeholder="Rechercher par nom, catégorie, ingrédient..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => handleSearch('')} size="small">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {filteredPlats.length} recette(s) trouvée(s)
              </Typography>
              <Button size="small" startIcon={<RefreshIcon />} onClick={fetchPlats}>
                Actualiser
              </Button>
            </Box>

            <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
              {filteredPlats.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <RestaurantIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">
                    Aucune recette trouvée. Essayez d'autres mots-clés !
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {filteredPlats.map((plat) => (
                    <Grid item xs={12} key={plat.id}>
                      <Card sx={{ display: 'flex', height: 120 }}>
                        {plat.photoURL && (
                          <CardMedia
                            component="img"
                            sx={{ width: 100, height: 120 }}
                            image={plat.photoURL}
                            alt={plat.nom}
                          />
                        )}
                        <CardContent sx={{ flex: 1, p: 2 }}>
                          <Typography variant="h6" component="h3" sx={{ fontSize: '1rem', mb: 1 }}>
                            {plat.nom}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <Chip
                              label={plat.categoriePlat || 'Autre'}
                              size="small"
                              color="primary"
                              variant="outlined"
                              icon={<CategoryIcon />}
                            />
                            {plat.tempsCuisson && (
                              <Chip
                                label={`${plat.tempsCuisson} min`}
                                size="small"
                                color="secondary"
                                variant="outlined"
                                icon={<TimerIcon />}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {plat.description || 'Délicieuse recette à découvrir !'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Section Chatbot */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToyIcon />
                Assistant IA Culinaire
                {geminiModel && <Chip label="Gemini AI" size="small" color="success" />}
              </Typography>
              <Button size="small" startIcon={<ClearIcon />} onClick={clearChat} color="secondary">
                Effacer
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Suggestions de questions */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Questions suggérées :
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {suggestionQuestions.slice(0, 3).map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    size="small"
                    variant="outlined"
                    onClick={() => setChatInput(suggestion)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>

            {/* Messages du chat */}
            <Box
              sx={{
                flexGrow: 1,
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                p: 1,
                mb: 2,
                backgroundColor: '#fafafa',
              }}
            >
              <List dense>
                {chatMessages.map((msg) => (
                  <ListItem
                    key={msg.id}
                    sx={{
                      flexDirection: 'column',
                      alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start',
                      py: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        maxWidth: '90%',
                        flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: msg.type === 'user' ? 'primary.main' : 'secondary.main',
                        }}
                      >
                        {msg.type === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                      </Avatar>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          backgroundColor: msg.type === 'user' ? 'primary.light' : 'white',
                          color: msg.type === 'user' ? 'primary.contrastText' : 'text.primary',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          {msg.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            display: 'block',
                            textAlign: 'right',
                            mt: 0.5,
                          }}
                        >
                          {msg.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Box>
                  </ListItem>
                ))}
                {isChatLoading && (
                  <ListItem sx={{ justifyContent: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, backgroundColor: 'secondary.main' }}>
                        <SmartToyIcon />
                      </Avatar>
                      <CircularProgress size={20} />
                      <Typography variant="body2" color="text.secondary">
                        Gemini IA réfléchit...
                      </Typography>
                    </Box>
                  </ListItem>
                )}
              </List>
              <div ref={chatEndRef} />
            </Box>

            {/* Zone de saisie (inchangée) */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Posez votre question sur la cuisine camerounaise, les prix au marché, les recettes..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isChatLoading || !geminiModel}
              />
              <Tooltip title="Envoyer le message">
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isChatLoading || !geminiModel}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  <SendIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SearchPage;