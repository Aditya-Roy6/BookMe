import React from 'react';
import { Music, Trophy, Shield, Activity, Flag, Swords, Mic } from 'lucide-react';
import { Film, Sun, Flame } from './MappedIcons';

/**
 * Architectural Venue Presets - Core Focus: Movies & Concerts
 * (Sports, Theatre, and Esports presets are preserved in comments below for future expansion)
 */
export const VENUE_LAYOUT_PRESETS = [
  {
    id: 'cinema',
    name: 'IMAX & Dolby Cinema',
    category: 'Movies',
    icon: Film,
    description: 'Curved acoustic IMAX screen with classic rows, prime sweet-spot, and VIP recliners.',
    defaultRows: 8,
    defaultCols: 14,
    categories: [
      { name: 'VIP Recliners', color: '#ffa42b', rowStart: 1, rowEnd: 2, price: 950 },
      { name: 'Prime Club', color: '#1ed760', rowStart: 3, rowEnd: 5, price: 550 },
      { name: 'Classic Front', color: '#38bdf8', rowStart: 6, rowEnd: 8, price: 350 },
    ],
  },
  {
    id: 'amphitheatre',
    name: 'Concert Amphitheatre & Arena Stage',
    category: 'Concerts & Live',
    icon: Sun,
    description: 'Semicircular concert festival stage with Golden Circle front standing, lower tier, and lawn risers.',
    defaultRows: 10,
    defaultCols: 16,
    categories: [
      { name: 'Golden Circle (Front Stage)', color: '#ffa42b', rowStart: 1, rowEnd: 3, price: 3000 },
      { name: 'Main Tiered Risers', color: '#1ed760', rowStart: 4, rowEnd: 7, price: 1600 },
      { name: 'Lawn Terraces', color: '#38bdf8', rowStart: 8, rowEnd: 10, price: 750 },
    ],
  },
  /* ─── FUTURE SPORTS & SPECIALTY PRESETS (PRESERVED FOR LATER USE) ───
  {
    id: 'cricket',
    name: 'Cricket Stadium (360° Oval)',
    category: 'Sports',
    icon: Trophy,
    description: 'Oval cricket ground with 22-yard pitch, North Pavilion, South Stand, and Boundary Terraces.',
    defaultRows: 12,
    defaultCols: 18,
    categories: [
      { name: 'North Pavilion (VIP Box)', color: '#ffa42b', rowStart: 1, rowEnd: 3, price: 3500 },
      { name: 'South Grandstand', color: '#1ed760', rowStart: 4, rowEnd: 7, price: 1800 },
      { name: 'East / West Boundary Tier', color: '#38bdf8', rowStart: 8, rowEnd: 12, price: 900 },
    ],
  },
  {
    id: 'football',
    name: 'Football Stadium (4 Quads)',
    category: 'Sports',
    icon: Shield,
    description: 'Rectangular pitch with North/South Goal Ends, Main West Grandstand, and East Executive Tier.',
    defaultRows: 10,
    defaultCols: 16,
    categories: [
      { name: 'West Grandstand (Pitchside VIP)', color: '#ffa42b', rowStart: 1, rowEnd: 3, price: 2800 },
      { name: 'North Home End (Supporters)', color: '#1ed760', rowStart: 4, rowEnd: 7, price: 1400 },
      { name: 'South / East Upper Tier', color: '#38bdf8', rowStart: 8, rowEnd: 10, price: 850 },
    ],
  },
  {
    id: 'tennis',
    name: 'Tennis Grand Slam Arena',
    category: 'Sports',
    icon: Activity,
    description: 'Center Court bowl with service lines, baseline boxes, and umpire-side VIP boxes.',
    defaultRows: 8,
    defaultCols: 14,
    categories: [
      { name: 'Courtside Box Row 1-2', color: '#ffa42b', rowStart: 1, rowEnd: 2, price: 4500 },
      { name: 'North / South Baseline Club', color: '#1ed760', rowStart: 3, rowEnd: 5, price: 2200 },
      { name: 'Upper Bowl Gallery', color: '#38bdf8', rowStart: 6, rowEnd: 8, price: 1100 },
    ],
  },
  {
    id: 'basketball',
    name: 'Basketball & Indoor Arena',
    category: 'Sports',
    icon: Flame,
    description: 'Hardwood court with paint keys, courtside VIP hardwood rows, and lower bowl tiers.',
    defaultRows: 8,
    defaultCols: 14,
    categories: [
      { name: 'Courtside VIP (Hardwood)', color: '#ffa42b', rowStart: 1, rowEnd: 2, price: 5000 },
      { name: 'Lower Bowl Club', color: '#1ed760', rowStart: 3, rowEnd: 5, price: 2000 },
      { name: 'Upper Deck Tier', color: '#38bdf8', rowStart: 6, rowEnd: 8, price: 950 },
    ],
  },
  {
    id: 'f1',
    name: 'F1 Trackside Grandstand',
    category: 'Motorsport',
    icon: Flag,
    description: 'Pit straight circuit with start grid boxes, kerbs, Paddock Club, and trackside terraces.',
    defaultRows: 8,
    defaultCols: 16,
    categories: [
      { name: 'Paddock Club (Pit Building)', color: '#ffa42b', rowStart: 1, rowEnd: 2, price: 6500 },
      { name: 'Main Straight Covered Grandstand', color: '#1ed760', rowStart: 3, rowEnd: 5, price: 3200 },
      { name: 'Trackside Apex Terrace', color: '#38bdf8', rowStart: 6, rowEnd: 8, price: 1500 },
    ],
  },
  {
    id: 'theatre',
    name: 'Broadway & Opera House',
    category: 'Performing Arts',
    icon: Music,
    description: 'Proscenium arch stage with orchestra stalls, left/right Royal Boxes, and elevated Balcony.',
    defaultRows: 9,
    defaultCols: 14,
    categories: [
      { name: 'Royal Box & Orchestra Stalls', color: '#ffa42b', rowStart: 1, rowEnd: 3, price: 2500 },
      { name: 'Mezzanine Royal Circle', color: '#1ed760', rowStart: 4, rowEnd: 6, price: 1500 },
      { name: 'Grand Balcony Upper Tier', color: '#38bdf8', rowStart: 7, rowEnd: 9, price: 800 },
    ],
  },
  {
    id: 'esports',
    name: 'Esports Octagon & Combat Arena',
    category: 'Esports & Gaming',
    icon: Swords,
    description: 'Center elevated octagon stage with Team Red/Blue spectator wings and caster desk.',
    defaultRows: 8,
    defaultCols: 14,
    categories: [
      { name: 'Ringside VIP / Caster Row', color: '#ffa42b', rowStart: 1, rowEnd: 2, price: 2200 },
      { name: 'Team Red / Blue Wings', color: '#1ed760', rowStart: 3, rowEnd: 5, price: 1200 },
      { name: 'Upper Spectator Deck', color: '#38bdf8', rowStart: 6, rowEnd: 8, price: 650 },
    ],
  },
  {
    id: 'cabaret',
    name: 'Cabaret & Comedy Lounge',
    category: 'Comedy & Nightlife',
    icon: Mic,
    description: 'Intimate spotlight wooden stage with VIP cocktail round tables and booth seating.',
    defaultRows: 6,
    defaultCols: 12,
    categories: [
      { name: 'Front Row Cocktail Tables', color: '#ffa42b', rowStart: 1, rowEnd: 2, price: 1500 },
      { name: 'Center Booths', color: '#1ed760', rowStart: 3, rowEnd: 4, price: 950 },
      { name: 'High-Top Stool Terrace', color: '#38bdf8', rowStart: 5, rowEnd: 6, price: 500 },
    ],
  },
  ─── END OF PRESERVED PRESETS ─── */
];

