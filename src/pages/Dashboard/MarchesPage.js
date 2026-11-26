// src/pages/Dashboard/MarchesPage.js
// « Où faire le marché ? » : marchés et supermarchés les plus proches, carte et itinéraire réel.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip as MapTooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Alert, Box, Button, ButtonBase, Chip, CircularProgress, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import DirectionsWalkRoundedIcon from '@mui/icons-material/DirectionsWalkRounded';
import NavigationRoundedIcon from '@mui/icons-material/NavigationRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { enqueueSnackbar } from 'notistack';
import { PageHeader, FilterChips } from '../../components/ui';
import {
  CENTRE_YAOUNDE, LIEUX, SOURCE, TYPES, VILLE, destinationTexte, formatDistance, formatDuree, formatHoraires, itineraire,
  liensNavigation, parDistance, recommandations,
} from '../../services/lieuxService';

// ---------- Marqueurs (icônes dessinées en CSS : pas d'images à charger) ----------
const pin = (color, { size = 16, star = false, active = false } = {}) =>
  L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${active ? 4 : 2}px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,.35);display:grid;place-items:center;color:#fff;font-size:${size * 0.55}px;line-height:1">${star ? '★' : ''}</div>`,
  });
const meIcon = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#C2461A;border:4px solid #fff;box-shadow:0 0 0 6px rgba(194,70,26,.25),0 2px 8px rgba(0,0,0,.35)"></div>',
});

/** Recentre la carte quand la vue demandée change. */
function ViewController({ view }) {
  const map = useMap();
  useEffect(() => {
    if (!view) return;
    if (view.bounds) map.fitBounds(view.bounds, { padding: [40, 40], maxZoom: 16 });
    else map.setView(view.center, view.zoom || map.getZoom());
  }, [view, map]);
  return null;
}

/** En mode « placer ma position », un clic sur la carte fixe la position. */
function PickPosition({ active, onPick }) {
  useMapEvents({ click: (e) => active && onPick({ lat: e.latlng.lat, lon: e.latlng.lng, precision: null, manuel: true }) });
  return null;
}

