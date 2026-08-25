import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Sparkles } from 'lucide-react';
import { Calendar as CalendarIcon, Clock } from './MappedIcons';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_HEADER = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const POPULAR_SHOWTIMES = [
  { label: '10:00 AM', hour: 10, minute: 0, period: 'AM' },
  { label: '01:30 PM', hour: 1, minute: 30, period: 'PM' },
  { label: '04:45 PM', hour: 4, minute: 45, period: 'PM' },
  { label: '07:30 PM', hour: 7, minute: 30, period: 'PM' },
  { label: '10:15 PM', hour: 10, minute: 15, period: 'PM' },
];

export default function DateTimePicker({
  label = 'Showtime Date & Time',
  value,
  onChange,
  required = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse existing value or default to now
  const parsedDate = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const [viewYear, setViewYear] = useState(parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(parsedDate.getDate());

  // Time state (12-hour format)
  const initialHours24 = parsedDate.getHours();
  const initialPeriod = initialHours24 >= 12 ? 'PM' : 'AM';
  const initialHours12 = initialHours24 % 12 || 12;

  const [selectedHour, setSelectedHour] = useState(initialHours12);
  const [selectedMinute, setSelectedMinute] = useState(parsedDate.getMinutes());
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);

  // Sync state if value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
        setSelectedDay(d.getDate());
        const h24 = d.getHours();
        setSelectedPeriod(h24 >= 12 ? 'PM' : 'AM');
        setSelectedHour(h24 % 12 || 12);
        setSelectedMinute(d.getMinutes());
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update parent with ISO string YYYY-MM-DDTHH:mm
  const emitChange = (y, m, d, h12, min, period) => {
    let h24 = h12 % 12;
    if (period === 'PM') h24 += 12;

    const dateObj = new Date(y, m, d, h24, min, 0);
    // Format YYYY-MM-DDTHH:mm
    const yearStr = dateObj.getFullYear();
    const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dayStr = String(dateObj.getDate()).padStart(2, '0');
    const hourStr = String(dateObj.getHours()).padStart(2, '0');
    const minStr = String(dateObj.getMinutes()).padStart(2, '0');

    const formattedIso = `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minStr}`;
    onChange(formattedIso);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day) => {
    setSelectedDay(day);
    emitChange(viewYear, viewMonth, day, selectedHour, selectedMinute, selectedPeriod);
  };

  const handleTimePreset = (preset) => {
    setSelectedHour(preset.hour);
    setSelectedMinute(preset.minute);
    setSelectedPeriod(preset.period);
    emitChange(viewYear, viewMonth, selectedDay, preset.hour, preset.minute, preset.period);
  };

  const handleSetToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(today.getDate());
    emitChange(today.getFullYear(), today.getMonth(), today.getDate(), selectedHour, selectedMinute, selectedPeriod);
  };

  // Compute calendar days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isPrev: true,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill 35 or 42 cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length > 0 ? 42 - days.length : 0);
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        isNext: true,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Formatted display value for trigger
  const displayFormatted = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;

    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [value]);

  const today = new Date();
  const isTodayMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;

  return (
    <div className={`space-y-1.5 relative font-sans ${isOpen ? 'z-[9999]' : 'z-10'} ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
          {label} {required && <span className="text-[#1ed760]">*</span>}
        </label>
      )}

      {/* Trigger Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#121212] hover:bg-[#181818] border border-[#383838] hover:border-white focus:border-[#1ed760] text-white text-xs px-4 py-3 rounded-xl flex items-center justify-between transition-all cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-4 h-4 text-[#1ed760]" />
          <span className={displayFormatted ? 'text-white font-bold' : 'text-[#7c7c7c]'}>
            {displayFormatted || 'Select Showtime Date & Time'}
          </span>
        </div>
        <Clock className="w-4 h-4 text-[#7c7c7c]" />
      </button>

      {/* Popover Calendar & Time Picker */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+6px)] w-full max-w-sm sm:max-w-md bg-[#181818] border border-[#383838] rounded-2xl z-[9999] p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header: Month & Year Navigator */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              <span>{MONTH_NAMES[viewMonth]}</span>
              <span className="text-[#1ed760]">{viewYear}</span>
            </h4>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-full bg-[#121212] hover:bg-[#252525] text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-full bg-[#121212] hover:bg-[#252525] text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Grid */}
          <div className="space-y-1.5">
            {/* Days Header */}
            <div className="grid grid-cols-7 text-center">
              {DAYS_HEADER.map((d, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#7c7c7c] py-1"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return (
                    <div
                      key={idx}
                      className="h-8 flex items-center justify-center text-[11px] text-[#444444] select-none"
                    >
                      {cell.day}
                    </div>
                  );
                }

                const isSelected = selectedDay === cell.day;
                const isCurrentToday = isTodayMonth && today.getDate() === cell.day;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(cell.day)}
                    className={`h-8 w-8 mx-auto rounded-full text-xs font-bold transition-all flex items-center justify-center cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#1ed760] text-black font-black shadow-md shadow-[#1ed760]/30 scale-105'
                        : 'text-white hover:bg-[#252525] hover:text-[#1ed760]'
                    }`}
                  >
                    <span>{cell.day}</span>
                    {isCurrentToday && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-[#1ed760] absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Showtime Presets */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c7c7c] block">
              Popular Showtime Slots
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SHOWTIMES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTimePreset(preset)}
                  className="px-2.5 py-1 bg-[#121212] hover:bg-[#222222] hover:text-[#1ed760] text-white text-[10px] font-mono font-bold rounded-lg border border-white/5 cursor-pointer transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Picker Controls (12-Hour with AM/PM) */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#1ed760]" />
              <span className="text-[11px] font-bold text-[#b3b3b3]">Custom Time:</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Hour Input */}
              <input
                type="number"
                min={1}
                max={12}
                value={selectedHour}
                onChange={(e) => {
                  const val = Math.min(Math.max(Number(e.target.value), 1), 12);
                  setSelectedHour(val);
                  emitChange(viewYear, viewMonth, selectedDay, val, selectedMinute, selectedPeriod);
                }}
                className="w-10 bg-[#121212] border border-[#383838] text-white text-xs font-mono font-bold text-center py-1 rounded-md focus:outline-none focus:border-[#1ed760]"
              />
              <span className="text-white font-mono font-bold">:</span>
              {/* Minute Input */}
              <input
                type="number"
                min={0}
                max={59}
                value={String(selectedMinute).padStart(2, '0')}
                onChange={(e) => {
                  const val = Math.min(Math.max(Number(e.target.value), 0), 59);
                  setSelectedMinute(val);
                  emitChange(viewYear, viewMonth, selectedDay, selectedHour, val, selectedPeriod);
                }}
                className="w-10 bg-[#121212] border border-[#383838] text-white text-xs font-mono font-bold text-center py-1 rounded-md focus:outline-none focus:border-[#1ed760]"
              />

              {/* AM / PM Segmented Switch */}
              <div className="flex items-center bg-[#121212] rounded-md p-0.5 border border-[#383838]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPeriod('AM');
                    emitChange(viewYear, viewMonth, selectedDay, selectedHour, selectedMinute, 'AM');
                  }}
                  className={`px-2 py-0.5 text-[10px] font-black rounded ${
                    selectedPeriod === 'AM'
                      ? 'bg-[#1ed760] text-black'
                      : 'text-[#7c7c7c] hover:text-white'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPeriod('PM');
                    emitChange(viewYear, viewMonth, selectedDay, selectedHour, selectedMinute, 'PM');
                  }}
                  className={`px-2 py-0.5 text-[10px] font-black rounded ${
                    selectedPeriod === 'PM'
                      ? 'bg-[#1ed760] text-black'
                      : 'text-[#7c7c7c] hover:text-white'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-xs text-[#1ed760] hover:underline font-bold cursor-pointer"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-wider rounded-full shadow-md cursor-pointer hover:scale-105 transition-transform"
            >
              Set Showtime
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

