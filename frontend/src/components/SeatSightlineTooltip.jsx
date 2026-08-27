import React from 'react';
import { Sparkles, Eye, MapPin, Volume2 } from 'lucide-react';
import ThreeDSeatSightline from './ThreeDSeatSightline';

/**
 * Photorealistic First-Person 3D Seat Sightline / POV Hover Tooltip (WebGL Powered)
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
  const isNearTop = y < 250;
  const safeX = Math.max(160, Math.min(window.innerWidth - 160, x));
  const safeY = isNearTop ? y + 36 : y;
  const transformY = isNearTop ? 'translate(-50%, 0)' : 'translate(-50%, -100%)';

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
      className="w-80 bg-[#101012]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-white font-sans overflow-hidden"
    >
      {/* ─── Top Info Bar ─── */}
      <div className="flex items-center justify-between gap-1 text-[11px] pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-bold min-w-0">
          <span className="font-mono font-black text-white px-2 py-0.5 bg-[#222228] rounded-md text-xs border border-white/10">
            {label}
          </span>
          <span
            className="truncate font-bold max-w-[100px]"
            style={{ color: categoryColor || '#1ed760' }}
          >
            {categoryName}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* ─── Real 3D WebGL First-Person Seat Sightline Window (16:9) ─── */}
      <div className="relative h-36 w-full rounded-xl overflow-hidden bg-[#060608] border border-white/15 shadow-2xl flex items-center justify-center">
        {/* Real 3D WebGL Scene */}
        <ThreeDSeatSightline
          row={row}
          col={col}
          totalRows={totalRows}
          totalCols={totalCols}
          moviePoster={moviePoster}
          categoryName={categoryName}
          categoryColor={categoryColor}
        />

        {/* Live 3D POV Live Watermark Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/75 backdrop-blur-md rounded-md text-[9px] font-mono text-[#1ed760] border border-white/15 shadow-sm pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1ed760] animate-pulse" />
          <span className="font-black tracking-wider">3D SIGHTLINE POV</span>
        </div>

        {/* Distance Badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/75 backdrop-blur-md rounded-md text-[9px] font-mono text-[#b3b3b3] border border-white/15 pointer-events-none">
          {distanceMeters}m to screen
        </div>

        {/* Sightline Sweet-Spot Indicator */}
        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2.5 py-1 bg-black/85 backdrop-blur-md rounded-lg text-[9px] border border-white/15 pointer-events-none shadow-md">
          <div className="flex items-center gap-1.5 text-[#1ed760] font-bold">
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
          {Math.abs(panAngle) < 3 ? '0° Direct Center Axis' : `${panAngle > 0 ? 'Right' : 'Left'} ${Math.abs(panAngle).toFixed(0)}° Angle`}
        </span>
      </div>
    </div>
  );
}
