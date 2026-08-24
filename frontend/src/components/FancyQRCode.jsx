import React, { useState } from 'react';
import QRCode from 'qrcode';

/**
 * FancyQRCode - Renders an ultra-modern QR Code with:
 * - Rounded circular dot matrix (instead of harsh square blocks)
 * - Rounded corner finder eyes (smooth stadium corners)
 * - Centered circular movie/concert image badge with Spotify green ring
 */
export default function FancyQRCode({
  value = 'LMTX-BOOKING-REF',
  imageUrl = '',
  size = 200,
  dotColor = '#000000',
  eyeColor = '#000000',
  ringColor = '#1ed760',
  bgColor = '#ffffff',
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  // 1. Generate QR module matrix with High Error Correction (30% recovery)
  let qrMatrix = null;
  try {
    qrMatrix = QRCode.create(value || 'LMTX-PASS', { errorCorrectionLevel: 'H' });
  } catch (err) {
    console.error('Failed to create QR matrix:', err);
    return null;
  }

  const moduleCount = qrMatrix.modules.size;
  const cellSize = 10;
  const padding = 2; // quiet zone in cells
  const totalCells = moduleCount + padding * 2;
  const svgSize = totalCells * cellSize;

  // 2. Helper to check if a cell is inside the 3 finder patterns
  const isFinder = (r, c) => {
    // Top-Left
    if (r < 7 && c < 7) return true;
    // Top-Right
    if (r < 7 && c >= moduleCount - 7) return true;
    // Bottom-Left
    if (r >= moduleCount - 7 && c < 7) return true;
    return false;
  };

  // 3. Helper to check if a cell is in the central logo cutout
  const centerModule = Math.floor(moduleCount / 2);
  const logoCellRadius = Math.ceil(moduleCount * 0.16); // ~25% radius in module cells
  const isCenter = (r, c) => {
    const dr = r - centerModule;
    const dc = c - centerModule;
    return Math.sqrt(dr * dr + dc * dc) <= logoCellRadius + 0.4;
  };

  // 4. Center coordinates in pixels
  const centerPx = (centerModule + padding + 0.5) * cellSize;
  const logoRadiusPx = (logoCellRadius + 0.3) * cellSize;

  // 5. Build circular data dots
  const dots = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinder(r, c) || isCenter(r, c)) continue;
      if (qrMatrix.modules.get(r, c)) {
        const cx = (c + padding + 0.5) * cellSize;
        const cy = (r + padding + 0.5) * cellSize;
        dots.push(
          <circle
            key={`dot-${r}-${c}`}
            cx={cx}
            cy={cy}
            r={cellSize * 0.43}
            fill={dotColor}
          />
        );
      }
    }
  }

  // 6. Finder eye corner coordinates
  const finders = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 },
  ];

  const logoPercentage = ((logoRadiusPx * 2) / svgSize) * 100;

  return (
    <div
      className={`fancy-qr-pass-container relative inline-flex items-center justify-center p-2 rounded-2xl bg-white shadow-sm select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="w-full h-full block"
        style={{ shapeRendering: 'geometricPrecision' }}
      >
        {/* Background */}
        <rect width={svgSize} height={svgSize} fill={bgColor} rx={cellSize * 1.5} />

        {/* Data Modules: Rounded Circular Dots */}
        {dots}

        {/* 3 Corner Finder Eyes: Smooth Rounded Frames */}
        {finders.map(({ r, c }, idx) => {
          const fx = (c + padding) * cellSize;
          const fy = (r + padding) * cellSize;
          const outerSize = 7 * cellSize;
          const innerOffset = 2 * cellSize;
          const innerSize = 3 * cellSize;

          return (
            <g key={`finder-${idx}`}>
              {/* Outer Rounded Frame */}
              <rect
                x={fx + cellSize * 0.45}
                y={fy + cellSize * 0.45}
                width={outerSize - cellSize * 0.9}
                height={outerSize - cellSize * 0.9}
                rx={cellSize * 1.8}
                fill="none"
                stroke={eyeColor}
                strokeWidth={cellSize * 0.9}
              />
              {/* Inner Rounded Pupil Dot */}
              <rect
                x={fx + innerOffset}
                y={fy + innerOffset}
                width={innerSize}
                height={innerSize}
                rx={cellSize * 0.9}
                fill={eyeColor}
              />
            </g>
          );
        })}

        {/* Center Circular White Plate */}
        <circle
          cx={centerPx}
          cy={centerPx}
          r={logoRadiusPx + 2}
          fill="#ffffff"
          stroke={ringColor}
          strokeWidth="2.5"
        />
      </svg>

      {/* Bulletproof Centered Movie/Event Artwork Badge */}
      <div
        className="absolute rounded-full overflow-hidden flex items-center justify-center shadow-sm"
        style={{
          width: `${logoPercentage}%`,
          height: `${logoPercentage}%`,
          border: `2px solid ${ringColor}`,
          backgroundColor: '#ffffff',
        }}
      >
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt="Event Poster"
            className="w-full h-full object-cover rounded-full"
            crossOrigin="anonymous"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-[#1ed760] flex items-center justify-center rounded-full text-black font-black text-sm">
            🎟️
          </div>
        )}
      </div>
    </div>
  );
}
