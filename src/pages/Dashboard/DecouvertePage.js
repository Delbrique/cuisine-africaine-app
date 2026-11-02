import React, { useEffect, useState } from 'react';
import { Box, Button, CardActions, IconButton, Rating, Tooltip, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import { enqueueSnackbar } from 'notistack';

import { createPlat } from '../../services/platService';
import { GEMINI_API_KEY, generateText } from '../../services/gemini';
import { normalize } from '../../utils';
import { EmptyState, FilterChips, LoadingGrid, PageHeader } from '../../components/ui';
import { DECOUVERTE_CATEGORIES } from '../../constants';
import PlatCard from './PlatsEtIngredients/PlatCard';
import PlatDetail from './PlatsEtIngredients/PlatDetail';

const PEXELS_API_KEY = process.env.REACT_APP_PEXELS_API_KEY;

const words = (s) => normalize(s).split(/[^a-z0-9]+/).filter((w) => w.length > 3);

/** Photo libre de droits depuis Wikipédia (fr puis en), sans clé. Renvoie '' si rien de pertinent. */
const fetchWikipediaImage = async (dishName) => {
  const wanted = words(dishName);
  // Tolère les variantes d'orthographe (shakshuka / shakshouka) en comparant le début des mots.
  const related = (title) => words(title).some((w) => wanted.some((x) => w.slice(0, 5) === x.slice(0, 5)));
  const inParens = (dishName.match(/\(([^)]+)\)/) || [])[1];
  const main = dishName.replace(/\s*\([^)]*\)/g, '').trim();
  // Dernier recours : le premier mot du nom (« Bissap glacé au gingembre » → « Bissap »).
  const queries = [...new Set([main, inParens, dishName, main.split(/\s+/)[0]].filter(Boolean))];

  for (const q of queries) {
    for (const lang of ['fr', 'en']) {
      try {
        const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search`
          + `&gsrsearch=${encodeURIComponent(q)}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=600`;
        const data = await (await fetch(url)).json();
        const pages = Object.values(data.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
        // On n'accepte l'image que si l'article parle bien du plat.
        const page = pages.find((p) => p.thumbnail?.source && related(p.title));
        if (page) return page.thumbnail.source;
      } catch (error) {
        console.warn('Recherche Wikipédia impossible :', error.message);
      }
    }
  }
  return '';
};

// Pexels si une clé est configurée, sinon Wikipédia. '' = illustration de repli.
const fetchDishImage = async (dishName) => {
  if (PEXELS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(`${dishName} food`)}&per_page=1`,
        { headers: { Authorization: PEXELS_API_KEY } }
      );
      const photo = (await response.json()).photos?.[0]?.src?.medium;
      if (photo) return photo;
    } catch (error) {
      console.error('Erreur Pexels :', error);
    }
  }
  return fetchWikipediaImage(dishName);
};

const fetchNewDishesWithGemini = async (existingDishNames = [], batchSize = 12) => {
  if (!GEMINI_API_KEY) return [];
  const categories = DECOUVERTE_CATEGORIES;
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
  try {
    const text = await generateText(prompt);
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) {
      console.warn('Réponse JSON invalide :', text);
      return [];
    }
    const parsed = JSON.parse(match[1]);
    const photos = await Promise.all(parsed.map((d) => fetchDishImage(d.nom)));
    return parsed.map((dish, index) => ({
      ...dish,
      id: `generated-${Date.now()}-${index}`,
      photoURL: photos[index],
      description: dish.description || 'Plat traditionnel.',
      tempsPreparation: dish.tempsPreparation || 0,
      tempsCuisson: dish.tempsCuisson || 0,
      difficulte: dish.difficulte || 'Facile',
      instructions: dish.instructions || 'Suivez les étapes traditionnelles.',
      ingredientsNecessaires: dish.ingredientsNecessaires || [],
      origine: dish.origine || 'Origine inconnue',
      utilisation: dish.utilisation || 'À consommer selon la tradition.',
      richeEn: dish.richeEn || 'Nutriments variés',
    }));
  } catch (error) {
    console.error('Erreur lors de la génération des plats avec Gemini :', error);
    return [];
  }
};

