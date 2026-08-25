import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Calendar as CalendarIcon } from './MappedIcons';

export default function CalendarPicker({ value, onChange, placeholder = "Select Date" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Parse initial date or default to current date
  const initialDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 288; // w-72 = 288px
      const dropdownHeight = 350;

      let left;
      let top;

      // Prefer right side if ample space available (avoids modal clipping)
      if (rect.right + dropdownWidth + 16 <= window.innerWidth) {
        left = rect.right + 12;
        top = Math.max(16, Math.min(rect.top - 10, window.innerHeight - dropdownHeight - 16));
      } else if (rect.left - dropdownWidth - 16 >= 0) {
        // Left side if right side doesn't have space
        left = rect.left - dropdownWidth - 12;
        top = Math.max(16, Math.min(rect.top - 10, window.innerHeight - dropdownHeight - 16));
      } else {
        // Fallback for mobile / small screens (bottom or top)
        left = Math.max(16, Math.min(rect.left, window.innerWidth - dropdownWidth - 16));
        top = rect.bottom + 8;
        if (top + dropdownHeight > window.innerHeight && rect.top > dropdownHeight) {
          top = rect.top - dropdownHeight - 8;
        }
      }

      setDropdownCoords({ top, left });
    }
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  // Close when clicking outside or scrolling
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Days calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const selectedDateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    onChange(selectedDateStr);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const formattedMonth = String(today.getMonth() + 1).padStart(2, '0');
    const formattedDay = String(today.getDate()).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${formattedMonth}-${formattedDay}`;
    onChange(todayStr);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Check if a day is the currently selected date
  const isSelectedDate = (day) => {
    if (!value) return false;
    const selected = new Date(value);
    return (
      selected.getFullYear() === currentYear &&
      selected.getMonth() === currentMonth &&
      selected.getDate() === day
    );
  };

  // Check if a day is today
  const isToday = (day) => {
    const today = new Date();
    return (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day
    );
  };

  // Format display label
  const formattedDisplayValue = value
    ? new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : placeholder;

  return (
    <div className="relative inline-block">
      {/* Trigger Pill Button (Spotify Smooth Interaction: Light on hover, bold edge on click/open) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer select-none outline-none ${
          value
            ? 'bg-[#1ed760] text-black border-2 border-[#1ed760]'
            : isOpen
            ? 'bg-[#282828] text-white border-2 border-white'
            : 'bg-[#1f1f1f] hover:bg-[#282828] text-white border border-[#383838] hover:border-white/40'
        }`}
      >
        <CalendarIcon className={`w-3.5 h-3.5 ${value ? 'text-black' : 'text-[#1ed760]'}`} />
        <span>{formattedDisplayValue}</span>
        {value && (
          <span
            onClick={handleClear}
            className="ml-1 p-0.5 hover:bg-black/20 rounded-full cursor-pointer"
          >
            <X className="w-3 h-3 text-black" />
          </span>
        )}
      </button>

      {/* BooKMe Calendar Dropdown (Portaled directly to document.body on top of all modals) */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${dropdownCoords.top}px`,
            left: `${dropdownCoords.left}px`,
            zIndex: 9999999,
          }}
          className="w-72 bg-[#181818] border border-[#383838] rounded-2xl p-4 text-white font-sans shadow-none transition-opacity duration-150"
        >
          {/* Header with Month / Year and Prev / Next Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-[#282828]">
            <div className="font-bold text-sm text-white">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-full bg-[#1f1f1f] hover:bg-[#282828] flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-full bg-[#1f1f1f] hover:bg-[#282828] flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 py-2 text-center text-[11px] font-bold text-[#b3b3b3]">
            {daysOfWeek.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Previous Month trailing days */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
              const prevDay = daysInPrevMonth - firstDayOfMonth + idx + 1;
              return (
                <div
                  key={`prev-${idx}`}
                  className="w-8 h-8 flex items-center justify-center text-[#404040] select-none mx-auto text-[11px]"
                >
                  {prevDay}
                </div>
              );
            })}

            {/* Current Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected = isSelectedDate(day);
              const isDayToday = isToday(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mx-auto ${
                    isSelected
                      ? 'bg-[#1ed760] text-black font-black'
                      : isDayToday
                      ? 'border border-[#1ed760] text-[#1ed760] hover:bg-[#282828]'
                      : 'text-white hover:bg-[#282828] hover:text-white'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Actions: Clear and Today */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#282828] text-xs font-bold">
            <button
              type="button"
              onClick={handleClear}
              className="text-[#f3727f] hover:underline"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[#1ed760] hover:underline"
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