/**
 * Detect layout type from venue or event metadata
 */
export function resolveLayoutType(venue, event) {
  const type = (event?.type || '').toLowerCase();
  const title = (event?.title || venue?.name || '').toLowerCase();

  if (type === 'concert' || title.includes('concert') || title.includes('coldplay') || title.includes('hans zimmer') || title.includes('symphony') || title.includes('amphitheatre')) {
    return 'amphitheatre';
  }

  return 'cinema';
}

/**
 * 3D Curved Perspective Cinema & Auditorium Screen
 */
export function AuditoriumScreen3D({ label = 'SCREEN • AUDITORIUM' }) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-10 flex flex-col items-center select-none relative px-2">
      {/* 3D Cinema Screen Curved Architecture */}
      <svg
        viewBox="0 0 1000 90"
        className="w-full h-16 sm:h-20 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Atmospheric downward light beam */}
          <linearGradient id="venueProjectorAtmosphere" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1ed760" stopOpacity="0.22" />
            <stop offset="40%" stopColor="#1ed760" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1ed760" stopOpacity="0.0" />
          </linearGradient>

          {/* 3D Screen Surface Gradient */}
          <linearGradient id="venueScreenBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="30%" stopColor="#9ca3af" stopOpacity="0.35" />
            <stop offset="85%" stopColor="#1f2937" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0.02" />
          </linearGradient>

          {/* Top Curved Illuminated Arc */}
          <linearGradient id="venueScreenTopArc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1ed760" stopOpacity="0.3" />
            <stop offset="15%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1ed760" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* 1. Downward Projector Light Spread */}
        <path
          d="M 50 35 Q 500 -5 950 35 L 980 90 Q 500 50 20 90 Z"
          fill="url(#venueProjectorAtmosphere)"
        />

        {/* 2. 3D Curved Screen Surface Body */}
        <path
          d="M 50 32 Q 500 2 950 32 L 935 62 Q 500 32 65 62 Z"
          fill="url(#venueScreenBodyGrad)"
        />

        {/* 3. High-Intensity Screen Top Curved Bevel Stroke */}
        <path
          d="M 50 32 Q 500 2 950 32"
          stroke="url(#venueScreenTopArc)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* 4. Bottom Perspective Lip */}
        <path
          d="M 65 62 Q 500 32 935 62"
          stroke="#4b5563"
          strokeWidth="1.5"
          strokeOpacity="0.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Screen Label */}
      <div className="-mt-2 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1ed760] shadow-sm shadow-[#1ed760]" />
        <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-[#b3b3b3] uppercase font-bold">
          {label}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-[#1ed760] shadow-sm shadow-[#1ed760]" />
      </div>
    </div>
  );
}

/**
 * Visual Vector Pitch / Stage / Screen Graphic Overlay
 * (All theatres, auditoriums, and venues use the 3D Curved Screen)
 */
export function VenuePitchVisual({ layoutType = 'cinema', venueName = 'Main Arena' }) {
  return <AuditoriumScreen3D label="SCREEN • AUDITORIUM" />;
}
