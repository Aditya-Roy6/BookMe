import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ScrollShadow,
} from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TTLTimer from '../components/TTLTimer';
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Volume2,
  Sparkles,
  ShieldCheck,
  Play,
  X,
} from 'lucide-react';
import { VenuePitchVisual, resolveLayoutType } from '../components/SportsVenueLayouts';

// ─── Normal SVG Seat Icon (Using Exact public/normal seats.svg) ───

export function NormalSeatSvg({ status, isHeldByMe, isSelected, col, isRotated = true, color, categoryColor }) {
  let fill = '#1f1f1f';
  let stroke = categoryColor || color || '#383838';
  let textFill = '#b3b3b3';

  if (status === 'booked') {
    fill = '#121212';
    stroke = '#222222';
    textFill = '#404040';
  } else if (isSelected) {
    fill = '#1ed760';
    stroke = '#1ed760';
    textFill = '#000000';
  } else if (isHeldByMe) {
    fill = '#1db954';
    stroke = '#1ed760';
    textFill = '#000000';
  } else if (status === 'held') {
    fill = '#282828';
    stroke = '#ffa42b';
    textFill = '#ffa42b';
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full pointer-events-none overflow-visible" fill="none">
      {/* Turned Around: Headrest at bottom, Cushion at top facing the Screen / Stage */}
      <g transform={isRotated ? 'rotate(180 50 50)' : undefined}>
        <rect x="20" y="15" width="60" height="25" rx="10" fill={fill} stroke={stroke} strokeWidth="2.5" />
        <rect x="25" y="45" width="50" height="40" rx="8" fill={fill} stroke={stroke} strokeWidth="2.5" />
        <rect x="8" y="30" width="12" height="50" rx="6" fill={fill} stroke={stroke} strokeWidth="2.5" />
        <rect x="80" y="30" width="12" height="50" rx="6" fill={fill} stroke={stroke} strokeWidth="2.5" />
      </g>
      {/* Seat Number kept upright inside Cushion */}
      {col !== undefined && (
        <text
          x="50"
          y="42"
          textAnchor="middle"
          fill={textFill}
          fontSize="24"
          fontWeight="800"
          fontFamily='ui-sans-serif, system-ui, sans-serif'
        >
          {col}
        </text>
      )}
    </svg>
  );
}

// ─── Recliner SVG Seat Icon (Using Exact public/recliner seats.svg) ───

export function ReclinerSeatSvg({ status, isHeldByMe, isSelected, col, isRotated = true, color, categoryColor }) {
  let fill = '#242424';
  let stroke = categoryColor || color || '#ffa42b';
  let textFill = '#ffffff';
  let cupFill = '#b3b3b3';

  if (status === 'booked') {
    fill = '#121212';
    stroke = '#222222';
    textFill = '#404040';
    cupFill = '#333333';
  } else if (isSelected) {
    fill = '#1ed760';
    stroke = '#1ed760';
    textFill = '#000000';
    cupFill = '#000000';
  } else if (isHeldByMe) {
    fill = '#1db954';
    stroke = '#1ed760';
    textFill = '#000000';
    cupFill = '#000000';
  } else if (status === 'held') {
    fill = '#282828';
    stroke = '#ffa42b';
    textFill = '#ffa42b';
    cupFill = '#ffa42b';
  }

  return (
    <svg viewBox="0 0 100 140" className="w-full h-full pointer-events-none overflow-visible" fill="none">
      <g transform={isRotated ? 'rotate(180 50 70)' : undefined}>
        <rect x="15" y="5" width="70" height="35" rx="12" fill={fill} stroke={stroke} strokeWidth="3" />
        <rect x="22" y="45" width="56" height="42" rx="8" fill={fill} stroke={stroke} strokeWidth="3" />
        <rect x="25" y="92" width="50" height="38" rx="8" fill={fill} stroke={stroke} strokeWidth="3" />
        <rect x="6" y="25" width="14" height="70" rx="7" fill={fill} stroke={stroke} strokeWidth="3" />
        <rect x="80" y="25" width="14" height="70" rx="7" fill={fill} stroke={stroke} strokeWidth="3" />
        <circle cx="13" cy="82" r="4" fill={cupFill} />
        <circle cx="87" cy="82" r="4" fill={cupFill} />
      </g>
      {col !== undefined && (
        <text
          x="50"
          y="74"
          textAnchor="middle"
          fill={textFill}
          fontSize="24"
          fontWeight="800"
          fontFamily='ui-sans-serif, system-ui, sans-serif'
        >
          {col}
        </text>
      )}
    </svg>
  );
}

// ─── Surround Sound Speaker Unit ───

export function LeftSpeakerWave() {
  return (
    <div className="flex items-center gap-1.5 opacity-70 select-none pointer-events-none">
      <div className="w-3 h-10 bg-[#1f1f1f] border border-[#333333] flex flex-col items-center justify-center p-0.5 rounded-sm">
        <div className="w-1.5 h-1.5 bg-[#1ed760] mb-1 rounded-full" />
        <div className="w-1.5 h-2.5 bg-[#333333]" />
      </div>
      <svg width="18" height="36" viewBox="0 0 18 36" fill="none" className="overflow-visible">
        <path d="M 3 12 A 8 8 0 0 1 3 24" stroke="#1ed760" strokeWidth="1.5" strokeLinecap="round" className="atmos-wave-1" />
        <path d="M 9 7 A 14 14 0 0 1 9 29" stroke="#539df5" strokeWidth="1.5" strokeLinecap="round" className="atmos-wave-2" />
        <path d="M 15 2 A 20 20 0 0 1 15 34" stroke="#b3b3b3" strokeWidth="1.2" strokeLinecap="round" className="atmos-wave-3" />
      </svg>
    </div>
  );
}

export function RightSpeakerWave() {
  return (
    <div className="flex items-center gap-1.5 opacity-70 select-none pointer-events-none flex-row-reverse">
      <div className="w-3 h-10 bg-[#1f1f1f] border border-[#333333] flex flex-col items-center justify-center p-0.5 rounded-sm">
        <div className="w-1.5 h-1.5 bg-[#1ed760] mb-1 rounded-full" />
        <div className="w-1.5 h-2.5 bg-[#333333]" />
      </div>
      <svg width="18" height="36" viewBox="0 0 18 36" fill="none" className="overflow-visible">
        <path d="M 15 12 A 8 8 0 0 0 15 24" stroke="#1ed760" strokeWidth="1.5" strokeLinecap="round" className="atmos-wave-1" />
        <path d="M 9 7 A 14 14 0 0 0 9 29" stroke="#539df5" strokeWidth="1.5" strokeLinecap="round" className="atmos-wave-2" />
        <path d="M 3 2 A 20 20 0 0 0 3 34" stroke="#b3b3b3" strokeWidth="1.2" strokeLinecap="round" className="atmos-wave-3" />
      </svg>
    </div>
  );
}

