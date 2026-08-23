import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';

const THEME_PALETTE = [
  { name: 'Spotify Green', hex: '#1ed760' },
  { name: 'Sky Cyan', hex: '#38bdf8' },
  { name: 'Royal Indigo', hex: '#818cf8' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Neon Purple', hex: '#a855f7' },
  { name: 'Emerald Wave', hex: '#10b981' },
  { name: 'Hot Magenta', hex: '#ec4899' },
  { name: 'Sunset Orange', hex: '#f97316' },
  { name: 'Electric Teal', hex: '#06b6d4' },
];

export default function ColorPicker({ value = '#1ed760', onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState(value);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    setCustomHex(value);
  }, [value]);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 230; // w-56 ≈ 224px
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 16) {
        left = window.innerWidth - popoverWidth - 16;
      }
      if (left < 16) left = 16;

      let top = rect.bottom + 6;
      if (top + 200 > window.innerHeight && rect.top > 200) {
        top = rect.top - 200 - 6;
      }

      setCoords({ top, left });
    }
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    function handleScrollOrResize() {
      if (isOpen) {
        updatePosition();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const handleCustomHexChange = (e) => {
    const val = e.target.value;
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div className="relative font-sans inline-block">
      {/* Trigger Button Swatch */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="w-9 h-9 rounded-xl border border-white/15 hover:border-white shadow-none flex items-center justify-center transition-all duration-150 cursor-pointer hover:scale-105 select-none"
        style={{ backgroundColor: value }}
        title="Choose Category Color"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-black/40 border border-white/30" />
      </button>

      {/* Popover Color Palette (Portaled directly to document.body on highest z-index) */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 9999999,
          }}
          className="w-56 bg-[#181818] border border-[#383838] rounded-2xl shadow-none p-3.5 space-y-3 font-sans text-white transition-opacity duration-150"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] uppercase font-bold text-[#b3b3b3] tracking-wider">
              Category Color
            </span>
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/30"
              style={{ backgroundColor: value }}
            />
          </div>

          {/* Palette Grid */}
          <div className="grid grid-cols-5 gap-2">
            {THEME_PALETTE.map((color) => {
              const isSelected = value.toLowerCase() === color.hex.toLowerCase();

              return (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => {
                    onChange(color.hex);
                    setCustomHex(color.hex);
                    setIsOpen(false);
                  }}
                  className="w-8 h-8 rounded-lg transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-none relative"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                </button>
              );
            })}
          </div>

          {/* Hex Input */}
          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#7c7c7c]">HEX</span>
            <input
              type="text"
              maxLength={7}
              value={customHex}
              onChange={handleCustomHexChange}
              placeholder="#1ed760"
              className="flex-1 bg-[#121212] border border-[#383838] focus:border-[#1ed760] text-white text-[11px] font-mono px-2 py-1 rounded-md focus:outline-none uppercase"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

