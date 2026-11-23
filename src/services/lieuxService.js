// src/services/lieuxService.js
// Marchés et supermarchés : distances, recommandations, itinéraires et liens de navigation.
//
// Données : extrait vérifié d'OpenStreetMap (src/data/lieuxYaounde.json), © contributeurs OSM (ODbL).
// Itinéraires : serveurs OSRM de routing.openstreetmap.de (FOSSGIS), gratuits, sans clé.
import data from '../data/lieuxYaounde.json';

export const VILLE = data.ville;
export const SOURCE = data.source;
export const LIEUX = data.lieux;

/** Centre de Yaoundé (repli quand la position est inconnue). */
export const CENTRE_YAOUNDE = { lat: 3.8667, lon: 11.5167 };

export const TYPES = {
  marche: { label: 'Marché', pluriel: 'Marchés', color: '#2F8F5B' },
  supermarche: { label: 'Supermarché', pluriel: 'Supermarchés', color: '#2C6E8F' },
};

/** Distance à vol d'oiseau en mètres (formule de haversine). */
export const distance = (a, b) => {
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Lieux triés du plus proche au plus loin, avec leur distance (`d`, en mètres). */
export const parDistance = (pos, { type } = {}) =>
  LIEUX.filter((l) => !type || l.type === type)
    .map((l) => ({ ...l, d: distance(pos, l) }))
    .sort((a, b) => a.d - b.d);

/**
 * Recommandations autour d'une position :
 * - le marché CONNU le plus proche (repli : le marché le plus proche) ;
 * - le supermarché le plus proche.
 */
export const recommandations = (pos) => {
  const marches = parDistance(pos, { type: 'marche' });
  const supers = parDistance(pos, { type: 'supermarche' });
  return {
    marche: marches.find((m) => m.connu) || marches[0] || null,
    marchePlusProche: marches[0] || null,
    supermarche: supers[0] || null,
  };
};

export const formatDistance = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',')} km`);

export const formatDuree = (s) => {
  const min = Math.max(1, Math.round(s / 60));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
};

const JOURS = { Mo: 'lun', Tu: 'mar', We: 'mer', Th: 'jeu', Fr: 'ven', Sa: 'sam', Su: 'dim', PH: 'jours fériés' };
/** Horaires OpenStreetMap (« Mo-Sa 07:00-18:00; We off ») en français lisible. */
export const formatHoraires = (h) => {
  if (!h) return '';
  if (h.trim() === '24/7') return 'Ouvert 24 h/24, 7 j/7';
  return h
    .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (j) => JOURS[j])
    .replace(/(\w+)-(\w+)(?= \d)/g, '$1–$2')
    .replace(/\boff\b/g, 'fermé')
    .replace(/(\d\d):(\d\d)/g, '$1 h $2')
    .replace(/ h 00/g, ' h')
    .replace(/;\s*/g, ' · ');
};

export const MODES = {
  voiture: { label: 'Voiture / moto', profil: 'routed-car' },
  pied: { label: 'À pied', profil: 'routed-foot' },
};

/**
 * Itinéraire réel par la route entre deux points.
 * Renvoie { distance (m), duree (s), trace: [[lat, lon], …] }.
 */
export const itineraire = async (de, vers, mode = 'voiture', signal) => {
  const { profil } = MODES[mode] || MODES.voiture;
  const url = `https://routing.openstreetmap.de/${profil}/route/v1/driving/${de.lon},${de.lat};${vers.lon},${vers.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Service d'itinéraire indisponible (${res.status}).`);
  const json = await res.json();
  const route = json.routes?.[0];
  if (json.code !== 'Ok' || !route) throw new Error('Aucun itinéraire trouvé pour ce trajet.');
  return {
    distance: route.distance,
    duree: route.duration,
    trace: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
  };
};

/** Liens pour lancer le guidage dans une application de navigation. */
export const liensNavigation = (de, vers, mode = 'voiture') => {
  const travelmode = mode === 'pied' ? 'walking' : 'driving';
  const origin = de ? `&origin=${de.lat},${de.lon}` : '';
  return {
    googleMaps: `https://www.google.com/maps/dir/?api=1${origin}&destination=${vers.lat},${vers.lon}&travelmode=${travelmode}`,
    waze: `https://waze.com/ul?ll=${vers.lat},${vers.lon}&navigate=yes`,
  };
};

/**
 * Yango ne publie pas de lien d'ouverture utilisable sans identifiant de partenaire
 * (yango.go.link et la redirection AppMetrica répondent 404/400 sans lui) : on propose
 * de copier la destination, à coller dans l'application Yango.
 */
export const destinationTexte = (lieu) => `${lieu.nom}, ${VILLE}`;
