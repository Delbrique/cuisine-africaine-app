// Petite courbe de tendance (une seule série) : épurée, lisible au téléphone.
// - trait 2 px + voile à 10 %, point final avec anneau de 2 px, valeur au bout de la ligne ;
// - ligne verticale qui suit le doigt/la souris et se cale sur le point le plus proche ;
// - flèches du clavier pour parcourir les points ; résumé lisible par les lecteurs d'écran.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

const H = 150;
const PAD = { top: 18, right: 64, bottom: 22, left: 6 };

export default function TendanceChart({ points, formatY, formatX, resume }) {
  const ref = useRef(null);
  const [w, setW] = useState(320);
  const [actif, setActif] = useState(null);

  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const ys = points.map((p) => p.y);
    let lo = Math.min(...ys);
    let hi = Math.max(...ys);
    if (lo === hi) { lo *= 0.9; hi *= 1.1; }
    const pad = (hi - lo) * 0.15;
    lo -= pad; hi += pad;
    const iw = w - PAD.left - PAD.right;
    const ih = H - PAD.top - PAD.bottom;
    const x = (i) => PAD.left + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
    const y = (v) => PAD.top + ih - ((v - lo) / (hi - lo)) * ih;
    const pts = points.map((p, i) => [x(i), y(p.y)]);
    const ligne = pts.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
    const base = PAD.top + ih;
    const aire = pts.length > 1 ? `${ligne} L${pts[pts.length - 1][0].toFixed(1)},${base} L${pts[0][0].toFixed(1)},${base} Z` : '';
    return { pts, ligne, aire, base };
  }, [points, w]);

  const surIndex = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    const px = clientX - r.left;
    let best = 0;
    geo.pts.forEach(([x], i) => { if (Math.abs(x - px) < Math.abs(geo.pts[best][0] - px)) best = i; });
    setActif(best);
  };

  const dernier = geo.pts[geo.pts.length - 1];
  const a = actif !== null ? geo.pts[actif] : null;
  const pa = actif !== null ? points[actif] : null;

  return (
    <Box
      ref={ref}
      sx={{
        position: 'relative', width: '100%', userSelect: 'none', touchAction: 'pan-y', color: 'text.primary',
        // Couleur de la série : terracotta (clair) / terracotta plus soutenu (sombre), validées.
        '--serie': '#C2461A',
        '[data-color-scheme="dark"] &': { '--serie': '#E8622C' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4, borderRadius: 2 },
      }}
      role="img"
      aria-label={resume}
      tabIndex={0}
      onPointerMove={(e) => surIndex(e.clientX)}
      onPointerDown={(e) => surIndex(e.clientX)}
      // Au doigt, la valeur reste affichée après le toucher (le navigateur envoie « leave » dès que
      // le doigt se lève) ; seule la souris l'efface en sortant du graphique.
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setActif(null); }}
      onBlur={() => setActif(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setActif((i) => Math.max(0, (i ?? points.length) - 1));
        if (e.key === 'ArrowRight') setActif((i) => Math.min(points.length - 1, (i ?? -1) + 1));
      }}
    >
      <svg width="100%" height={H} viewBox={`0 0 ${w} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
        <line x1={PAD.left} x2={w - PAD.right} y1={geo.base} y2={geo.base} stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
        {geo.aire && <path d={geo.aire} fill="var(--serie)" fillOpacity="0.1" />}
        {geo.pts.length > 1 && <path d={geo.ligne} fill="none" stroke="var(--serie)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {a && <line x1={a[0]} x2={a[0]} y1={PAD.top - 6} y2={geo.base} stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />}
        {(a || dernier) && (
          <circle cx={(a || dernier)[0]} cy={(a || dernier)[1]} r="5" fill="var(--serie)" stroke="var(--mui-palette-background-paper, #fff)" strokeWidth="2" />
        )}
        {/* Valeur au bout de la ligne (texte en couleur de texte, jamais en couleur de série). */}
        <text x={dernier[0] + 10} y={dernier[1] + 4} fontSize="13" fontWeight="700" fill="currentColor">{formatY(points[points.length - 1].y)}</text>
        <text x={PAD.left} y={H - 4} fontSize="11" fill="currentColor" fillOpacity="0.6">{formatX(points[0])}</text>
        {points.length > 1 && (
          <text x={w - PAD.right} y={H - 4} fontSize="11" fill="currentColor" fillOpacity="0.6" textAnchor="end">{formatX(points[points.length - 1])}</text>
        )}
      </svg>
      {a && pa && (
        <Box
          sx={{
            position: 'absolute', top: 0, left: Math.min(Math.max(a[0] - 70, 0), w - 150), width: 140, pointerEvents: 'none',
            px: 1.25, py: 0.75, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 3,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>{formatY(pa.y)}</Typography>
          <Typography variant="caption" color="text.secondary">{pa.legende}</Typography>
        </Box>
      )}
    </Box>
  );
}
