import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import api from '../api/client';
import ColorPicker from '../components/ColorPicker';
import { useToast } from '../context/ToastContext';

import { MapPin, Save, Info, Volume2, CinemaIcon, StadiumIcon, TheatreIcon, ShieldCheck, Plus, Grid, Loader2, AlertCircle, CheckCircle2, Trash2, Layers, Sparkles, Sliders, Check, Eye, ArrowLeft, Tv, Disc, Armchair, Maximize2, MousePointer, Compass, RotateCw, Minus, ZoomIn, ZoomOut, Type, Square, Slash, PenTool, CornerUpLeft, CornerUpRight, Move, LayoutGrid, Wand2, Copy, Hash, X } from '../components/MappedIcons';
import { NormalSeatSvg, ReclinerSeatSvg, AuditoriumScreen3D, AisleStairsGraphic } from './SeatSelection';
import { VENUE_LAYOUT_PRESETS } from '../components/SportsVenueLayouts';
import {
  TicketRoundedIcon,
  FilmReelRoundedIcon,
  StarRoundedIcon,
  ClockRoundedIcon,
  CalendarRoundedIcon,
  MapPinRoundedIcon,
  PlayRoundedIcon,
  FilterRoundedIcon,
  SearchRoundedIcon,
  MusicRoundedIcon,
  SparklesRoundedIcon,
  CloseRoundedIcon,
  CheckRoundedIcon,
} from '../components/CustomRoundedIcons';