function DecouvertePage() {
  const [plats, setPlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [ratings, setRatings] = useState({});
  const [added, setAdded] = useState(new Set());
  const [seen, setSeen] = useState([]);
  const [viewing, setViewing] = useState(null);

  const loadNewDishes = async () => {
    setLoading(true);
    setCategory('');
    const dishes = await fetchNewDishesWithGemini(seen);
    if (dishes.length) {
      setPlats(dishes);
      setSeen((prev) => [...prev, ...dishes.map((d) => d.nom)]);
    } else if (GEMINI_API_KEY) {
      enqueueSnackbar('Impossible de générer de nouveaux plats pour le moment.', { variant: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNewDishes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToMine = async (plat) => {
    const { id, ...data } = plat;
    try {
      await createPlat(data);
      setAdded((s) => new Set(s).add(id));
      enqueueSnackbar(`« ${plat.nom} » ajouté à vos plats !`, { variant: 'success' });
    } catch (err) {
      console.error("Erreur lors de l'ajout du plat :", err);
      enqueueSnackbar("Erreur lors de l'ajout du plat.", { variant: 'error' });
    }
  };

  const toggleFavorite = (id) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const shown = category ? plats.filter((p) => p.categoriePlat === category) : plats;
  const AddButton = ({ plat, ...props }) => {
    const done = added.has(plat.id);
    return (
      <Button size="small" variant={done ? 'outlined' : 'contained'} color={done ? 'success' : 'primary'} disabled={done}
        startIcon={done ? <CheckRoundedIcon /> : <AddRoundedIcon />} onClick={() => addToMine(plat)} {...props}>
        {done ? 'Ajouté' : 'Ajouter'}
      </Button>
    );
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Cuisine"
        title="Découverte"
        subtitle="Des idées de plats d'Afrique et du monde, imaginées par l'IA. Ajoutez celles qui vous tentent à votre livre de recettes."
        actions={
          <Button variant="contained" startIcon={<AutoAwesomeRoundedIcon />} onClick={loadNewDishes} disabled={loading || !GEMINI_API_KEY}>
            {loading ? 'Recherche d\'idées…' : 'Nouvelles idées'}
          </Button>
        }
      />

      {!GEMINI_API_KEY ? (
        <EmptyState icon={<ExploreRoundedIcon />} title="Découverte indisponible" description="Ajoutez REACT_APP_GEMINI_API_KEY (et éventuellement REACT_APP_PEXELS_API_KEY pour les photos) dans le fichier .env, puis relancez l'application." />
      ) : (
        <>
          <FilterChips options={DECOUVERTE_CATEGORIES} value={category} onChange={setCategory} allLabel="Tous les repas" sx={{ mb: 3 }} />
          {loading ? (
            <LoadingGrid count={8} />
          ) : shown.length === 0 ? (
            <EmptyState icon={<ExploreRoundedIcon />} title="Rien dans cette catégorie" description="Essayez une autre catégorie ou demandez de nouvelles idées." />
          ) : (
            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {shown.map((p) => (
                <PlatCard
                  key={p.id}
                  plat={p}
                  onClick={() => setViewing(p)}
                  badge={p.origine ? <Box sx={{ px: 1.25, py: 0.4, borderRadius: 2, bgcolor: 'rgba(20,12,8,.55)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 12, fontWeight: 700 }}>{p.origine}</Box> : null}
                  footer={
                    <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                      <Rating size="small" value={ratings[p.id] || 0} onChange={(_, v) => setRatings((r) => ({ ...r, [p.id]: v }))} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={favorites.has(p.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
                          <IconButton size="small" onClick={() => toggleFavorite(p.id)} sx={{ color: favorites.has(p.id) ? 'error.main' : 'text.secondary' }}>
                            {favorites.has(p.id) ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
                          </IconButton>
                        </Tooltip>
                        <AddButton plat={p} />
                      </Box>
                    </CardActions>
                  }
                />
              ))}
            </Box>
          )}
        </>
      )}

      <PlatDetail plat={viewing} onClose={() => setViewing(null)} extraActions={viewing && <AddButton plat={viewing} size="medium" />} />
      {!loading && plats.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 4 }}>
          Idées générées par IA : vérifiez les quantités avant de cuisiner.
        </Typography>
      )}
    </Box>
  );
}

export default DecouvertePage;