// ─── Aisle Stairs Graphic for Theatre Walkways ───

export function AisleStairsGraphic({ label }) {
  return (
    <div className="w-8 sm:w-12 flex flex-col items-center justify-center select-none pointer-events-none px-1">
      <div className="w-full flex flex-col gap-1 items-center opacity-40">
        <div className="w-full h-[1.5px] bg-[#7c7c7c]" />
        <div className="w-2/3 h-[1.5px] bg-[#4d4d4d]" />
        <div className="w-full h-[1.5px] bg-[#7c7c7c]" />
        <div className="w-2/3 h-[1.5px] bg-[#4d4d4d]" />
      </div>
      {label && (
        <span className="text-[8px] font-mono tracking-widest text-[#7c7c7c] uppercase mt-0.5 font-bold">
          {label}
        </span>
      )}
    </div>
  );
}

// ─── 3D Curved Perspective Cinema Screen ───

export function AuditoriumScreen3D() {
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
          <linearGradient id="projectorAtmosphere" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1ed760" stopOpacity="0.22" />
            <stop offset="40%" stopColor="#1ed760" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1ed760" stopOpacity="0.0" />
          </linearGradient>

          {/* 3D Screen Surface Gradient */}
          <linearGradient id="screenBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="30%" stopColor="#9ca3af" stopOpacity="0.35" />
            <stop offset="85%" stopColor="#1f2937" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0.02" />
          </linearGradient>

          {/* Top Curved Illuminated Arc */}
          <linearGradient id="screenTopArc" x1="0" y1="0" x2="1" y2="0">
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
          fill="url(#projectorAtmosphere)"
        />

        {/* 2. 3D Curved Screen Surface Body */}
        <path
          d="M 50 32 Q 500 2 950 32 L 935 62 Q 500 32 65 62 Z"
          fill="url(#screenBodyGrad)"
        />

        {/* 3. High-Intensity Screen Top Curved Bevel Stroke */}
        <path
          d="M 50 32 Q 500 2 950 32"
          stroke="url(#screenTopArc)"
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
          SCREEN &bull; AUDITORIUM
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-[#1ed760] shadow-sm shadow-[#1ed760]" />
      </div>
    </div>
  );
}

// ─── 360° Circular Stadium Arena (Dark Aesthetics) ───