export default function AdminVenues() {
  const { toast } = useToast();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [visualStudioOpen, setVisualStudioOpen] = useState(false);

  // Form & Visual Studio State
  const [venueType, setVenueType] = useState('cinema'); // 'cinema' | 'stadium' | 'amphitheatre'
  const [name, setName] = useState('PVR INOX: IMAX 70MM & Dolby Cinema');
  const [address, setAddress] = useState('Phoenix Palladium, Lower Parel, Mumbai');
  const [categories, setCategories] = useState([
    { name: 'VIP Recliners', color: '#1ed760', isRecliner: true, price: 650 },
    { name: 'Prime Club', color: '#ffffff', isRecliner: false, price: 350 },
    { name: 'Classic Standard', color: '#b3b3b3', isRecliner: false, price: 220 },
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // ─── ARCHITECT STUDIO: PREDEFINED SKELETON ARCHITECTURES ──────────
  // ═══════════════════════════════════════════════════════════════════
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [rowConfigs, setRowConfigs] = useState([
    { label: 'A', seatCount: 14, categoryIndex: 0, isRecliner: true },
    { label: 'B', seatCount: 16, categoryIndex: 1, isRecliner: false },
    { label: 'C', seatCount: 18, categoryIndex: 1, isRecliner: false },
    { label: 'D', seatCount: 18, categoryIndex: 1, isRecliner: false },
    { label: 'E', seatCount: 18, categoryIndex: 2, isRecliner: false },
    { label: 'F', seatCount: 18, categoryIndex: 2, isRecliner: false },
    { label: 'G', seatCount: 18, categoryIndex: 2, isRecliner: false },
    { label: 'H', seatCount: 18, categoryIndex: 2, isRecliner: false },
  ]);

  // Handle Preset Selection
  const applyTemplatePreset = (tType) => {
    setVenueType(tType);
    if (tType === 'cinema') {
      setName('PVR INOX: IMAX 70MM & Dolby Cinema');
      setAddress('Phoenix Palladium, Lower Parel, Mumbai');
      const defaultCats = [
        { name: 'VIP Recliners', color: '#1ed760', isRecliner: true, price: 650 },
        { name: 'Prime Club', color: '#ffffff', isRecliner: false, price: 350 },
        { name: 'Classic Standard', color: '#b3b3b3', isRecliner: false, price: 220 },
      ];
      setCategories(defaultCats);
      setRowConfigs([
        { label: 'A', seatCount: 14, categoryIndex: 0, isRecliner: true },
        { label: 'B', seatCount: 16, categoryIndex: 1, isRecliner: false },
        { label: 'C', seatCount: 18, categoryIndex: 1, isRecliner: false },
        { label: 'D', seatCount: 18, categoryIndex: 1, isRecliner: false },
        { label: 'E', seatCount: 18, categoryIndex: 2, isRecliner: false },
        { label: 'F', seatCount: 18, categoryIndex: 2, isRecliner: false },
        { label: 'G', seatCount: 18, categoryIndex: 2, isRecliner: false },
        { label: 'H', seatCount: 18, categoryIndex: 2, isRecliner: false },
      ]);
    } else if (tType === 'stadium') {
      setName('Wankhede & Narendra Modi 360° Arena');
      setAddress('Stadium Drive, Sector 1');
      const defaultCats = [
        { name: 'Pavilion VIP Club', color: '#1ed760', isRecliner: true, price: 1500 },
        { name: 'Lower Bowl Seating', color: '#ffffff', isRecliner: false, price: 800 },
        { name: 'Upper Stand General', color: '#b3b3b3', isRecliner: false, price: 400 },
      ];
      setCategories(defaultCats);
      setRowConfigs([
        { label: 'Ring 1 (Inner Pavilion)', seatCount: 20, categoryIndex: 0, isRecliner: true },
        { label: 'Ring 2 (Lower Bowl)', seatCount: 24, categoryIndex: 1, isRecliner: false },
        { label: 'Ring 3 (Mid Bowl)', seatCount: 28, categoryIndex: 1, isRecliner: false },
        { label: 'Ring 4 (Upper Stand)', seatCount: 32, categoryIndex: 2, isRecliner: false },
        { label: 'Ring 5 (Terrace)', seatCount: 36, categoryIndex: 2, isRecliner: false },
      ]);
    } else if (tType === 'square_stadium') {
      setName('Santiago Bernabéu & Wembley Rectangular Stadium');
      setAddress('Avenida Concha Espina 1, Madrid / London');
      const defaultCats = [
        { name: 'Pitchside VIP Box', color: '#1ed760', isRecliner: true, price: 1800 },
        { name: 'Lower Grandstand', color: '#ffffff', isRecliner: false, price: 950 },
        { name: 'Upper Deck General', color: '#b3b3b3', isRecliner: false, price: 450 },
      ];
      setCategories(defaultCats);
      setRowConfigs([
        { label: 'Tier 1 (Pitchside Box)', seatCount: 28, categoryIndex: 0, isRecliner: true },
        { label: 'Tier 2 (Lower Stand)', seatCount: 36, categoryIndex: 1, isRecliner: false },
        { label: 'Tier 3 (Mid Stand)', seatCount: 44, categoryIndex: 1, isRecliner: false },
        { label: 'Tier 4 (Upper Deck)', seatCount: 52, categoryIndex: 2, isRecliner: false },
      ]);
    } else {
      setName('Royal Opera & Broadway Grand Amphitheatre');
      setAddress('Cultural Boulevard, Arts District');
      const defaultCats = [
        { name: 'Orchestra Pit VIP', color: '#1ed760', isRecliner: true, price: 900 },
        { name: 'Royal Mezzanine', color: '#ffffff', isRecliner: false, price: 550 },
        { name: 'Upper Gallery', color: '#b3b3b3', isRecliner: false, price: 300 },
      ];
      setCategories(defaultCats);
      setRowConfigs([
        { label: 'Row 1 (Orchestra)', seatCount: 14, categoryIndex: 0, isRecliner: true },
        { label: 'Row 2 (Orchestra Center)', seatCount: 18, categoryIndex: 0, isRecliner: true },
        { label: 'Row 3 (Royal Mezzanine)', seatCount: 22, categoryIndex: 1, isRecliner: false },
        { label: 'Row 4 (Mezzanine Center)', seatCount: 26, categoryIndex: 1, isRecliner: false },
        { label: 'Row 5 (Upper Gallery)', seatCount: 28, categoryIndex: 2, isRecliner: false },
        { label: 'Row 6 (Balcony)', seatCount: 32, categoryIndex: 2, isRecliner: false },
      ]);
    }
  };

  // Calculate Total Seats in real time
  const totalCalculatedSeats = useMemo(() => {
    return rowConfigs.reduce((sum, r) => sum + (Number(r.seatCount) || 0), 0);
  }, [rowConfigs]);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await api.get('/venues');
      setVenues(res.data.venues || []);
    } catch (err) {
      console.error('Failed to fetch venues:', err);
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // ─── DEPLOY FLOORPLAN (SKELETON & MATRIX ENGINE) ───────────────────
  // ═══════════════════════════════════════════════════════════════════
  const handleDeployStudio = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a venue name.');
      return;
    }

    if (categories.length === 0) {
      toast.error('Please configure at least one category tier.');
      return;
    }

    setCreating(true);

    try {
      // 1. Create Venue
      const maxCols = Math.max(...rowConfigs.map((r) => r.seatCount), 18);
      const venueRes = await api.post('/venues', {
        name: name.trim(),
        address: address.trim() || 'Custom Auditorium Arena',
        totalRows: rowConfigs.length,
        totalCols: maxCols,
        layoutType: venueType || 'cinema',
      });

      const createdVenue = venueRes.data.venue;

      // 2. Create Categories
      const categoriesPayload = categories.map((cat, idx) => ({
        name: cat.name,
        color: cat.color || '#1ed760',
        rowStart: idx + 1,
        rowEnd: rowConfigs.length,
      }));

      const catRes = await api.post(`/venues/${createdVenue.id}/categories`, {
        categories: categoriesPayload,
      });
      const createdCats = catRes.data.categories || [];

      // 3. Generate Itemized Seats based on rowConfigs
      const seatsPayload = [];
      rowConfigs.forEach((rConfig, rIdx) => {
        const rowNum = rIdx + 1;
        const rowLetter = rConfig.label || String.fromCharCode(65 + rIdx);
        const count = Math.max(1, parseInt(rConfig.seatCount, 10) || 12);
        const catObj = createdCats[rConfig.categoryIndex] || createdCats[0];

        for (let col = 1; col <= count; col++) {
          seatsPayload.push({
            venueId: createdVenue.id,
            categoryId: catObj ? catObj.id : createdCats[0]?.id,
            row: rowNum,
            col,
            label: `${rowLetter}${col}`,
          });
        }
      });

      await api.post(`/venues/${createdVenue.id}/seats/bulk`, { seats: seatsPayload });

      toast.success(`Successfully deployed ${name} with ${seatsPayload.length} seats!`);
      setVisualStudioOpen(false);
      fetchVenues();
    } catch (err) {
      console.error('Failed to deploy venue:', err);
      toast.error(err.response?.data?.error || 'Failed to deploy floorplan.');
    } finally {
      setCreating(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // ─── VISUAL ARCHITECT SKELETON STUDIO VIEW ─────────────────────────
  // ═══════════════════════════════════════════════════════════════════
  if (visualStudioOpen) {
    const selectedRow = rowConfigs[selectedRowIndex] || rowConfigs[0];

    return (
      <div className="fixed inset-0 z-50 bg-[#0c0c0e] text-white flex flex-col font-sans select-none overflow-hidden">
        {/* ─── STUDIO MASTER HEADER ─── */}
        <div className="h-14 bg-[#121218] border-b border-white/10 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVisualStudioOpen(false)}
              className="p-2 rounded-xl bg-[#181820] hover:bg-[#252530] text-[#b3b3b3] hover:text-white transition-colors cursor-pointer border border-white/5"
              title="Return to Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] font-black text-[10px] uppercase tracking-wider border border-[#1ed760]/30">
                Architect Studio
              </span>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {name || 'New Custom Architecture'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#b3b3b3] bg-[#181820] px-3 py-1.5 rounded-xl border border-white/5">
              Total Seats: <strong className="text-[#1ed760] font-bold">{totalCalculatedSeats}</strong>
            </span>

            <button
              type="button"
              disabled={creating || rowConfigs.length === 0}
              onClick={handleDeployStudio}
              className="px-5 py-2 bg-[#1ed760] hover:bg-[#1db954] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Deploy Floorplan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ─── QUICK TEMPLATES ACTION BAR ─── */}
        <div className="h-12 bg-[#101014] border-b border-white/5 px-4 sm:px-6 flex items-center justify-between text-xs text-[#b3b3b3] flex-shrink-0 z-30">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[10px] uppercase tracking-wider text-[#1ed760] flex items-center gap-1.5">
              <SparklesRoundedIcon className="w-3.5 h-3.5" /> Predefined Templates:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyTemplatePreset('cinema')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer border flex items-center gap-1.5 ${
                  venueType === 'cinema'
                    ? 'bg-[#1ed760] text-black border-[#1ed760] font-black'
                    : 'bg-[#18181f] text-[#b3b3b3] hover:text-white border-white/10 hover:bg-[#22222c]'
                }`}
              >
                <CinemaIcon className="w-3.5 h-3.5" />
                <span>Cinema & Dolby Theatre</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplatePreset('stadium')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer border flex items-center gap-1.5 ${
                  venueType === 'stadium'
                    ? 'bg-[#1ed760] text-black border-[#1ed760] font-black'
                    : 'bg-[#18181f] text-[#b3b3b3] hover:text-white border-white/10 hover:bg-[#22222c]'
                }`}
              >
                <StadiumIcon className="w-3.5 h-3.5" />
                <span>360° Circular Arena</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplatePreset('square_stadium')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer border flex items-center gap-1.5 ${
                  venueType === 'square_stadium'
                    ? 'bg-[#1ed760] text-black border-[#1ed760] font-black'
                    : 'bg-[#18181f] text-[#b3b3b3] hover:text-white border-white/10 hover:bg-[#22222c]'
                }`}
              >
                <StadiumIcon className="w-3.5 h-3.5" />
                <span>Rectangular Stadium</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplatePreset('amphitheatre')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer border flex items-center gap-1.5 ${
                  venueType === 'amphitheatre'
                    ? 'bg-[#1ed760] text-black border-[#1ed760] font-black'
                    : 'bg-[#18181f] text-[#b3b3b3] hover:text-white border-white/10 hover:bg-[#22222c]'
                }`}
              >
                <TheatreIcon className="w-3.5 h-3.5" />
                <span>Concert Amphitheatre</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#7c7c7c] font-mono">
              Prefix Central Aisle Active
            </span>
          </div>
        </div>

        {/* ─── MAIN DUAL-PANE WORKSPACE ─── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-100px)]">
          {/* ─── LEFT PANEL: PER-ROW & VENUE INSPECTOR (4 COLS) ─── */}
          <div className="lg:col-span-4 bg-[#0d0d12] border-r border-white/10 p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto h-full">
            {/* Top Section: Venue Details & Category Tiers */}
            <div className="space-y-4">
              {/* 1. Venue Details */}
              <div className="space-y-3 bg-[#13131a] p-3.5 sm:p-4 rounded-2xl border border-white/5 shadow-md">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1ed760] flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" /> 1. Venue Details
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Venue / Stadium / Cinema Name"
                    className="w-full bg-[#0a0a0e] border border-[#2a2a35] focus:border-[#1ed760] text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors placeholder:text-[#555555]"
                  />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Physical Address & City Location"
                    className="w-full bg-[#0a0a0e] border border-[#2a2a35] focus:border-[#1ed760] text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none transition-colors placeholder:text-[#555555]"
                  />
                </div>
              </div>

              {/* 2. Category Tiers Manager */}
              <div className="space-y-3 bg-[#13131a] p-3.5 sm:p-4 rounded-2xl border border-white/5 shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1ed760] flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> 2. Category Tiers ({categories.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const nextNum = categories.length + 1;
                      const defaultColors = ['#1ed760', '#1db954', '#ffffff', '#b3b3b3', '#7c7c7c'];
                      setCategories([
                        ...categories,
                        {
                          name: `Tier ${nextNum}`,
                          color: defaultColors[(nextNum - 1) % defaultColors.length],
                          isRecliner: false,
                          price: 300,
                        },
                      ]);
                    }}
                    className="text-xs text-[#1ed760] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Tier
                  </button>
                </div>

                <div className="space-y-2">
                  {categories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#0a0a0e] border border-white/5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <ColorPicker
                          value={cat.color || '#1ed760'}
                          onChange={(colorStr) => {
                            const updated = [...categories];
                            updated[idx].color = colorStr;
                            setCategories(updated);
                          }}
                        />
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => {
                            const updated = [...categories];
                            updated[idx].name = e.target.value;
                            setCategories(updated);
                          }}
                          className="bg-transparent text-white font-bold text-xs focus:outline-none flex-1 border-b border-transparent focus:border-white/30"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...categories];
                            updated[idx].isRecliner = !updated[idx].isRecliner;
                            setCategories(updated);
                          }}
                          className={`p-1.5 rounded-lg border text-[10px] font-mono cursor-pointer transition-colors ${
                            cat.isRecliner
                              ? 'bg-[#1ed760]/20 text-[#1ed760] border-[#1ed760]'
                              : 'bg-[#18181f] text-[#7c7c7c] border-white/5'
                          }`}
                          title="Toggle VIP Recliner"
                        >
                          <Armchair className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section: 🎯 PER-ROW / PER-LINE INDIVIDUAL CUSTOMIZER */}
            <div className="bg-[#13131a] p-4 rounded-2xl border border-white/10 space-y-3.5 shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1ed760] flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5" /> 3. Row Customizer
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const nextLetter = String.fromCharCode(65 + rowConfigs.length);
                      setRowConfigs([
                        ...rowConfigs,
                        {
                          label: nextLetter,
                          seatCount: 18,
                          categoryIndex: Math.min(1, categories.length - 1),
                          isRecliner: false,
                        },
                      ]);
                    }}
                    className="px-2.5 py-1 bg-[#181822] hover:bg-[#252532] text-[#1ed760] rounded-xl text-[11px] font-bold border border-white/10 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                </div>

                {/* Row Selector Pill Strip */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                    {rowConfigs.map((r, idx) => {
                      const isSelected = selectedRowIndex === idx;
                      const cat = categories[r.categoryIndex] || { color: '#1ed760' };

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedRowIndex(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 border ${
                            isSelected
                              ? 'bg-[#1ed760] text-black border-[#1ed760] font-black shadow-lg scale-105'
                              : 'bg-[#0a0a0e] text-[#b3b3b3] hover:text-white border-white/5'
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? '#000' : cat.color }} />
                          <span>{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Row Property Card */}
                {selectedRow && (
                  <div className="p-3.5 bg-[#0a0a0e] rounded-xl border border-white/10 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div>
                        <span className="font-black text-white text-sm block">
                          {selectedRow.label.length > 2 ? selectedRow.label : `Row ${selectedRow.label}`}
                        </span>
                        <span className="text-[11px] text-[#7c7c7c] font-mono">
                          {selectedRow.seatCount} Seats &bull; {selectedRow.isRecliner ? 'VIP Recliner' : 'Prime / Classic'}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={rowConfigs.length <= 1}
                        onClick={() => {
                          const updated = rowConfigs.filter((_, i) => i !== selectedRowIndex);
                          setRowConfigs(updated);
                          if (selectedRowIndex >= updated.length) {
                            setSelectedRowIndex(Math.max(0, updated.length - 1));
                          }
                        }}
                        className="text-[#f3727f] hover:underline text-[11px] font-bold cursor-pointer disabled:opacity-30 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Row
                      </button>
                    </div>

                    {/* Seat Model Type Toggle */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#b3b3b3] block">
                        Seat Ergonomic Type:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...rowConfigs];
                            updated[selectedRowIndex].isRecliner = false;
                            setRowConfigs(updated);
                          }}
                          className={`p-2 rounded-xl border flex items-center gap-2 font-bold cursor-pointer transition-all ${
                            !selectedRow.isRecliner
                              ? 'bg-[#1ed760]/20 border-[#1ed760] text-white shadow-sm'
                              : 'bg-[#14141a] border-white/5 text-[#7c7c7c] hover:text-white'
                          }`}
                        >
                          <div className="w-5 h-5 flex-shrink-0">
                            <NormalSeatSvg col="" isRotated={false} categoryColor="#1ed760" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs">Normal / Prime</div>
                            <div className="text-[9px] text-[#7c7c7c]">Standard Chair</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...rowConfigs];
                            updated[selectedRowIndex].isRecliner = true;
                            setRowConfigs(updated);
                          }}
                          className={`p-2 rounded-xl border flex items-center gap-2 font-bold cursor-pointer transition-all ${
                            selectedRow.isRecliner
                              ? 'bg-[#1ed760]/20 border-[#1ed760] text-white shadow-sm'
                              : 'bg-[#14141a] border-white/5 text-[#7c7c7c] hover:text-white'
                          }`}
                        >
                          <div className="w-5 h-6 flex-shrink-0">
                            <ReclinerSeatSvg col="" isRotated={false} categoryColor="#1ed760" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs">VIP Recliner</div>
                            <div className="text-[9px] text-[#1ed760]">Leather Lounger</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* ─── ULTRA-MODERN SEAT COUNT SLIDER ─── */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#b3b3b3] font-bold">Seat Count for Row:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#1ed760] bg-[#1ed760]/10 px-2 py-0.5 rounded-md border border-[#1ed760]/20">
                            {selectedRow.seatCount} Seats
                          </span>
                        </div>
                      </div>

                      {/* Custom Sleek Slider Control */}
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1 flex items-center group py-2">
                          {/* Modern Track */}
                          <div className="w-full h-2 rounded-full bg-[#1c1c28] relative overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#1ed760] via-[#10b981] to-[#38bdf8] rounded-full transition-all duration-75"
                              style={{
                                width: `${Math.min(100, Math.max(0, ((selectedRow.seatCount - 4) / (100 - 4)) * 100))}%`,
                              }}
                            />
                          </div>

                          {/* Interactive Range Input */}
                          <input
                            type="range"
                            min={4}
                            max={100}
                            value={selectedRow.seatCount}
                            onChange={(e) => {
                              const updated = [...rowConfigs];
                              updated[selectedRowIndex].seatCount = parseInt(e.target.value, 10);
                              setRowConfigs(updated);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          />

                          {/* Glowing Modern Thumb */}
                          <div
                            className="absolute w-4 h-4 rounded-full bg-white shadow-[0_0_12px_rgba(30,215,96,0.9)] border-2 border-[#1ed760] pointer-events-none -ml-2 transition-transform duration-75 group-hover:scale-125 z-10"
                            style={{
                              left: `${Math.min(100, Math.max(0, ((selectedRow.seatCount - 4) / (100 - 4)) * 100))}%`,
                            }}
                          />
                        </div>

                        {/* Increment / Decrement Stepper */}
                        <div className="flex items-center gap-1 bg-[#14141e] border border-white/10 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...rowConfigs];
                              updated[selectedRowIndex].seatCount = Math.max(4, selectedRow.seatCount - 2);
                              setRowConfigs(updated);
                            }}
                            className="w-6 h-6 rounded-lg bg-[#20202c] hover:bg-[#1ed760] hover:text-black text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-xs"
                            title="Decrease Seats"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min={4}
                            max={100}
                            value={selectedRow.seatCount}
                            onChange={(e) => {
                              const updated = [...rowConfigs];
                              updated[selectedRowIndex].seatCount = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setRowConfigs(updated);
                            }}
                            className="w-8 bg-transparent text-center font-mono font-black text-white text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...rowConfigs];
                              updated[selectedRowIndex].seatCount = Math.min(100, selectedRow.seatCount + 2);
                              setRowConfigs(updated);
                            }}
                            className="w-6 h-6 rounded-lg bg-[#20202c] hover:bg-[#1ed760] hover:text-black text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-xs"
                            title="Increase Seats"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Category Assignment for Selected Row */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[#b3b3b3] block font-bold text-[11px]">Tier Category:</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {categories.map((c, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => {
                              const updated = [...rowConfigs];
                              updated[selectedRowIndex].categoryIndex = cIdx;
                              if (c.isRecliner !== undefined) {
                                updated[selectedRowIndex].isRecliner = !!c.isRecliner;
                              }
                              setRowConfigs(updated);
                            }}
                            className={`p-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                              selectedRow.categoryIndex === cIdx
                                ? 'bg-[#1ed760]/20 border-[#1ed760] text-white shadow-sm'
                                : 'bg-[#14141a] border-white/5 text-[#b3b3b3] hover:text-white'
                            }`}
                          >
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                            <span className="truncate">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Summary */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#7c7c7c]">
                <span>Architecture: <strong className="text-white uppercase">{venueType}</strong></span>
                <span>Active Seats: <strong className="text-[#1ed760]">{totalCalculatedSeats}</strong></span>
              </div>
            </div>
          </div>

          {/* ─── RIGHT PANEL: AUTHENTIC THEATRE & ARENA SKELETON CANVAS (8 COLS) ─── */}
          <div className="lg:col-span-8 bg-[#060608] flex flex-col justify-between overflow-hidden h-full relative">
            <div className="w-full h-full overflow-auto flex flex-col items-center justify-start p-4 sm:p-8 scrollbar-none">
              {venueType === 'cinema' ? (
                /* ─── 1. EXACT CINEMA AUDITORIUM CANVAS (MATCHING CUSTOMER VIEW) ─── */
                <div className="w-full max-w-4xl flex flex-col items-center space-y-6">
                  {/* 3D Curved Laser Screen */}
                  <AuditoriumScreen3D />

                  {/* Sound Wave Indicators */}
                  <div className="w-full flex items-center justify-between px-6 text-[10px] font-mono text-[#555566] uppercase tracking-widest select-none">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-[#1ed760]" /> DOLBY ATMOS 7.1.4
                    </span>
                    <span className="flex items-center gap-1">
                      IMAX LASER PROJECTION <Sparkles className="w-3.5 h-3.5 text-[#ffa42b]" />
                    </span>
                  </div>

                  {/* Seating Layout with Real Normal / Recliner Armchairs */}
                  <div className="w-full space-y-3 flex flex-col items-center">
                    {rowConfigs.map((rConfig, rIdx) => {
                      const isSelected = selectedRowIndex === rIdx;
                      const cat = categories[rConfig.categoryIndex] || { color: '#1ed760', name: 'Standard' };
                      const count = rConfig.seatCount;
                      const isRecliner = !!rConfig.isRecliner;
                      const half = Math.floor(count / 2);

                      const leftSeats = Array.from({ length: half }, (_, i) => i + 1);
                      const rightSeats = Array.from({ length: count - half }, (_, i) => half + i + 1);

                      return (
                        <div
                          key={rIdx}
                          onClick={() => setSelectedRowIndex(rIdx)}
                          className="w-full max-w-3xl flex items-center justify-center gap-2 sm:gap-4 p-2 rounded-2xl transition-all cursor-pointer border border-transparent hover:bg-[#15151c]"
                        >
                          {/* Row Letter Left */}
                          <span className={`w-6 text-xs font-mono font-black text-center ${isSelected ? 'text-[#1ed760]' : 'text-[#b3b3b3]'}`}>
                            {rConfig.label}
                          </span>

                          {/* Left Bank of Seats */}
                          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
                            {leftSeats.map((seatNum) => (
                              <div
                                key={`L-${seatNum}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRowIndex(rIdx);
                                }}
                                className={`relative flex items-center justify-center transition-transform hover:scale-110 ${
                                  isRecliner ? 'w-7 h-9 sm:w-8 sm:h-10' : 'w-6 h-6 sm:w-7 sm:h-7'
                                }`}
                                title={`${rConfig.label}${seatNum} (${cat.name})`}
                              >
                                {isRecliner ? (
                                  <ReclinerSeatSvg
                                    col={seatNum}
                                    isRotated={true}
                                    categoryColor={cat.color}
                                    isSelected={false}
                                  />
                                ) : (
                                  <NormalSeatSvg
                                    col={seatNum}
                                    isRotated={true}
                                    categoryColor={cat.color}
                                    isSelected={false}
                                  />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Prefixed Center Aisle Walkway */}
                          <AisleStairsGraphic label="AISLE" />

                          {/* Right Bank of Seats */}
                          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-start">
                            {rightSeats.map((seatNum) => (
                              <div
                                key={`R-${seatNum}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRowIndex(rIdx);
                                }}
                                className={`relative flex items-center justify-center transition-transform hover:scale-110 ${
                                  isRecliner ? 'w-7 h-9 sm:w-8 sm:h-10' : 'w-6 h-6 sm:w-7 sm:h-7'
                                }`}
                                title={`${rConfig.label}${seatNum} (${cat.name})`}
                              >
                                {isRecliner ? (
                                  <ReclinerSeatSvg
                                    col={seatNum}
                                    isRotated={true}
                                    categoryColor={cat.color}
                                    isSelected={false}
                                  />
                                ) : (
                                  <NormalSeatSvg
                                    col={seatNum}
                                    isRotated={true}
                                    categoryColor={cat.color}
                                    isSelected={false}
                                  />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Row Letter Right */}
                          <span className="w-6 text-xs font-mono font-black text-center text-[#b3b3b3]">
                            {rConfig.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : venueType === 'stadium' ? (
                /* ─── 2. EXACT 360° CIRCULAR ARENA CANVAS (FIXED CLEAN PROPORTIONS) ─── */
                <div className="w-full flex flex-col items-center justify-center py-2">
                  <div className="relative w-full max-w-3xl aspect-square flex items-center justify-center">
                    <svg viewBox="100 100 1000 1000" className="w-full h-full overflow-visible">
                      {/* Outer Arena Boundary */}
                      <circle
                        cx="600"
                        cy="600"
                        r={190 + (rowConfigs.length + 0.8) * 52}
                        fill="#0c0c10"
                        stroke="#22222e"
                        strokeWidth="2.5"
                      />

                      {/* 4 Radiating Staircase Aisle Walkways */}
                      {[0, 1, 2, 3].map((sIdx) => {
                        const angle = (sIdx / 4) * 2 * Math.PI - Math.PI / 2;
                        const outerR = 190 + (rowConfigs.length + 0.6) * 52;
                        const x1 = 600 + 155 * Math.cos(angle);
                        const y1 = 600 + 155 * Math.sin(angle);
                        const x2 = 600 + outerR * Math.cos(angle);
                        const y2 = 600 + outerR * Math.sin(angle);

                        return (
                          <g key={`stair-aisle-${sIdx}`}>
                            <line
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke="#14141e"
                              strokeWidth="24"
                              strokeDasharray="3 5"
                            />
                            {rowConfigs.map((_, rIdx) => {
                              const stepR = 190 + rIdx * 52;
                              const sx = 600 + stepR * Math.cos(angle);
                              const sy = 600 + stepR * Math.sin(angle);
                              const deg = (angle * 180) / Math.PI + 90;
                              return (
                                <line
                                  key={`step-${sIdx}-${rIdx}`}
                                  x1={sx - 11}
                                  y1={sy}
                                  x2={sx + 11}
                                  y2={sy}
                                  stroke="#444455"
                                  strokeWidth="2"
                                  transform={`rotate(${deg} ${sx} ${sy})`}
                                />
                              );
                            })}
                          </g>
                        );
                      })}

                      {/* Concentric Tier Guide Rings & Rotated Seats */}
                      {rowConfigs.map((rConfig, rIdx) => {
                        const radius = 190 + rIdx * 52;
                        const isSelected = selectedRowIndex === rIdx;
                        const cat = categories[rConfig.categoryIndex] || { color: '#1ed760', name: 'Standard' };
                        const seatCount = rConfig.seatCount || 20;
                        const numSectors = 4;
                        const stairAngleWidth = (12 * Math.PI) / 180;
                        const sectorSpan = (2 * Math.PI) / numSectors;
                        const sectorArc = sectorSpan - stairAngleWidth;
                        const seatsPerSector = Math.floor(seatCount / numSectors);

                        // Calculate proportional seat width based on circumference
                        const seatW = Math.min(46, (2 * Math.PI * radius) / (seatCount * 1.5));
                        const scale = seatW / 100;

                        return (
                          <g key={`ring-${rIdx}`} onClick={() => setSelectedRowIndex(rIdx)} className="cursor-pointer">
                            {/* Guide Ring */}
                            <circle
                              cx="600"
                              cy="600"
                              r={radius}
                              fill="none"
                              stroke={isSelected ? '#ffffff' : '#1e1e28'}
                              strokeWidth={isSelected ? '2.5' : '1'}
                              strokeDasharray={isSelected ? undefined : '4 6'}
                            />

                            {/* Radial Seats */}
                            {Array.from({ length: numSectors }).map((_, s) => {
                              const sectorStartAngle = s * sectorSpan - Math.PI / 2 + stairAngleWidth / 2;

                              return Array.from({ length: seatsPerSector }).map((_, sc) => {
                                const seatNum = s * seatsPerSector + sc + 1;
                                const seatAngle = sectorStartAngle + ((sc + 0.5) / seatsPerSector) * sectorArc;
                                const x = 600 + radius * Math.cos(seatAngle);
                                const y = 600 + radius * Math.sin(seatAngle);
                                const rot = (seatAngle * 180) / Math.PI + 90;
                                const seatH = rConfig.isRecliner ? seatW * 1.4 : seatW;

                                return (
                                  <g
                                    key={`stadium-seat-${rIdx}-${seatNum}`}
                                    transform={`translate(${x}, ${y}) rotate(${rot})`}
                                    className={`transition-transform duration-75 hover:scale-110 ${
                                      isSelected ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]' : ''
                                    }`}
                                  >
                                    <svg x={-seatW / 2} y={-seatH / 2} width={seatW} height={seatH} overflow="visible">
                                      {rConfig.isRecliner ? (
                                        <ReclinerSeatSvg
                                          col={seatNum}
                                          isRotated={false}
                                          categoryColor={isSelected ? '#ffffff' : cat.color}
                                          isSelected={false}
                                        />
                                      ) : (
                                        <NormalSeatSvg
                                          col={seatNum}
                                          isRotated={false}
                                          categoryColor={isSelected ? '#ffffff' : cat.color}
                                          isSelected={false}
                                        />
                                      )}
                                    </svg>
                                  </g>
                                );
                              });
                            })}
                          </g>
                        );
                      })}

                      {/* Center Stage Hexagon */}
                      <g transform="translate(545, 545)">
                        <polygon
                          points="55,0 110,32 110,96 55,128 0,96 0,32"
                          fill="#101018"
                          stroke="#1ed760"
                          strokeWidth="3"
                          className="drop-shadow-[0_0_20px_rgba(30,215,96,0.35)]"
                        />
                        <text
                          x="55"
                          y="58"
                          textAnchor="middle"
                          fill="#1ed760"
                          fontSize="13"
                          fontWeight="900"
                          fontFamily="sans-serif"
                          letterSpacing="1.5"
                        >
                          STAGE
                        </text>
                        <text
                          x="55"
                          y="76"
                          textAnchor="middle"
                          fill="#b3b3b3"
                          fontSize="9"
                          fontWeight="700"
                          fontFamily="sans-serif"
                        >
                          CENTER 360°
                        </text>
                      </g>

                      {/* 4 Grandstand Labels */}
                      <text x="600" y="65" textAnchor="middle" fill="#777788" fontSize="12" fontWeight="800" letterSpacing="2">
                        NORTH STAND • SEC 101
                      </text>
                      <text x="1135" y="605" textAnchor="middle" fill="#777788" fontSize="12" fontWeight="800" letterSpacing="2" transform="rotate(90 1135 605)">
                        EAST GRANDSTAND • SEC 102
                      </text>
                      <text x="600" y="1145" textAnchor="middle" fill="#777788" fontSize="12" fontWeight="800" letterSpacing="2">
                        SOUTH PAVILION • SEC 103
                      </text>
                      <text x="65" y="605" textAnchor="middle" fill="#777788" fontSize="12" fontWeight="800" letterSpacing="2" transform="rotate(-90 65 605)">
                        WEST GRANDSTAND • SEC 104
                      </text>
                    </svg>
                  </div>
                </div>
              ) : venueType === 'square_stadium' ? (
                /* ─── 3. RECTANGULAR / SQUARE STADIUM GRANDSTAND CANVAS ─── */
                <div className="w-full flex flex-col items-center justify-center py-2">
                  <div className="relative w-full max-w-5xl aspect-[4/3] flex items-center justify-center select-none">
                    <svg viewBox="0 0 1200 900" className="w-full h-full overflow-visible">
                      {/* Outer Rectangular Arena Boundary */}
                      <rect
                        x={600 - (240 + rowConfigs.length * 44)}
                        y={450 - (160 + rowConfigs.length * 44)}
                        width={(240 + rowConfigs.length * 44) * 2}
                        height={(160 + rowConfigs.length * 44) * 2}
                        rx="24"
                        fill="#0c0c10"
                        stroke="#22222e"
                        strokeWidth="2.5"
                      />

                      {/* 4 Corner Staircase Corridors */}
                      {[-1, 1].map((dirX) =>
                        [-1, 1].map((dirY) => {
                          const innerX = 600 + dirX * 220;
                          const innerY = 450 + dirY * 140;
                          const outerX = 600 + dirX * (240 + rowConfigs.length * 44);
                          const outerY = 450 + dirY * (160 + rowConfigs.length * 44);

                          return (
                            <line
                              key={`corner-stair-${dirX}-${dirY}`}
                              x1={innerX}
                              y1={innerY}
                              x2={outerX}
                              y2={outerY}
                              stroke="#181824"
                              strokeWidth="18"
                              strokeDasharray="3 5"
                            />
                          );
                        })
                      )}

                      {/* Concentric Rectangular Tiers of Seats */}
                      {rowConfigs.map((rConfig, rIdx) => {
                        const isSelected = selectedRowIndex === rIdx;
                        const cat = categories[rConfig.categoryIndex] || { color: '#1ed760', name: 'Standard' };
                        const seatCount = rConfig.seatCount || 32;
                        const tierW = 220 + rIdx * 44;
                        const tierH = 140 + rIdx * 44;

                        // Distribute seats around 4 stands
                        const northCount = Math.max(2, Math.round(seatCount * 0.32));
                        const southCount = Math.max(2, Math.round(seatCount * 0.32));
                        const westCount = Math.max(1, Math.round((seatCount - northCount - southCount) / 2));
                        const eastCount = Math.max(1, seatCount - northCount - southCount - westCount);

                        const seatW = Math.max(22, Math.min(42, (tierW * 2) / (northCount * 1.25)));
                        const seatH = rConfig.isRecliner ? seatW * 1.35 : seatW;

                        return (
                          <g key={`square-tier-${rIdx}`} onClick={() => setSelectedRowIndex(rIdx)} className="cursor-pointer">
                            {/* Rectangular Guide Ring */}
                            <rect
                              x={600 - tierW}
                              y={450 - tierH}
                              width={tierW * 2}
                              height={tierH * 2}
                              rx="16"
                              fill="none"
                              stroke={isSelected ? '#ffffff' : '#1e1e28'}
                              strokeWidth={isSelected ? '2.5' : '1'}
                              strokeDasharray={isSelected ? undefined : '4 6'}
                            />

                            {/* North Stand (Top) - Facing Down towards Center Stage */}
                            {Array.from({ length: northCount }).map((_, sIdx) => {
                              const seatNum = sIdx + 1;
                              const x = 600 - tierW + 20 + ((sIdx + 0.5) / northCount) * (tierW * 2 - 40);
                              const y = 450 - tierH;
                              return (
                                <g
                                  key={`n-${rIdx}-${seatNum}`}
                                  transform={`translate(${x}, ${y}) rotate(0)`}
                                  className={`transition-transform duration-75 hover:scale-110 ${
                                    isSelected ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]' : ''
                                  }`}
                                >
                                  <svg x={-seatW / 2} y={-seatH / 2} width={seatW} height={seatH} overflow="visible">
                                    {rConfig.isRecliner ? (
                                      <ReclinerSeatSvg
                                        col={seatNum}
                                        isRotated={false}
                                        categoryColor={isSelected ? '#ffffff' : cat.color}
                                        isSelected={false}
                                      />
                                    ) : (
                                      <NormalSeatSvg
                                        col={seatNum}
                                        isRotated={false}
                                        categoryColor={isSelected ? '#ffffff' : cat.color}
                                        isSelected={false}
                                      />
                                    )}
                                  </svg>
                                </g>
                              );
                            })}

                            {/* South Stand (Bottom) - Facing Up towards Center Stage */}
                            {Array.from({ length: southCount }).map((_, sIdx) => {
                              const seatNum = northCount + sIdx + 1;
                              const x = 600 - tierW + 20 + ((sIdx + 0.5) / southCount) * (tierW * 2 - 40);
                              const y = 450 + tierH;
                              return (
                                <g
                                  key={`s-${rIdx}-${seatNum}`}
                                  transform={`translate(${x}, ${y}) rotate(180)`}
                                  className={`transition-transform duration-75 hover:scale-110 ${
                                    isSelected ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]' : ''
                                  }`}
                                >
                                  <svg x={-seatW / 2} y={-seatH / 2} width={seatW} height={seatH} overflow="visible">
                                    {rConfig.isRecliner ? (
                                      <ReclinerSeatSvg
                                        col={seatNum}
                                        isRotated={false}
                                        categoryColor={isSelected ? '#ffffff' : cat.color}
                                        isSelected={false}
                                      />
                                    ) : (
                                      <NormalSeatSvg
                                        col={seatNum}
                                        isRotated={false}
                                        categoryColor={isSelected ? '#ffffff' : cat.color}
                                        isSelected={false}
                                      />
                                    )}
                                  </svg>
                                </g>
                              );
                            })}

                            {/* West Stand (Left) - Facing Right towards Center Stage */}
                            {Array.from({ length: westCount }).map((_, sIdx) => {
                              const seatNum = northCount + southCount + sIdx + 1;
                              const x = 600 - tierW;
                              const y = 450 - tierH + 20 + ((sIdx + 0.5) / westCount) * (tierH * 2 - 40);
                              return (
                                <g
                                  key={`w-${rIdx}-${seatNum}`}
                                  transform={`translate(${x}, ${y}) rotate(-90)`}
                                  className={`transition-transform duration-75 hover:scale-110 ${
                                    isSelected ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]' : ''
                                  }`}
                                >
                                  <svg x={-seatW / 2} y={-seatH / 2} width={seatW} height={seatH} overflow="visible">
                                    {rConfig.isRecliner ? (
                                      <ReclinerSeatSvg
                                        col={seatNum}
                                        isRotated={false}
                                        categoryColor={isSelected ? '#ffffff' : cat.color}
                                        isSelected={false}
                                      />
                                    ) : (
                                      <NormalSeatSvg
                                        col={seatNum}
                                        isRotated={false}
                                        categoryColor={isSelected ? '#ffffff' : cat.color}
                                        isSelected={false}
                                      />
                                    )}
                                  </svg>
                                </g>
                              );
                            })}

                            {/* East Stand (Right) - Facing Left towards Center Stage */}
                            {Array.from({ length: eastCount }).map((_, sIdx) => {
                              const seatNum = northCount + southCount + westCount + sIdx + 1;
                              const x = 600 + tierW;
                              const y = 450 - tierH + 20 + ((sIdx + 0.5) / eastCount) * (tierH * 2 - 40);
                              return (
                                <g
                                  key={`e-${rIdx}-${seatNum}`}
                                  transform={`translate(${x}, ${y}) rotate(90)`}
                                  className={`transition-transform duration-75 hover:scale-110 ${
                                    isSelected ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]' : ''
                                  }`}
                                >
                                  <svg x={-seatW / 2} y={-seatH / 2} width={seatW} height={seatH} overflow="visible">
                                    {rConfig.isRecliner ? (
                                      <ReclinerSeatSvg
                                        col={seatNum}
                                        isRotated={false}
                                        categoryColor={isSelected ? '#ffffff' : cat.color}
                                        isSelected={false}
                                      />
                                    ) : (
                                      <NormalSeatSvg
                                        col={seatNum}
                                        isRotated={false}
                                        categoryColor={isSelected ? '#ffffff' : cat.color}
                                        isSelected={false}
                                      />
                                    )}
                                  </svg>
                                </g>
                              );
                            })}
                          </g>
                        );
                      })}

                      {/* Central 3D Arena Stage Platform */}
                      <g transform="translate(450, 380)">
                        <defs>
                          <linearGradient id="squareStageGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1e1e24" />
                            <stop offset="60%" stopColor="#141418" />
                            <stop offset="100%" stopColor="#0a0a0c" />
                          </linearGradient>
                        </defs>
                        {/* 3D Stage Deck */}
                        <rect
                          x="0"
                          y="0"
                          width="300"
                          height="140"
                          rx="14"
                          fill="url(#squareStageGrad)"
                          stroke="#1ed760"
                          strokeWidth="2.5"
                          className="drop-shadow-[0_0_25px_rgba(30,215,96,0.3)]"
                        />

                        {/* Inner Stage Grid Texture */}
                        <rect x="20" y="20" width="260" height="100" rx="8" fill="none" stroke="#252530" strokeWidth="1.5" strokeDasharray="4 4" />

                        {/* Center Clean Typography (No Conflicting Circles) */}
                        <text
                          x="150"
                          y="68"
                          textAnchor="middle"
                          fill="#1ed760"
                          fontSize="15"
                          fontWeight="900"
                          fontFamily="sans-serif"
                          letterSpacing="3"
                        >
                          STAGE
                        </text>
                        <text
                          x="150"
                          y="88"
                          textAnchor="middle"
                          fill="#b3b3b3"
                          fontSize="9.5"
                          fontWeight="800"
                          fontFamily="sans-serif"
                          letterSpacing="2"
                        >
                          CENTER ARENA
                        </text>
                      </g>

                      {/* 4 Grandstand Labels */}
                      <text x="600" y="45" textAnchor="middle" fill="#777788" fontSize="12" fontWeight="800" letterSpacing="2">
                        NORTH GRANDSTAND • SEC 101
                      </text>
                      <text x="1165" y="450" textAnchor="middle" fill="#777788" fontSize="12" fontWeight="800" letterSpacing="2" transform="rotate(90 1165 450)">
                        EAST STAND • SEC 102
                      </text>
                      <text x="600" y="875" textAnchor="middle" fill="#777788" fontSize="12" fontWeight="800" letterSpacing="2">
                        SOUTH GRANDSTAND • SEC 103
                      </text>
                      <text x="35" y="450" textAnchor="middle" fill="#777788" fontSize="12" fontWeight="800" letterSpacing="2" transform="rotate(-90 35 450)">
                        WEST PAVILION • SEC 104
                      </text>
                    </svg>
                  </div>
                </div>
              ) : (
                /* ─── 4. REALISTIC 3D PROSCENIUM AMPHITHEATRE STAGE & SEATING ─── */
                <div className="w-full max-w-5xl flex flex-col items-center space-y-4">
                  {/* Radial Fan-Tier Amphitheatre Seating with 3D Stage */}
                  <div className="w-full flex flex-col items-center py-2">
                    <div className="relative w-full aspect-[16/11] flex items-center justify-center">
                      <svg viewBox="60 -20 880 620" className="w-full h-full overflow-visible">
                        <defs>
                          {/* 3D Stage Deck Gradients */}
                          <linearGradient id="amphiStageBody" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#222228" />
                            <stop offset="40%" stopColor="#15151c" />
                            <stop offset="100%" stopColor="#0c0c10" />
                          </linearGradient>
                          <linearGradient id="amphiStageTopLip" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#1ed760" stopOpacity="0.2" />
                            <stop offset="25%" stopColor="#1ed760" stopOpacity="0.9" />
                            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                            <stop offset="75%" stopColor="#1ed760" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#1ed760" stopOpacity="0.2" />
                          </linearGradient>
                          <linearGradient id="amphiStageBeam" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1ed760" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#1ed760" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* 1. Atmospheric Volumetric Downward Lighting */}
                        <path
                          d="M 220 50 Q 500 -10 780 50 L 820 120 Q 500 70 180 120 Z"
                          fill="url(#amphiStageBeam)"
                        />

                        {/* 2. 3D Curved Stage Deck Surface */}
                        <path
                          d="M 220 48 Q 500 0 780 48 L 760 90 Q 500 55 240 90 Z"
                          fill="url(#amphiStageBody)"
                          stroke="#333340"
                          strokeWidth="1.5"
                        />

                        {/* 3. High-Intensity Neon Glow Top Curved Lip */}
                        <path
                          d="M 220 48 Q 500 0 780 48"
                          stroke="url(#amphiStageTopLip)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          className="drop-shadow-[0_0_12px_rgba(30,215,96,0.9)]"
                        />

                        {/* 4. Front Apron Perspective Edge */}
                        <path
                          d="M 240 90 Q 500 55 760 90"
                          stroke="#1ed760"
                          strokeWidth="1.5"
                          strokeOpacity="0.7"
                          strokeLinecap="round"
                        />

                        {/* Stage Center Labels */}
                        <text
                          x="500"
                          y="45"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="13"
                          fontWeight="900"
                          fontFamily="sans-serif"
                          letterSpacing="3"
                        >
                          🎭 3D PROSCENIUM STAGE
                        </text>
                        <text
                          x="500"
                          y="65"
                          textAnchor="middle"
                          fill="#1ed760"
                          fontSize="9"
                          fontWeight="800"
                          fontFamily="sans-serif"
                          letterSpacing="2"
                        >
                          • ACOUSTIC LIVE CONCERT AUDITORIUM •
                        </text>

                        {/* Generous Space Before Row 1 */}
                        {rowConfigs.map((rConfig, rIdx) => {
                          const isSelected = selectedRowIndex === rIdx;
                          const cat = categories[rConfig.categoryIndex] || { color: '#1ed760', name: 'Standard' };
                          const count = rConfig.seatCount || 16;
                          const isRecliner = !!rConfig.isRecliner;

                          // Arc geometry centered above stage at (500, -70)
                          const fCenterY = -70;
                          const fRadius = 220 + rIdx * 64;
                          const spanAngle = (88 * Math.PI) / 180;
                          const halfSpan = spanAngle / 2;
                          const half = Math.floor(count / 2);
                          const aisleAngleGap = (6 * Math.PI) / 180;

                          // Left bank span
                          const leftStart = Math.PI / 2 - halfSpan;
                          const leftEnd = Math.PI / 2 - aisleAngleGap / 2;
                          // Right bank span
                          const rightStart = Math.PI / 2 + aisleAngleGap / 2;
                          const rightEnd = Math.PI / 2 + halfSpan;

                          const seatW = Math.max(22, Math.min(48, (fRadius * spanAngle) / (count * 1.05)));
                          const seatH = isRecliner ? seatW * 1.4 : seatW;

                          return (
                            <g key={`amp-fan-tier-${rIdx}`} onClick={() => setSelectedRowIndex(rIdx)} className="cursor-pointer">
                              {/* Guide Curved Arch */}
                              <path
                                d={`M ${500 + fRadius * Math.cos(leftStart)} ${fCenterY + fRadius * Math.sin(leftStart)} A ${fRadius} ${fRadius} 0 0 1 ${500 + fRadius * Math.cos(rightEnd)} ${fCenterY + fRadius * Math.sin(rightEnd)}`}
                                fill="none"
                                stroke={isSelected ? '#ffffff' : '#1f1f2a'}
                                strokeWidth={isSelected ? '2.5' : '1'}
                                strokeDasharray={isSelected ? undefined : '4 6'}
                              />

                              {/* Left Bank Seats - Facing UP radially towards the Stage */}
                              {Array.from({ length: half }).map((_, sIdx) => {
                                const seatNum = sIdx + 1;
                                const sAngle = leftStart + ((sIdx + 0.5) / half) * (leftEnd - leftStart);
                                const sx = 500 + fRadius * Math.cos(sAngle);
                                const sy = fCenterY + fRadius * Math.sin(sAngle);
                                const rot = (sAngle * 180) / Math.PI + 90;

                                return (
                                  <g
                                    key={`amp-l-${rIdx}-${seatNum}`}
                                    transform={`translate(${sx}, ${sy}) rotate(${rot})`}
                                    className={`transition-transform duration-75 hover:scale-110 ${
                                      isSelected ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]' : ''
                                    }`}
                                  >
                                    <svg x={-seatW / 2} y={-seatH / 2} width={seatW} height={seatH} overflow="visible">
                                      {isRecliner ? (
                                        <ReclinerSeatSvg
                                          col={seatNum}
                                          isRotated={false}
                                          categoryColor={isSelected ? '#ffffff' : cat.color}
                                          isSelected={false}
                                        />
                                      ) : (
                                        <NormalSeatSvg
                                          col={seatNum}
                                          isRotated={false}
                                          categoryColor={isSelected ? '#ffffff' : cat.color}
                                          isSelected={false}
                                        />
                                      )}
                                    </svg>
                                  </g>
                                );
                              })}

                              {/* Right Bank Seats - Facing UP radially towards the Stage */}
                              {Array.from({ length: count - half }).map((_, sIdx) => {
                                const seatNum = half + sIdx + 1;
                                const sAngle = rightStart + ((sIdx + 0.5) / (count - half)) * (rightEnd - rightStart);
                                const sx = 500 + fRadius * Math.cos(sAngle);
                                const sy = fCenterY + fRadius * Math.sin(sAngle);
                                const rot = (sAngle * 180) / Math.PI + 90;

                                return (
                                  <g
                                    key={`amp-r-${rIdx}-${seatNum}`}
                                    transform={`translate(${sx}, ${sy}) rotate(${rot})`}
                                    className={`transition-transform duration-75 hover:scale-110 ${
                                      isSelected ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]' : ''
                                    }`}
                                  >
                                    <svg x={-seatW / 2} y={-seatH / 2} width={seatW} height={seatH} overflow="visible">
                                      {isRecliner ? (
                                        <ReclinerSeatSvg
                                          col={seatNum}
                                          isRotated={false}
                                          categoryColor={isSelected ? '#ffffff' : cat.color}
                                          isSelected={false}
                                        />
                                      ) : (
                                        <NormalSeatSvg
                                          col={seatNum}
                                          isRotated={false}
                                          categoryColor={isSelected ? '#ffffff' : cat.color}
                                          isSelected={false}
                                        />
                                      )}
                                    </svg>
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })}

                        {/* Central Aisle Guide Line */}
                        <line x1="500" y1="150" x2="500" y2="600" stroke="#252535" strokeWidth="16" strokeDasharray="3 5" />
                        <text x="500" y="590" textAnchor="middle" fill="#666677" fontSize="10" fontWeight="900" letterSpacing="3">
                          CENTRAL AISLE
                        </text>
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ─── STANDARD VENUES DIRECTORY DASHBOARD ───────────────────────────
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#121212] text-white font-sans">
      {/* ─── HEADER & CTA ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1.5">
          <span className="inline-block px-3 py-1 bg-[#1ed760] text-black font-black uppercase text-[10px] tracking-[1.4px] rounded-full shadow-none">
            Admin Studio
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
            Venue & Seating Layout Manager
          </h1>
          <p className="text-xs sm:text-sm text-[#b3b3b3]">
            Design custom architectural seating floorplans for Cinemas and Concert Arenas with exact precision.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setVisualStudioOpen(true)}
            className="px-6 py-3 bg-[#1ed760] hover:bg-[#1fdf64] text-black font-black text-xs uppercase tracking-[1.2px] rounded-full shadow-none hover:scale-105 transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
          >
            <SparklesRoundedIcon className="w-4 h-4" />
            <span>Create Visually</span>
          </button>
        </div>
      </div>

      {/* ─── VENUES GRID CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map((venue) => {
          const totalSeats =
            venue.layoutData?.totalFreeformSeats ||
            venue.seats?.length ||
            venue.totalRows * venue.totalCols;

          const isCustom = !!venue.layoutData?.mode;

          return (
            <div
              key={venue.id}
              className="bg-[#181818] hover:bg-[#1c1c1c] transition-colors border border-[#282828] p-6 rounded-2xl shadow-none space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#121212] border border-[#333333] text-xs font-mono font-bold text-[#1ed760]">
                    {isCustom ? 'Custom Freeform CAD' : `${venue.totalRows}x${venue.totalCols} Grid`}
                  </span>
                  <span className="font-mono text-xs font-black text-white">
                    {totalSeats} Seats
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {venue.name}
                  </h3>
                  <p className="text-xs text-[#b3b3b3] flex items-center gap-1.5">
                    <MapPinRoundedIcon className="w-3.5 h-3.5 text-[#1ed760] flex-shrink-0" />
                    <span>{venue.address || 'Standard Layout'}</span>
                  </p>
                </div>
              </div>

              {/* Categories Breakdown */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c7c7c] block">
                  Configured Categories ({venue.categories?.length || 0})
                </span>
                <div className="space-y-1.5">
                  {venue.categories?.map((cat) => (
                    <div
                      key={cat.id}
                      className="px-3 py-1.5 rounded-xl bg-[#121212] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shadow-none"
                          style={{ backgroundColor: cat.color || '#38bdf8' }}
                        />
                        <span className="font-bold text-white text-xs">{cat.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#b3b3b3]">
                        Tier {cat.rowStart}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
