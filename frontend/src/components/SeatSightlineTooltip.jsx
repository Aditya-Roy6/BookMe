import React from 'react';
import { Sparkles, Eye, MapPin, Volume2 } from 'lucide-react';

/**
 * Photorealistic First-Person Seat Sightline / POV Hover Tooltip
 * Dynamically computes 3D perspective angle, screen curvature, distance and elevation based on seat coordinates.
 */
export default function SeatSightlineTooltip({ tooltip }) {
  if (!tooltip) return null;

  const {
    x,
    y,
    label,
    categoryName = 'Prime Club',
    categoryColor = '#1ed760',
    price,
    status = 'Available',
    isSelected,
    isUnavailable,
    row = 1,
    col = 1,
    totalRows = 8,
    totalCols = 14,
    isRecliner = false,
    moviePoster,
    eventTitle = 'Feature Presentation',
    venueType = 'movie',
  } = tooltip;

  // Compute 3D Sightline Geometry
  const colPercent = totalCols > 1 ? (col - 1) / (totalCols - 1) : 0.5; // 0 (left) -> 0.5 (center) -> 1.0 (right)
  const panAngle = (colPercent - 0.5) * 32; // -16 deg (left) to +16 deg (right)
  const rowPercent = totalRows > 1 ? (row - 1) / (totalRows - 1) : 0.5; // 0 (front) to 1.0 (back)

  const distanceMeters = (7.5 + row * 1.6).toFixed(1);
  const isCenterSweetSpot = Math.abs(colPercent - 0.5) <= 0.18;
  const isPrimeRows = row >= 2 && row <= Math.ceil(totalRows * 0.7);

  let sightlineTag = 'Standard Sightline';
  let sightlineScore = '92%';
  if (isCenterSweetSpot && isPrimeRows) {
    sightlineTag = 'Dolby Atmos Sweet-Spot';
    sightlineScore = '99%';
  } else if (isCenterSweetSpot) {
    sightlineTag = 'Direct Center View';
    sightlineScore = '96%';
  } else if (Math.abs(colPercent - 0.5) <= 0.32) {
    sightlineTag = 'Optimal Angle';
    sightlineScore = '94%';
  } else {
    sightlineTag = 'Wide Wing Perspective';
    sightlineScore = '89%';
  }

  // Safe viewport positioning (flips below seat if too close to top bar)
  const isNearTop = y < 240;
  const safeX = Math.max(150, Math.min(window.innerWidth - 150, x));
  const safeY = isNearTop ? y + 36 : y;
  const transformY = isNearTop ? 'translate(-50%, 0)' : 'translate(-50%, -100%)';

  const defaultBackdrop =
    moviePoster ||
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';

  return (
    <div
      style={{
        position: 'fixed',
        left: `${safeX}px`,
        top: `${safeY}px`,
        transform: transformY,
        pointerEvents: 'none',
        zIndex: 99999,
      }}
      className="w-72 bg-[#121214]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 text-white font-sans overflow-hidden"
    >
      {/* ─── Top Info Bar ─── */}
      <div className="flex items-center justify-between gap-1 text-[11px] pb-1.5 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-bold min-w-0">
          <span className="font-mono font-black text-white px-1.5 py-0.5 bg-[#222226] rounded-md text-xs border border-white/10">
            {label}
          </span>
          <span
            className="truncate font-bold max-w-[90px]"
            style={{ color: categoryColor || '#1ed760' }}
          >
            {categoryName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {price && (
            <span className="font-mono font-black text-[#1ed760] text-xs">
              ₹{price}
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              isSelected
                ? 'bg-[#1ed760] text-black'
                : isUnavailable
                ? 'bg-[#282828] text-[#7c7c7c]'
                : 'bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/30'
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* ─── 3D First-Person Seat Sightline Window (16:9) ─── */}
      <div className="relative h-32 w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner flex items-center justify-center">
        {/* Cinema / Stadium Perspective Horizon */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
          style={{
            perspective: '400px',
            transform: `perspective(400px) rotateY(${panAngle * -0.75}deg) scale(${
              1.08 - rowPercent * 0.28
            })`,
          }}
        >
          {/* 3D Curved Cinema Screen Frame */}
          <div className="relative w-56 h-28 rounded-lg overflow-hidden border border-white/20 shadow-[0_0_25px_rgba(30,215,96,0.3)] bg-[#050508]">
            <img
              src={defaultBackdrop}
              alt="Screen View"
              className="w-full h-full object-cover opacity-85 brightness-105 contrast-110"
            />
            {/* Ambient Projector Beam Reflection Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10" />
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#1ed760] to-transparent opacity-90 blur-[1px]" />
          </div>
        </div>

        {/* Ambient Dark Theatre Sidewalls with Atmospheric Light */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black via-black/70 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black via-black/70 to-transparent pointer-events-none" />

        {/* Foreground: Previous Row Seat Silhouettes (For immersion from back/middle rows) */}
        {row > 1 && (
          <div className="absolute -bottom-1 inset-x-0 flex justify-center gap-2 opacity-40 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-3.5 bg-[#0a0a0c] rounded-t-md border-t border-white/10"
              />
            ))}
          </div>
        )}

        {/* Foreground: Recliner Armrest / Headrest Silhouette if VIP Recliner */}
        {isRecliner && (
          <div className="absolute -bottom-2 inset-x-4 flex justify-between opacity-50 pointer-events-none">
            <div className="w-6 h-5 bg-[#18181b] rounded-t-lg border-t border-white/15" />
            <div className="w-6 h-5 bg-[#18181b] rounded-t-lg border-t border-white/15" />
          </div>
        )}

        {/* Live POV Live Watermark Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded-md text-[9px] font-mono text-[#1ed760] border border-white/10 shadow-sm">
          <Eye className="w-2.5 h-2.5 text-[#1ed760]" />
          <span className="font-bold">LIVE POV VIEW</span>
        </div>

        {/* Distance Badge */}
        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded-md text-[9px] font-mono text-[#b3b3b3] border border-white/10">
          {distanceMeters}m to screen
        </div>

        {/* Sightline Sweet-Spot Indicator */}
        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[9px] border border-white/10">
          <div className="flex items-center gap-1 text-[#1ed760] font-bold">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{sightlineTag}</span>
          </div>
          <span className="font-mono font-bold text-white">{sightlineScore}</span>
        </div>
      </div>

      {/* ─── Bottom Sightline Specs Strip ─── */}
      <div className="flex items-center justify-between text-[10px] text-[#7c7c7c] font-mono px-0.5">
        <span>Row {row} &bull; Col {col}</span>
        <span className="text-[#b3b3b3]">
          {Math.abs(panAngle) < 3 ? '0° Direct Center' : `${panAngle > 0 ? 'Right' : 'Left'} ${Math.abs(panAngle).toFixed(0)}° Angle`}
        </span>
      </div>
    </div>
  );
}
