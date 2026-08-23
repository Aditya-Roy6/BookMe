import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = '-- Select an option --',
  className = '',
  buttonClassName = '',
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

      {/* Trigger Button (Sleek Spotify Pill with Green Focus/Open Outline) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#181818] hover:bg-[#202020] border ${
          isOpen ? 'border-[#1ed760] shadow-[0_0_12px_rgba(30,215,96,0.2)]' : 'border-[#383838] hover:border-white/40'
        } text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer focus:outline-none ${buttonClassName}`}
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

      {/* Dropdown Menu (Matching Language Dropdown Popup: Rounded-2xl, Dark background, Green active selection with Checkmark) */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+6px)] w-full min-w-[180px] bg-[#181818] border border-[#282828] rounded-2xl z-[9999] p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 shadow-2xl scrollbar-none space-y-1">
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
                className={`w-full px-3.5 py-2.5 text-xs text-left rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#163820] text-[#1ed760] font-black shadow-sm'
                    : 'text-[#b3b3b3] hover:bg-[#252525] hover:text-white font-bold'
                }`}
              >
                <div className="flex items-center gap-2">
                  {option.icon && <span>{option.icon}</span>}
                  <span>{option.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#1ed760] stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

