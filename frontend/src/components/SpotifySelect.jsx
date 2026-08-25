import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from './MappedIcons';

export default function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = '-- Select an option --',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-1.5 relative font-sans ${isOpen ? 'z-[9999]' : 'z-10'} ${className}`} ref={selectRef}>
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#121212] hover:bg-[#181818] border border-[#383838] hover:border-white focus:border-[#1ed760] text-white text-xs px-4 py-3 rounded-xl flex items-center justify-between transition-all cursor-pointer focus:outline-none"
      >
        <span className={selectedOption ? 'text-white font-bold' : 'text-[#7c7c7c]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#b3b3b3] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#1ed760]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] w-full bg-[#181818] border border-[#383838] rounded-xl z-[9999] p-1.5 space-y-0.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 scrollbar-none shadow-2xl">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-xs text-left rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#1ed760]/15 text-[#1ed760] font-bold'
                    : 'text-[#b3b3b3] hover:bg-[#252525] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {option.icon && <span>{option.icon}</span>}
                  <span>{option.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#1ed760]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