function CircularStadiumMap({
  rowsMap,
  sortedRows,
  selectedSeatIds,
  handleSeatClick,
}) {
  const svgSize = 1240;
  const center = svgSize / 2;
  const innerRadius = 175;
  const rowSpacing = 46;
  const numSectors = 4;
  const sectorNames = [
    'NORTH STAND • SEC 101',
    'EAST GRANDSTAND • SEC 102',
    'SOUTH PAVILION • SEC 103',
    'WEST GRANDSTAND • SEC 104',
  ];

  const stairAisleAngle = 0.08;

  return (
    <div className="w-full flex flex-col items-center justify-center relative select-none py-2 overflow-hidden bg-[#121212]">
      <div className="relative w-full max-w-5xl aspect-square flex items-center justify-center">
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="w-full h-full max-w-[980px] overflow-visible"
        >
          {/* Outer Arena Boundary Track */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius + (sortedRows.length + 0.8) * rowSpacing}
            fill="#121212"
            stroke="#282828"
            strokeWidth="2"
          />

          {/* 4 Staircase Aisle Walkway Corridors Radiating Outward */}
          {Array.from({ length: numSectors }).map((_, sIdx) => {
            const stairCenterAngle = (sIdx / numSectors) * 2 * Math.PI - Math.PI / 2;
            const outerR = innerRadius + (sortedRows.length + 0.6) * rowSpacing;

            const x1 = center + (innerRadius - 15) * Math.cos(stairCenterAngle);
            const y1 = center + (innerRadius - 15) * Math.sin(stairCenterAngle);
            const x2 = center + outerR * Math.cos(stairCenterAngle);
            const y2 = center + outerR * Math.sin(stairCenterAngle);

            return (
              <g key={`stair-aisle-${sIdx}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#181818"
                  strokeWidth="20"
                  strokeDasharray="2 4"
                />
                {sortedRows.map((_, rIdx) => {
                  const stepR = innerRadius + rIdx * rowSpacing;
                  const sx = center + stepR * Math.cos(stairCenterAngle);
                  const sy = center + stepR * Math.sin(stairCenterAngle);
                  const deg = (stairCenterAngle * 180) / Math.PI + 90;
                  return (
                    <line
                      key={`step-${sIdx}-${rIdx}`}
                      x1={sx - 10}
                      y1={sy}
                      x2={sx + 10}
                      y2={sy}
                      stroke="#4d4d4d"
                      strokeWidth="1.5"
                      transform={`rotate(${deg} ${sx} ${sy})`}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Concentric Tier Guide Rings */}
          {sortedRows.map((rowNum, idx) => {
            const radius = innerRadius + idx * rowSpacing;
            return (
              <circle
                key={`tier-ring-${rowNum}`}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#1f1f1f"
                strokeWidth="1.2"
                strokeDasharray="4 6"
              />
            );
          })}

          {/* Center Stage Platform */}
          <g transform={`translate(${center - 45}, ${center - 45})`}>
            <polygon
              points="45,0 90,26 90,78 45,104 0,78 0,26"
              fill="#181818"
              stroke="#1ed760"
              strokeWidth="2.5"
              className="drop-shadow-lg"
            />
            <text
              x="45"
              y="48"
              textAnchor="middle"
              fill="#1ed760"
              fontSize="12"
              fontWeight="900"
              fontFamily="CircularSp, sans-serif"
              letterSpacing="2"
            >
              STAGE
            </text>
            <text
              x="45"
              y="63"
              textAnchor="middle"
              fill="#b3b3b3"
              fontSize="8"
              fontWeight="700"
              fontFamily="CircularSp, sans-serif"
            >
              CENTER 360°
            </text>
          </g>

          {/* Curved Sector Arc Definition Paths */}
          <defs>
            {sectorNames.map((_, sIdx) => {
              const labelR = innerRadius + (sortedRows.length + 0.45) * rowSpacing;
              let a1, a2, sweep;
              if (sIdx === 0) {
                // North (Top)
                a1 = -Math.PI * 0.70;
                a2 = -Math.PI * 0.30;
                sweep = 1;
              } else if (sIdx === 1) {
                // East (Right)
                a1 = -Math.PI * 0.20;
                a2 = Math.PI * 0.20;
                sweep = 1;
              } else if (sIdx === 2) {
                // South (Bottom - Draw Right-to-Left so text is upright)
                a1 = Math.PI * 0.70;
                a2 = Math.PI * 0.30;
                sweep = 0;
              } else {
                // West (Left - Draw Top-to-Bottom inverted so text is upright)
                a1 = -Math.PI * 0.80;
                a2 = -Math.PI * 1.20;
                sweep = 0;
              }

              const x1 = center + labelR * Math.cos(a1);
              const y1 = center + labelR * Math.sin(a1);
              const x2 = center + labelR * Math.cos(a2);
              const y2 = center + labelR * Math.sin(a2);

              return (
                <path
                  key={`sec-arc-path-${sIdx}`}
                  id={`sec-arc-path-${sIdx}`}
                  d={`M ${x1} ${y1} A ${labelR} ${labelR} 0 0 ${sweep} ${x2} ${y2}`}
                  fill="none"
                />
              );
            })}
          </defs>

          {/* Curved Sector Text Along Outer Arena Rim */}
          {sectorNames.map((name, sIdx) => (
            <text
              key={`sec-curved-label-${sIdx}`}
              fill="#b3b3b3"
              fontSize="12"
              fontWeight="900"
              fontFamily="CircularSp, -apple-system, BlinkMacSystemFont, sans-serif"
              letterSpacing="2.5"
            >
              <textPath
                href={`#sec-arc-path-${sIdx}`}
                startOffset="50%"
                textAnchor="middle"
              >
                {name}
              </textPath>
            </text>
          ))}

          {/* Fully Packed Solid Circular Seating Tiers with Tight Seat Spacing */}
          {sortedRows.map((rowNum, rowIndex) => {
            const rowSeats = rowsMap.get(rowNum) || [];
            const radius = innerRadius + rowIndex * rowSpacing;
            const totalCols = rowSeats.length;
            const seatsPerSector = Math.ceil(totalCols / numSectors);

            // Dynamic seat scale: larger in outer tiers so there are no empty voids
            const seatScale = Math.min(0.56, 0.40 + (rowIndex * 0.016));

            return (
              <g key={`row-tier-${rowNum}`}>
                {rowSeats.map((seat, colIdx) => {
                  const isSelected = selectedSeatIds.includes(seat.id);
                  const isHeldByMe = seat.isHeldByMe;
                  const isHeld = seat.status === 'held' && !isHeldByMe;
                  const isBooked = seat.status === 'booked';

                  const sIdx = Math.min(Math.floor(colIdx / seatsPerSector), numSectors - 1);
                  const startCol = sIdx * seatsPerSector;
                  const endCol = Math.min(totalCols, (sIdx + 1) * seatsPerSector);
                  const sCount = Math.max(1, endCol - startCol);
                  const sCol = colIdx - startCol;

                  const sStart = (sIdx / numSectors) * 2 * Math.PI - Math.PI / 2 + stairAisleAngle / 2;
                  const sArc = (2 * Math.PI / numSectors) - stairAisleAngle;
                  const seatAngle = sStart + ((sCol + 0.5) / sCount) * sArc;

                  const x = center + radius * Math.cos(seatAngle);
                  const y = center + radius * Math.sin(seatAngle);
                  const rotationDeg = (seatAngle * 180) / Math.PI + 90;

                  let seatFill = '#1f1f1f';
                  let seatStroke = '#383838';
                  let textColor = '#b3b3b3';

                  if (isBooked) {
                    seatFill = '#121212';
                    seatStroke = '#222222';
                    textColor = '#333333';
                  } else if (isSelected) {
                    seatFill = '#1ed760';
                    seatStroke = '#1ed760';
                    textColor = '#000000';
                  } else if (isHeldByMe) {
                    seatFill = '#1db954';
                    seatStroke = '#1ed760';
                    textColor = '#000000';
                  } else if (isHeld) {
                    seatFill = '#282828';
                    seatStroke = '#ffa42b';
                    textColor = '#ffa42b';
                  }

                  return (
                    <g
                      key={seat.id}
                      transform={`translate(${x}, ${y}) rotate(${rotationDeg})`}
                      className={isBooked || isHeld ? 'cursor-not-allowed' : 'cursor-pointer'}
                      onClick={() => !isBooked && !isHeld && handleSeatClick(seat)}
                    >
                      <g transform={`translate(-${seatScale * 50}, -${seatScale * 50}) scale(${seatScale})`}>
                        <g transform="rotate(180 50 50)">
                          <rect x="20" y="15" width="60" height="25" rx="10" fill={seatFill} stroke={seatStroke} strokeWidth="3" />
                          <rect x="25" y="45" width="50" height="40" rx="8" fill={seatFill} stroke={seatStroke} strokeWidth="3" />
                          <rect x="8" y="30" width="12" height="50" rx="6" fill={seatFill} stroke={seatStroke} strokeWidth="3" />
                          <rect x="80" y="30" width="12" height="50" rx="6" fill={seatFill} stroke={seatStroke} strokeWidth="3" />
                        </g>
                        <text
                          x="50"
                          y="42"
                          textAnchor="middle"
                          fill={textColor}
                          fontSize="22"
                          fontWeight="800"
                          fontFamily='sans-serif'
                        >
                          {seat.col}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="text-[11px] font-mono text-[#b3b3b3] uppercase mt-4 tracking-wider">
        360° STADIUM ARENA &bull; 4 GRANDSTAND SECTORS &bull; FULLY PACKED SEATING BOWL
      </div>
    </div>
  );
}

// ─── Main Full Page Seat Selection Component ───


// ─── Freeform Customer Floorplan Component ───

export function FreeformCustomerFloorplan({
  showtime,
  seats,
  selectedSeatIds,
  handleSeatClick,
  handleSeatMouseEnter,
  handleSeatMouseLeave,
}) {
  const layoutData = showtime?.layoutData || {};
  const elements = layoutData.elements || [];

  const validSeats = seats.filter((s) => typeof s.x === 'number' && typeof s.y === 'number');
  const minX = validSeats.length > 0 ? Math.min(...validSeats.map((s) => s.x)) - 100 : 0;
  const maxX = validSeats.length > 0 ? Math.max(...validSeats.map((s) => s.x)) + 100 : 1400;
  const minY = validSeats.length > 0 ? Math.min(...validSeats.map((s) => s.y)) - 120 : 0;
  const maxY = validSeats.length > 0 ? Math.max(...validSeats.map((s) => s.y)) + 100 : 900;

  const width = Math.max(1000, maxX - minX);
  const height = Math.max(700, maxY - minY);
  const viewBox = `${minX} ${minY} ${width} ${height}`;

  return (
    <div className="w-full flex flex-col items-center justify-center relative select-none py-4 overflow-hidden bg-[#121212]">
      <div className="w-full max-w-6xl overflow-x-auto pb-6 flex justify-center">
        <svg
          viewBox={viewBox}
          className="w-full h-auto min-w-[780px] max-w-[1100px] overflow-visible"
        >
          {/* 1. Architectural Elements */}
          {elements.map((el) => {
            if (el.type === 'stage') {
              return (
                <g key={el.id}>
                  <defs>
                    <linearGradient id={`custStageGrad_${el.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1ed760" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#1ed760" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M ${el.x - el.width / 2} ${el.y} Q ${el.x} ${el.y - (el.curvature || 40)} ${
                      el.x + el.width / 2
                    } ${el.y}`}
                    fill="none"
                    stroke="#1ed760"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${el.x - el.width / 2} ${el.y} Q ${el.x} ${el.y - (el.curvature || 40)} ${
                      el.x + el.width / 2
                    } ${el.y} L ${el.x + el.width / 2} ${el.y + (el.height || 40)} L ${
                      el.x - el.width / 2
                    } ${el.y + (el.height || 40)} Z`}
                    fill={`url(#custStageGrad_${el.id})`}
                    opacity="0.3"
                  />
                  <text
                    x={el.x}
                    y={el.y + 24}
                    textAnchor="middle"
                    fill="#1ed760"
                    fontSize="12"
                    fontWeight="900"
                    fontFamily="sans-serif"
                    letterSpacing="2"
                  >
                    {el.label || 'MAIN STAGE / SCREEN'}
                  </text>
                </g>
              );
            }

            if (el.type === 'zone') {
              return (
                <g key={el.id}>
                  {el.shape === 'circle' ? (
                    <circle
                      cx={el.x}
                      cy={el.y}
                      r={el.radius || 70}
                      fill={el.color || '#1ed760'}
                      fillOpacity="0.12"
                      stroke={el.color || '#1ed760'}
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  ) : (
                    <rect
                      x={el.x - (el.width || 200) / 2}
                      y={el.y - (el.height || 100) / 2}
                      width={el.width || 200}
                      height={el.height || 100}
                      rx="12"
                      fill={el.color || '#f59e0b'}
                      fillOpacity="0.1"
                      stroke={el.color || '#f59e0b'}
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  )}
                  <text
                    x={el.x}
                    y={el.y + 4}
                    textAnchor="middle"
                    fill={el.color || '#ffffff'}
                    fontSize="12"
                    fontWeight="800"
                    fontFamily="sans-serif"
                  >
                    {el.label}
                  </text>
                </g>
              );
            }

            if (el.type === 'line') {
              return (
                <g key={el.id}>
                  <line
                    x1={el.x1}
                    y1={el.y1}
                    x2={el.x2}
                    y2={el.y2}
                    stroke="#282838"
                    strokeWidth="18"
                    strokeDasharray="2 4"
                    strokeLinecap="round"
                  />
                  <text
                    x={(el.x1 + el.x2) / 2}
                    y={(el.y1 + el.y2) / 2 - 10}
                    textAnchor="middle"
                    fill="#7c7c88"
                    fontSize="9"
                    fontWeight="700"
                  >
                    {el.label}
                  </text>
                </g>
              );
            }

            if (el.type === 'label') {
              return (
                <text
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  fill={el.color || '#b3b3b3'}
                  fontSize={el.fontSize || 14}
                  fontWeight="800"
                  fontFamily="sans-serif"
                >
                  {el.text}
                </text>
              );
            }

            return null;
          })}

          {/* 2. Interactive Freeform Seats */}
          {seats.map((seat) => {
            if (typeof seat.x !== 'number' || typeof seat.y !== 'number') return null;

            const isSelected = selectedSeatIds.includes(seat.id);
            const isHeldByMe = seat.isHeldByMe;
            const isHeld = seat.status === 'held' && !isHeldByMe;
            const isBooked = seat.status === 'booked';
            const isRecliner = seat.isRecliner;

            return (
              <g
                key={seat.id}
                transform={`translate(${seat.x}, ${seat.y}) rotate(${seat.rotation || 0})`}
                onClick={() => !isBooked && !isHeld && handleSeatClick(seat)}
                onMouseEnter={(e) => handleSeatMouseEnter(e, seat)}
                onMouseLeave={handleSeatMouseLeave}
                className={`cursor-pointer transition-transform duration-150 ${
                  isBooked || isHeld ? 'opacity-40 cursor-not-allowed' : 'hover:scale-130'
                }`}
              >
                {/* Selection Aura */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="0"
                    r={isRecliner ? '24' : '18'}
                    fill="#1ed760"
                    fillOpacity="0.35"
                    stroke="#1ed760"
                    strokeWidth="2"
                  />
                )}

                <g transform="translate(-16, -16) scale(0.32)">
                  <g transform="rotate(180 50 50)">
                    <rect
                      x="20"
                      y="15"
                      width="60"
                      height="25"
                      rx="10"
                      fill={isBooked ? '#121212' : isSelected ? '#1ed760' : isHeldByMe ? '#1db954' : isHeld ? '#282828' : '#181820'}
                      stroke={isBooked ? '#222222' : isSelected ? '#1ed760' : isHeld ? '#ffa42b' : seat.categoryColor || '#38bdf8'}
                      strokeWidth="4"
                    />
                    <rect
                      x="25"
                      y="45"
                      width="50"
                      height="40"
                      rx="8"
                      fill={isBooked ? '#121212' : isSelected ? '#1ed760' : isHeldByMe ? '#1db954' : isHeld ? '#282828' : '#181820'}
                      stroke={isBooked ? '#222222' : isSelected ? '#1ed760' : isHeld ? '#ffa42b' : seat.categoryColor || '#38bdf8'}
                      strokeWidth="4"
                    />
                    <rect
                      x="8"
                      y="30"
                      width="12"
                      height="50"
                      rx="6"
                      fill={isBooked ? '#121212' : isSelected ? '#1ed760' : isHeldByMe ? '#1db954' : isHeld ? '#282828' : '#181820'}
                      stroke={isBooked ? '#222222' : isSelected ? '#1ed760' : isHeld ? '#ffa42b' : seat.categoryColor || '#38bdf8'}
                      strokeWidth="4"
                    />
                    <rect
                      x="80"
                      y="30"
                      width="12"
                      height="50"
                      rx="6"
                      fill={isBooked ? '#121212' : isSelected ? '#1ed760' : isHeldByMe ? '#1db954' : isHeld ? '#282828' : '#181820'}
                      stroke={isBooked ? '#222222' : isSelected ? '#1ed760' : isHeld ? '#ffa42b' : seat.categoryColor || '#38bdf8'}
                      strokeWidth="4"
                    />
                  </g>
                  <text
                    x="50"
                    y="42"
                    textAnchor="middle"
                    fill={isSelected || isHeldByMe ? '#000000' : isHeld ? '#ffa42b' : '#ffffff'}
                    fontSize="22"
                    fontWeight="900"
                    fontFamily="sans-serif"
                  >
                    {seat.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}


export default function SeatSelection() {
  const { id: showtimeId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [seatMap, setSeatMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [activeFocusedSeat, setActiveFocusedSeat] = useState(null);
  const [holding, setHolding] = useState(false);
  const [activeHold, setActiveHold] = useState(null);
  const [error, setError] = useState('');
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [selectedWaitlistCat, setSelectedWaitlistCat] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  const handleSeatMouseEnter = (e, seat) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isSelected = selectedSeatIds.includes(seat.id);
    const isHeld = seat.status === 'held' && !seat.isHeldByMe;
    const isBooked = seat.status === 'booked';
    let statusText = 'Available';
    if (isSelected) statusText = 'Selected';
    else if (isBooked) statusText = 'Booked';
    else if (isHeld) statusText = 'Temporarily Held';

    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 20,
      label: seat.label,
      categoryName: seat.categoryName || 'Standard',
      price: seat.price,
      status: statusText,
      isSelected,
      isUnavailable: isBooked || isHeld,
    });
  };

  const handleSeatMouseLeave = () => {
    setTooltip(null);
  };

  // 1. Fetch Showtime and Seat Map
  const fetchSeatMap = useCallback(async () => {
    try {
      const res = await api.get(`/showtimes/${showtimeId}/seats`);
      setSeatMap(res.data);

      const myHeldSeats = res.data.seats.filter((s) => s.isHeldByMe);
      if (myHeldSeats.length > 0) {
        setSelectedSeatIds(myHeldSeats.map((s) => s.id));
        const maxTtl = Math.max(...myHeldSeats.map((s) => s.ttlRemaining));
        const expiresAt = myHeldSeats[0].holdExpiresAt;
        setActiveHold({
          seatIds: myHeldSeats.map((s) => s.id),
          ttlSeconds: maxTtl,
          expiresAt,
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load seat map.', 'Seat Map Error');
    } finally {
      setLoading(false);
    }
  }, [showtimeId, toast]);

  useEffect(() => {
    fetchSeatMap();
  }, [fetchSeatMap]);

  // 2. Real-Time SSE Stream
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const sseUrl = `${API_BASE}/showtimes/${showtimeId}/stream`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SEATS_HELD' || data.type === 'SEATS_RELEASED' || data.type === 'SEATS_BOOKED') {
          fetchSeatMap();
        }
      } catch (err) {
        console.warn('SSE parse warning:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [showtimeId, fetchSeatMap]);

  // 3. Seat Click Handler with Instant Backend Release on Deselect
  const handleSeatClick = async (seat) => {
    if (seat.status === 'booked') return;
    if (seat.status === 'held' && !seat.isHeldByMe) return;

    setActiveFocusedSeat(seat);

    if (selectedSeatIds.includes(seat.id)) {
      // User is DESELECTING the seat
      const updated = selectedSeatIds.filter((id) => id !== seat.id);
      setSelectedSeatIds(updated);
      if (updated.length === 0) {
        setActiveFocusedSeat(null);
      }

      // If this seat was held in activeHold or on backend, release it INSTANTLY for everyone
      if (activeHold && activeHold.seatIds && activeHold.seatIds.includes(seat.id)) {
        try {
          await api.post(`/showtimes/${showtimeId}/release`, {
            seatIds: [seat.id],
          });
          const remaining = activeHold.seatIds.filter((id) => id !== seat.id);
          if (remaining.length > 0) {
            setActiveHold({ ...activeHold, seatIds: remaining });
          } else {
            setActiveHold(null);
          }
          await fetchSeatMap();
        } catch (err) {
          console.error('Failed to instantly release seat:', err);
        }
      }
    } else {
      if (selectedSeatIds.length >= 8) {
        toast.warning('Maximum 8 seats per reservation.', 'Seat Limit');
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.id]);
    }
  };

  // 4. Place Hold / Confirm Reservation
  const handleConfirmReservation = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/showtime/${showtimeId}/seats` } });
      return;
    }

    if (selectedSeatIds.length === 0) {
      toast.warning('Please select at least one seat.', 'Selection Needed');
      return;
    }

    setHolding(true);

    try {
      const res = await api.post(`/showtimes/${showtimeId}/hold`, {
        seatIds: selectedSeatIds,
        ttlSeconds: 600,
      });

      setActiveHold(res.data);
      await fetchSeatMap();

      navigate(`/checkout/${showtimeId}`, {
        state: { seatIds: selectedSeatIds, totalPrice },
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to hold seats. A seat may have just been claimed.', 'Hold Failed');
      await fetchSeatMap();
    } finally {
      setHolding(false);
    }
  };

  // 5. Release Hold (Instant Release for all held seats)
  const handleReleaseHold = async () => {
    if (!activeHold && selectedSeatIds.length === 0) return;
    const idsToRelease = activeHold?.seatIds || selectedSeatIds;
    try {
      await api.post(`/showtimes/${showtimeId}/release`, {
        seatIds: idsToRelease,
      });
      setActiveHold(null);
      setSelectedSeatIds([]);
      setActiveFocusedSeat(null);
      await fetchSeatMap();
    } catch (err) {
      console.error('Failed to release hold:', err);
    }
  };

  // 6. Join Waitlist
  const handleJoinWaitlist = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/showtime/${showtimeId}/seats` } });
      return;
    }

    if (!selectedWaitlistCat) {
      toast.warning('Please select a seat category to join the waitlist.', 'Category Required');
      return;
    }

    try {
      setWaitlistLoading(true);
      const res = await api.post(`/showtimes/${showtimeId}/waitlist`, {
        categoryId: selectedWaitlistCat,
      });
      const pos = res.data.position || res.data.waitlistEntry?.position || 1;
      toast.success(`You are #${pos} in the queue! We'll notify you automatically when seats open.`, 'Added to Waitlist');
      setWaitlistModalOpen(false);
      setSelectedWaitlistCat('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to join waitlist.';
      toast.warning(msg, 'Waitlist Notice');
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] w-full flex flex-col items-center justify-center gap-3 text-[#b3b3b3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1ed760]" />
        <p className="text-sm font-bold">Loading seating auditorium...</p>
      </div>
    );
  }

  if (!seatMap) {
    return (
      <div className="w-full max-w-xl mx-auto my-16 text-center">
        <div className="bg-[#181818] p-8 flex flex-col items-center gap-3 rounded-lg shadow-2xl">
          <AlertCircle className="w-8 h-8 text-[#f3727f]" />
          <h2 className="text-sm font-bold text-white">Showtime Not Found</h2>
          <Link to="/" className="text-xs text-[#1ed760] font-bold uppercase tracking-wider hover:underline">
            &larr; Return to Discovery
          </Link>
        </div>
      </div>
    );
  }

  const { showtime, summary, seats } = seatMap;
  const categories = showtime.categories || [];

  const layoutType = resolveLayoutType(showtime.venue, {
    title: showtime.eventTitle,
    type: showtime.eventType,
  });

  const isStadiumVenue =
    layoutType === 'amphitheatre' ||
    (showtime.venueName?.toLowerCase().includes('arena') && layoutType !== 'basketball' && layoutType !== 'esports') ||
    showtime.eventTitle?.toLowerCase().includes('coldplay') ||
    showtime.eventTitle?.toLowerCase().includes('hans zimmer');

  const rowsMap = new Map();
  for (const s of seats) {
    if (!rowsMap.has(s.row)) {
      rowsMap.set(s.row, []);
    }
    rowsMap.get(s.row).push(s);
  }
  const sortedRows = Array.from(rowsMap.keys()).sort((a, b) => a - b);

  const selectedSeatsList = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeatsList.reduce((acc, s) => acc + s.price, 0);

  const currentFocusedSeat =
    activeFocusedSeat ||
    (selectedSeatsList.length > 0 ? selectedSeatsList[selectedSeatsList.length - 1] : null);

  return (
    <div className="w-full min-h-[calc(100vh-60px)] px-4 sm:px-8 pt-4 pb-40 space-y-6 relative bg-[#121212] text-white">
      {/* Top Banner Bar (With Picture Thumbnail, Details & Waitlist Pill) */}
      <div className="w-full bg-[#181818] p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl border border-white/5">
        <div className="flex items-center gap-4">
          {/* Movie Thumbnail Picture */}
          {showtime.eventImageUrl && (
            <img
              src={showtime.eventImageUrl}
              alt={showtime.eventTitle}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=780&q=80';
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-white/10 flex-shrink-0 shadow-md"
            />
          )}

          <div className="space-y-1">
            <h1 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight">
              {showtime.eventTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#b3b3b3]">
              <span className="flex items-center gap-1 text-white font-bold">
                <MapPin className="w-3.5 h-3.5 text-[#1ed760]" /> {showtime.venueName}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#1ed760]" />
                {new Date(showtime.dateTime).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {showtime.format && (
                <>
                  <span>&bull;</span>
                  <span className="text-[#1ed760] font-bold">{showtime.format}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setWaitlistModalOpen(true)}
            className="px-5 py-2 bg-transparent hover:bg-white text-white hover:text-black rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 border border-white/40 hover:border-white hover:scale-105 cursor-pointer shadow-md"
          >
            Waitlist
          </button>

          {/* Active Hold Timer */}
          {activeHold && (
            <div className="flex items-center gap-2 bg-[#252525] px-3.5 py-1.5 text-xs rounded-full shadow-lg">
              <TTLTimer
                initialSeconds={activeHold.ttlSeconds}
                expiresAt={activeHold.expiresAt}
                onExpire={() => {
                  setActiveHold(null);
                  setSelectedSeatIds([]);
                  setActiveFocusedSeat(null);
                  fetchSeatMap();
                }}
              />
              <button
                onClick={handleReleaseHold}
                className="text-[#f3727f] hover:underline ml-1 font-bold cursor-pointer"
              >
                [Release]
              </button>
            </div>
          )}
        </div>
      </div>



      {/* FULL PAGE AUDITORIUM (Directly on page background) */}
      <div className="w-full flex flex-col items-center justify-center py-2 relative">
        {showtime.layoutData?.mode === 'freeform' || seats.some((s) => typeof s.x === 'number' && typeof s.y === 'number') ? (
          /* ─── CUSTOM FREEFORM CAD FLOORPLAN ENGINE ─── */
          <FreeformCustomerFloorplan
            showtime={showtime}
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            handleSeatClick={handleSeatClick}
            handleSeatMouseEnter={handleSeatMouseEnter}
            handleSeatMouseLeave={handleSeatMouseLeave}
          />
        ) : isStadiumVenue ? (
          /* ─── 360° CIRCULAR STADIUM ARENA ENGINE ─── */
          <CircularStadiumMap
            rowsMap={rowsMap}
            sortedRows={sortedRows}
            selectedSeatIds={selectedSeatIds}
            handleSeatClick={handleSeatClick}
          />
        ) : (
          /* ─── MULTI-SPORT & ENTERTAINMENT AUDITORIUM / STADIUM ENGINE ─── */
          <>
            {/* Visual Vector Pitch, Court, Track, Stage, or Screen Graphic */}
            <VenuePitchVisual layoutType={layoutType} venueName={showtime.venueName} />

            {/* Seating Grid with Walking Aisle Stairs */}
            <div className="overflow-x-auto w-full flex justify-center pb-6">
              <div className="space-y-4 min-w-[760px]">
                {sortedRows.map((rowNum, rowIndex) => {
                  const rowSeats = rowsMap.get(rowNum) || [];
                  const rowLetter = String.fromCharCode(64 + rowNum);
                  const firstSeat = rowSeats[0];
                  const isRecliner =
                    firstSeat?.categoryName?.toLowerCase().includes('recliner') ||
                    firstSeat?.categoryName?.toLowerCase().includes('balcony') ||
                    firstSeat?.categoryName?.toLowerCase().includes('vip') ||
                    firstSeat?.categoryName?.toLowerCase().includes('box');

                  const prevRowSeats = rowIndex > 0 ? rowsMap.get(sortedRows[rowIndex - 1]) : null;
                  const isCategoryHeader =
                    rowIndex === 0 || (prevRowSeats && prevRowSeats[0]?.categoryId !== firstSeat?.categoryId);

                  const totalCols = rowSeats.length;
                  const leftBankCutoff = Math.floor(totalCols / 2);

                  const showSpeaker = rowIndex % 2 === 1 || rowIndex === sortedRows.length - 1;

                  return (
                    <React.Fragment key={rowNum}>
                      {isCategoryHeader && (
                        <div className="flex items-center justify-center gap-3 my-2">
                          <div className="h-[1px] flex-1 bg-[#282828]" />
                          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 bg-[#1f1f1f] text-[#b3b3b3] rounded-full border border-[#333333]">
                            {firstSeat?.categoryName} &bull; ₹{firstSeat?.price}
                            {isRecliner ? ' (VIP RECLINER)' : ''}
                          </span>
                          <div className="h-[1px] flex-1 bg-[#282828]" />
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <div className="w-8 flex justify-end">
                          {showSpeaker ? <LeftSpeakerWave /> : <div className="w-4" />}
                        </div>

                        <AisleStairsGraphic />

                        <span className="w-5 text-xs font-bold text-[#b3b3b3] text-right select-none">
                          {rowLetter}
                        </span>

                        {/* Left Bank Seats */}
                        <div className="flex items-center">
                          {rowSeats.slice(0, leftBankCutoff).map((seat) => {
                            const isSelected = selectedSeatIds.includes(seat.id);
                            const isHeldByMe = seat.isHeldByMe;
                            const isHeld = seat.status === 'held' && !isHeldByMe;
                            const isBooked = seat.status === 'booked';

                            return (
                              <div key={seat.id} className="relative group/seat mx-1">
                                <button
                                  type="button"
                                  disabled={isBooked || isHeld}
                                  onClick={() => handleSeatClick(seat)}
                                  onMouseEnter={(e) => handleSeatMouseEnter(e, seat)}
                                  onMouseLeave={handleSeatMouseLeave}
                                  className={`flex items-center justify-center select-none transition-all duration-100 ${
                                    isRecliner ? 'w-13 h-16 sm:w-15 sm:h-18' : 'w-10 h-10 sm:w-12 sm:h-12'
                                  } ${
                                    isBooked || isHeld
                                      ? 'cursor-not-allowed opacity-25'
                                      : 'hover:scale-110 active:scale-95 cursor-pointer'
                                  }`}
                                >
                                  {isRecliner ? (
                                    <ReclinerSeatSvg
                                      status={seat.status}
                                      isHeldByMe={isHeldByMe}
                                      isSelected={isSelected}
                                      col={seat.col}
                                    />
                                  ) : (
                                    <NormalSeatSvg
                                      status={seat.status}
                                      isHeldByMe={isHeldByMe}
                                      isSelected={isSelected}
                                      col={seat.col}
                                    />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <AisleStairsGraphic label="AISLE" />

                        {/* Right Bank Seats */}
                        <div className="flex items-center">
                          {rowSeats.slice(leftBankCutoff).map((seat) => {
                            const isSelected = selectedSeatIds.includes(seat.id);
                            const isHeldByMe = seat.isHeldByMe;
                            const isHeld = seat.status === 'held' && !isHeldByMe;
                            const isBooked = seat.status === 'booked';

                            return (
                              <div key={seat.id} className="relative group/seat mx-1">
                                <button
                                  type="button"
                                  disabled={isBooked || isHeld}
                                  onClick={() => handleSeatClick(seat)}
                                  onMouseEnter={(e) => handleSeatMouseEnter(e, seat)}
                                  onMouseLeave={handleSeatMouseLeave}
                                  className={`flex items-center justify-center select-none transition-all duration-100 ${
                                    isRecliner ? 'w-13 h-16 sm:w-15 sm:h-18' : 'w-10 h-10 sm:w-12 sm:h-12'
                                  } ${
                                    isBooked || isHeld
                                      ? 'cursor-not-allowed opacity-25'
                                      : 'hover:scale-110 active:scale-95 cursor-pointer'
                                  }`}
                                >
                                  {isRecliner ? (
                                    <ReclinerSeatSvg
                                      status={seat.status}
                                      isHeldByMe={isHeldByMe}
                                      isSelected={isSelected}
                                      col={seat.col}
                                    />
                                  ) : (
                                    <NormalSeatSvg
                                      status={seat.status}
                                      isHeldByMe={isHeldByMe}
                                      isSelected={isSelected}
                                      col={seat.col}
                                    />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <span className="w-5 text-xs font-bold text-[#b3b3b3] text-left select-none">
                          {rowLetter}
                        </span>

                        <AisleStairsGraphic />

                        <div className="w-8 flex justify-start">
                          {showSpeaker ? <RightSpeakerWave /> : <div className="w-4" />}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 py-3 px-6 bg-[#181818] rounded-full text-xs font-bold border border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-[#1f1f1f] border border-[#383838]" />
            <span className="text-[#b3b3b3]">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-[#1ed760] shadow-sm" />
            <span className="text-white">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-[#282828] border border-[#ffa42b]" />
            <span className="text-[#ffa42b]">Held (10m TTL)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-[#121212] border border-[#222222]" />
            <span className="text-[#555555]">Booked</span>
          </div>
          {!isStadiumVenue && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-6 flex items-center justify-center">
                <ReclinerSeatSvg status="available" />
              </div>
              <span className="text-[#ffa42b]">VIP Recliner</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── FLOATING BooKMe BOTTOM ACTION BAR (Centered in the middle from bottom) ─── */}
      <AnimatePresence>
        {selectedSeatsList.length > 0 && !isDrawerOpen && (
          <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="pointer-events-auto w-full max-w-2xl bg-[#181818]/95 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 shadow-2xl flex items-center justify-between gap-4 text-white"
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-[#1ed760] text-black font-black flex items-center justify-center text-xs flex-shrink-0 shadow-md">
                  {selectedSeatsList.length}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-white truncate flex items-center gap-1.5">
                    <span>Seats:</span>
                    <span className="text-[#1ed760]">{selectedSeatsList.map((s) => s.label).join(', ')}</span>
                  </p>
                  <p className="text-[11px] text-[#b3b3b3]">
                    Total: <span className="font-black text-white font-mono">₹{totalPrice}</span>
                    <span className="ml-1 text-[10px] text-[#7c7c7c]">({selectedSeatsList.length} selected)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeatIds([]);
                    setActiveFocusedSeat(null);
                  }}
                  className="text-xs text-[#b3b3b3] hover:text-[#f3727f] font-bold px-3 py-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="px-6 py-3 bg-[#1ed760] hover:bg-[#1db954] text-black font-black text-xs uppercase tracking-wider rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Review & Pay (₹{totalPrice})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── SLIDING RIGHT OVERLAY SIDEBAR (Framer Motion Animated Drawer via Portal) ─── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isDrawerOpen && selectedSeatsList.length > 0 && (
            <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] pointer-events-auto">
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsDrawerOpen(false)}
                className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/60 backdrop-blur-md cursor-pointer"
              />

              {/* Bottom Sheet Drawer */}
              <div className="fixed inset-0 z-[100000] flex items-end justify-center pointer-events-none pb-0 sm:pb-6">
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="w-full max-w-lg bg-[#181818] border border-[#282828] pointer-events-auto flex flex-col justify-between overflow-hidden text-white font-sans m-0 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh]"
                >
                {/* Drawer Header & Content */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div className="flex items-start justify-between gap-4 border-b border-[#282828] pb-4">
                    <div className="flex-1 min-w-0 pr-1">
                      <span className="text-xs uppercase font-bold text-[#1ed760] tracking-wider block">
                        Reservation Summary
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-white leading-snug break-words">
                        {showtime.eventTitle}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-8 h-8 rounded-full bg-[#252525] hover:bg-[#333333] text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 mt-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Movie details summary banner */}
                  <div className="flex items-center gap-3.5 p-3.5 bg-[#121212] rounded-xl border border-white/5">
                    {showtime.eventImageUrl && (
                      <img
                        src={showtime.eventImageUrl}
                        alt={showtime.eventTitle}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=780&q=80';
                        }}
                        className="w-12 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="space-y-0.5 overflow-hidden">
                      <h4 className="text-sm font-bold text-white truncate">{showtime.venueName}</h4>
                      <p className="text-xs text-[#b3b3b3]">
                        {new Date(showtime.dateTime).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#1f1f1f] text-[#1ed760] rounded inline-block">
                        {showtime.format || 'DOLBY ATMOS'}
                      </span>
                    </div>
                  </div>

                  {/* Selected Seats List */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-[#b3b3b3]">
                      <span className="font-bold uppercase tracking-wider text-[11px]">
                        Selected Seats ({selectedSeatsList.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSeatIds([]);
                          setActiveFocusedSeat(null);
                          setIsDrawerOpen(false);
                        }}
                        className="text-[#f3727f] hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedSeatsList.map((seat) => (
                        <div
                          key={seat.id}
                          className="flex items-center justify-between p-3.5 bg-[#1f1f1f] rounded-xl border border-white/5"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-white text-sm">
                              {seat.label}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#252525] text-[#1ed760] rounded-full">
                              {seat.categoryName || 'General'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-white">₹{seat.price}</span>
                            <button
                              type="button"
                              onClick={() => handleSeatClick(seat)}
                              className="text-[#7c7c7c] hover:text-[#f3727f] transition-colors p-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Drawer Footer CTA */}
                <div className="p-6 bg-[#181818] border-t border-[#282828] space-y-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#b3b3b3] font-bold">Total Payable</span>
                    <span className="text-2xl font-black text-[#1ed760] font-mono">
                      ₹{totalPrice}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={holding}
                    onClick={handleConfirmReservation}
                    className="w-full py-4 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-[1.5px] rounded-full shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {holding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Securing Seats...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm & Proceed (₹{totalPrice})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Waitlist Modal */}
      <Modal
        isOpen={waitlistModalOpen}
        onOpenChange={setWaitlistModalOpen}
        backdrop="blur"
        className="bg-[#181818] text-white rounded-3xl shadow-2xl border border-[#282828] max-w-md mx-4"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-[#282828] text-base font-black text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1ed760]/20 border border-[#1ed760]/40 flex items-center justify-center text-[#1ed760]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>Join Event Waitlist</span>
              </ModalHeader>
              <ModalBody className="space-y-4 py-5 text-xs">
                <p className="text-[#b3b3b3] leading-relaxed">
                  When seats become available through cancellations, waitlisted customers receive an automated, time-limited booking window.
                </p>

                <div className="space-y-2">
                  <label className="block text-[#b3b3b3] uppercase text-[10px] font-black tracking-wider">
                    Select Seat Category
                  </label>
                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const isCatSelected = selectedWaitlistCat === cat.id;
                      const price = showtime.pricing ? showtime.pricing[cat.id] : null;

                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedWaitlistCat(cat.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isCatSelected
                              ? 'bg-[#181818] border-[#1ed760] shadow-[0_0_12px_rgba(30,215,96,0.25)] text-white'
                              : 'bg-[#222222] hover:bg-[#282828] border-transparent text-[#b3b3b3]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                isCatSelected
                                  ? 'border-[#1ed760] bg-[#1ed760]'
                                  : 'border-[#555555]'
                              }`}
                            >
                              {isCatSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                            <span className="font-black text-xs text-white">{cat.name}</span>
                          </div>
                          {price && (
                            <span className="text-xs font-mono font-black text-[#1ed760]">
                              ₹{price}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-[#282828] flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-[#b3b3b3] hover:text-white font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleJoinWaitlist}
                  disabled={!selectedWaitlistCat || waitlistLoading}
                  className="px-6 py-2.5 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {waitlistLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Join Waitlist</span>
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ─── CUSTOM FLOATING DARK TOOLTIP (REPLACES NATIVE BROWSER TOOLTIP) ─── */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
          className="bg-[#1f1f1f] text-white border border-[#383838] px-3 py-1.5 rounded-xl shadow-2xl text-[11px] font-sans whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 flex items-center gap-2"
        >
          <span className="font-mono font-black text-white">Seat {tooltip.label}</span>
          <span className="text-[#7c7c7c]">&bull;</span>
          <span className={tooltip.isSelected ? 'text-[#1ed760] font-black' : tooltip.isUnavailable ? 'text-[#7c7c7c]' : 'text-white font-bold'}>
            {tooltip.status}
          </span>
          {tooltip.price && (
            <>
              <span className="text-[#7c7c7c]">&bull;</span>
              <span className="text-[#1ed760] font-mono font-bold">₹{tooltip.price}</span>
            </>
          )}
          {tooltip.categoryName && (
            <>
              <span className="text-[#7c7c7c]">&bull;</span>
              <span className="text-amber-400 font-bold">{tooltip.categoryName}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