function LieuCard({ titre, lieu, icon, onSelect, selected }) {
  if (!lieu) return null;
  const meta = TYPES[lieu.type];
  return (
    <ButtonBase
      onClick={() => onSelect(lieu)}
      sx={{
        flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, borderRadius: 4, textAlign: 'left',
        bgcolor: 'background.paper', border: '2px solid', borderColor: selected ? meta.color : 'divider',
      }}
    >
      <Box sx={{ width: 42, height: 42, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: meta.color, color: '#fff', flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '.06em' }}>{titre}</Typography>
        <Typography sx={{ fontWeight: 750, lineHeight: 1.25 }}>{lieu.nom}</Typography>
        <Typography variant="body2" color="text.secondary">
          à {formatDistance(lieu.d)} à vol d'oiseau{lieu.connu ? ' · très connu' : ''}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

export default function MarchesPage() {
  const [pos, setPos] = useState(null); // { lat, lon, precision, manuel }
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [picking, setPicking] = useState(false);
  const [filtre, setFiltre] = useState('');
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('voiture');
  const [route, setRoute] = useState({ loading: false, data: null, error: '' });
  const [view, setView] = useState({ center: [CENTRE_YAOUNDE.lat, CENTRE_YAOUNDE.lon], zoom: 12 });
  const abortRef = useRef(null);

  const localiser = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Votre appareil ne permet pas la localisation. Touchez la carte pour indiquer où vous êtes.");
      setPicking(true);
      return;
    }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const next = { lat: p.coords.latitude, lon: p.coords.longitude, precision: p.coords.accuracy, manuel: false };
        setPos(next);
        setPicking(false);
        setLocating(false);
        setView({ center: [next.lat, next.lon], zoom: 14 });
      },
      (err) => {
        setLocating(false);
        setPicking(true);
        setGeoError(err.code === 1
          ? 'Localisation refusée. Autorisez-la dans votre navigateur, ou touchez la carte pour indiquer où vous êtes.'
          : 'Position introuvable pour le moment. Touchez la carte pour indiquer où vous êtes.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => { localiser(); }, [localiser]);

  const reco = useMemo(() => (pos ? recommandations(pos) : null), [pos]);
  const autour = useMemo(() => (pos ? parDistance(pos, { type: filtre || undefined }).slice(0, 15) : []), [pos, filtre]);
  const visibles = useMemo(() => LIEUX.filter((l) => !filtre || l.type === filtre), [filtre]);

  const choisir = (lieu) => {
    setSelected(pos ? { ...lieu, d: parDistance(pos).find((x) => x.id === lieu.id)?.d } : lieu);
    setView({ center: [lieu.lat, lieu.lon], zoom: 15 });
  };

  // Calcul de l'itinéraire réel quand un lieu est choisi (ou que le mode change).
  useEffect(() => {
    if (!pos || !selected) { setRoute({ loading: false, data: null, error: '' }); return undefined; }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRoute({ loading: true, data: null, error: '' });
    itineraire(pos, selected, mode, ctrl.signal)
      .then((data) => {
        setRoute({ loading: false, data, error: '' });
        setView({ bounds: L.latLngBounds(data.trace) });
      })
      .catch((err) => { if (err.name !== 'AbortError') setRoute({ loading: false, data: null, error: err.message }); });
    return () => ctrl.abort();
  }, [pos, selected, mode]);

  const liens = selected ? liensNavigation(pos, selected, mode) : null;

  const copierPourYango = async (lieu) => {
    const texte = destinationTexte(lieu);
    try {
      await navigator.clipboard.writeText(texte);
      enqueueSnackbar(`« ${texte} » copié. Ouvrez Yango et collez-le comme destination.`, { variant: 'success', autoHideDuration: 6000 });
    } catch {
      enqueueSnackbar(`Copie impossible. Dans Yango, cherchez : ${texte}`, { variant: 'info', autoHideDuration: 8000 });
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Organisation"
        title="Où faire le marché ?"
        subtitle={`Les marchés et supermarchés de ${VILLE} les plus proches de vous, avec l'itinéraire.`}
        actions={
          <>
            <Button variant={picking ? 'contained' : 'outlined'} startIcon={<TouchAppRoundedIcon />} onClick={() => setPicking((v) => !v)}>
              {picking ? 'Touchez la carte…' : 'Placer ma position'}
            </Button>
            <Button variant="contained" startIcon={locating ? <CircularProgress size={16} color="inherit" /> : <MyLocationRoundedIcon />} onClick={localiser} disabled={locating}>
              Me localiser
            </Button>
          </>
        }
      />

      {geoError && <Alert severity="info" sx={{ mb: 2 }}>{geoError}</Alert>}
      {pos && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {pos.manuel ? 'Position placée sur la carte.' : `Position GPS${pos.precision ? ` (précision ± ${formatDistance(pos.precision)})` : ''}.`}
          {' '}Mauvais endroit ? Utilisez « Placer ma position ».
        </Typography>
      )}

      {/* Recommandations */}
      {reco && (
        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, mb: 2.5 }}>
          <LieuCard titre="Le marché recommandé" lieu={reco.marche} icon={<StorefrontRoundedIcon />} onSelect={choisir} selected={selected?.id === reco.marche?.id} />
          <LieuCard titre="Le supermarché le plus proche" lieu={reco.supermarche} icon={<ShoppingCartRoundedIcon />} onSelect={choisir} selected={selected?.id === reco.supermarche?.id} />
        </Box>
      )}

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, alignItems: 'start' }}>
        {/* Carte */}
        <Box sx={{ position: 'relative', height: { xs: 420, md: 560 }, borderRadius: 5, overflow: 'hidden', border: '1px solid', borderColor: 'divider', zIndex: 0, cursor: picking ? 'crosshair' : undefined }}>
          <MapContainer center={view.center} zoom={view.zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">contributeurs OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ViewController view={view} />
            <PickPosition active={picking} onPick={(p) => { setPos(p); setPicking(false); setGeoError(''); }} />
            {visibles.map((l) => (
              <Marker
                key={l.id}
                position={[l.lat, l.lon]}
                icon={pin(TYPES[l.type].color, { size: l.connu ? 20 : 14, star: l.connu, active: selected?.id === l.id })}
                eventHandlers={{ click: () => choisir(l) }}
              >
                <MapTooltip direction="top" offset={[0, -8]}>{l.nom}</MapTooltip>
              </Marker>
            ))}
            {pos && <Marker position={[pos.lat, pos.lon]} icon={meIcon}><MapTooltip direction="top" offset={[0, -10]}>Vous êtes ici</MapTooltip></Marker>}
            {route.data && <Polyline positions={route.data.trace} pathOptions={{ color: '#C2461A', weight: 6, opacity: 0.85 }} />}
          </MapContainer>
          {picking && (
            <Box sx={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, px: 2, py: 1, borderRadius: 99, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700, fontSize: 14, boxShadow: 3 }}>
              Touchez la carte à l'endroit où vous êtes
            </Box>
          )}
        </Box>

        {/* Panneau latéral : itinéraire du lieu choisi, puis liste des lieux autour */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selected ? (
            <Box sx={{ p: 2.5, borderRadius: 5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Chip size="small" label={TYPES[selected.type].label} sx={{ bgcolor: TYPES[selected.type].color, color: '#fff', mb: 1 }} />
              <Typography variant="h6" sx={{ lineHeight: 1.25 }}>{selected.nom}</Typography>
              {selected.horaires && (
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <ScheduleRoundedIcon sx={{ fontSize: 16 }} /> {formatHoraires(selected.horaires)}
                </Typography>
              )}

              {pos ? (
                <>
                  <ToggleButtonGroup exclusive size="small" value={mode} onChange={(_, v) => v && setMode(v)} sx={{ mt: 2, width: '100%' }}>
                    <ToggleButton value="voiture" sx={{ flex: 1, gap: 0.75 }}><DirectionsCarRoundedIcon fontSize="small" /> Voiture / moto</ToggleButton>
                    <ToggleButton value="pied" sx={{ flex: 1, gap: 0.75 }}><DirectionsWalkRoundedIcon fontSize="small" /> À pied</ToggleButton>
                  </ToggleButtonGroup>
                  <Box sx={{ mt: 2, minHeight: 48 }}>
                    {route.loading && <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={16} /> Calcul de l'itinéraire…</Typography>}
                    {route.error && <Alert severity="warning">{route.error}</Alert>}
                    {route.data && (
                      <>
                        <Typography sx={{ fontFamily: '"Fraunces Variable", serif', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                          {formatDuree(route.data.duree)}
                        </Typography>
                        <Typography color="text.secondary">
                          {formatDistance(route.data.distance)} par la route{mode === 'voiture' ? ' · hors embouteillages' : ''}
                        </Typography>
                      </>
                    )}
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary" sx={{ mt: 1.5 }}>Indiquez votre position pour voir l'itinéraire.</Typography>
              )}

              <Typography variant="subtitle2" sx={{ mt: 2.5, mb: 1, color: 'text.secondary' }}>Y ALLER AVEC</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
                <Button variant="contained" startIcon={<NavigationRoundedIcon />} href={liens.googleMaps} target="_blank" rel="noopener">Google Maps</Button>
                <Button variant="outlined" href={liens.waze} target="_blank" rel="noopener">Waze</Button>
                <Button variant="outlined" color="inherit" startIcon={<ContentCopyRoundedIcon />} onClick={() => copierPourYango(selected)} sx={{ gridColumn: '1 / -1' }}>
                  Yango : copier la destination
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 2.5, borderRadius: 5, bgcolor: 'sand.main' }}>
              <Typography sx={{ fontWeight: 700 }}>Choisissez un lieu</Typography>
              <Typography variant="body2" color="text.secondary">
                Touchez un marché ou un supermarché sur la carte ou dans la liste pour voir l'itinéraire depuis chez vous.
              </Typography>
            </Box>
          )}

          <Box>
            <FilterChips
              options={[{ value: 'marche', label: 'Marchés' }, { value: 'supermarche', label: 'Supermarchés' }]}
              value={filtre}
              onChange={setFiltre}
              allLabel="Tous"
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1.5, maxHeight: { lg: 420 }, overflowY: { lg: 'auto' } }}>
              {!pos && <Typography variant="body2" color="text.secondary">Votre position permet de classer les lieux du plus proche au plus loin.</Typography>}
              {autour.map((l) => (
                <ButtonBase
                  key={l.id}
                  onClick={() => choisir(l)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 3, justifyContent: 'flex-start', textAlign: 'left',
                    bgcolor: selected?.id === l.id ? 'sand.main' : 'transparent', '&:hover': { bgcolor: 'sand.main' } }}
                >
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: TYPES[l.type].color, flexShrink: 0 }} />
                  <Typography sx={{ flex: 1, minWidth: 0, fontWeight: 600 }} noWrap>{l.nom}</Typography>
                  {l.connu && <StarRoundedIcon sx={{ fontSize: 16, color: 'gold.main' }} />}
                  <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>{formatDistance(l.d)}</Typography>
                </ButtonBase>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Lieux : {SOURCE}. Itinéraires : OSRM / routing.openstreetmap.de. Un lieu manque ou est mal placé ? Signalez-le-nous.
      </Typography>
    </Box>
  );
}
