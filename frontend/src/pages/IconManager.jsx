import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as MappedIcons from '../components/MappedIcons';
import * as LucideIcons from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function IconManager() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [availableSvgs, setAvailableSvgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'custom', 'default'
  const [uploadingFor, setUploadingFor] = useState(null);
  const [savingIcon, setSavingIcon] = useState(null);
  const fileInputRef = useRef(null);
  const globalFileInputRef = useRef(null);

  const fetchIcons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/__icon_api/list');
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setAvailableSvgs(data.svgs || []);
      } else {
        toast.error(data.error || 'Failed to load icon configuration.');
      }
    } catch (err) {
      toast.error('Could not connect to Vite Icon Dev API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIcons();
  }, []);

  const sections = useMemo(() => {
    const set = new Set(items.map((i) => i.section).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [items]);

  const stats = useMemo(() => {
    const total = items.length;
    const custom = items.filter((i) => Boolean(i.filename)).length;
    const defaults = total - custom;
    return { total, custom, defaults };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedSection !== 'ALL' && item.section !== selectedSection) {
        return false;
      }
      if (filterMode === 'custom' && !item.filename) return false;
      if (filterMode === 'default' && item.filename) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = item.iconName.toLowerCase().includes(q);
        const matchesFile = item.filename && item.filename.toLowerCase().includes(q);
        const matchesDesc = item.description && item.description.toLowerCase().includes(q);
        const matchesSec = item.section && item.section.toLowerCase().includes(q);
        if (!matchesName && !matchesFile && !matchesDesc && !matchesSec) return false;
      }
      return true;
    });
  }, [items, selectedSection, filterMode, search]);

  const handleUpdateMapping = async (iconName, filename) => {
    setSavingIcon(iconName);
    try {
      const res = await fetch('/__icon_api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iconName, filename }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          filename
            ? `✨ ${iconName} mapped to "${filename}"`
            : `🔄 ${iconName} reset to default Lucide`
        );
        setItems((prev) =>
          prev.map((it) =>
            it.iconName === iconName ? { ...it, filename: filename || null } : it
          )
        );
      } else {
        toast.error(data.error || 'Failed to update mapping.');
      }
    } catch (err) {
      toast.error('Failed to update mapping: ' + err.message);
    } finally {
      setSavingIcon(null);
    }
  };

  const handleFileUpload = async (file, targetIconName = null) => {
    if (!file) return;
    if (!file.name.endsWith('.svg')) {
      toast.error('Please upload an .svg file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const svgContent = e.target.result;
      try {
        const res = await fetch('/__icon_api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            svgContent,
            iconName: targetIconName,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(
            targetIconName
              ? `🚀 Uploaded & applied "${data.filename}" to ${targetIconName}!`
              : `📁 Uploaded "${data.filename}" to public SVG library!`
          );
          await fetchIcons();
        } else {
          toast.error(data.error || 'Failed to upload SVG.');
        }
      } catch (err) {
        toast.error('Upload failed: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const triggerUploadForIcon = (iconName) => {
    setUploadingFor(iconName);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, uploadingFor);
    }
    setUploadingFor(null);
  };

  const onGlobalFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#ededed] font-sans pb-24 pt-8 px-4 sm:px-6 lg:px-8">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileInputChange}
        accept=".svg"
        className="hidden"
      />
      <input
        type="file"
        ref={globalFileInputRef}
        onChange={onGlobalFileInputChange}
        accept=".svg"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#18181c] via-[#141417] to-[#101012] border border-[#26262e] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1ed760]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#1ed760] flex items-center justify-center text-black shadow-lg shadow-[#1ed760]/20 font-black text-xl">
                🎨
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Visual Icon Studio
                </h1>
                <p className="text-xs sm:text-sm text-[#a0a0ab]">
                  Visually inspect, map, and upload custom SVGs for every icon across BookMe with instant live HMR.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <button
              onClick={() => globalFileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-[#202026] hover:bg-[#282830] text-white text-xs font-bold transition-all border border-[#33333d] flex items-center gap-2 hover:scale-[1.02] shadow-sm"
            >
              <span>📥</span> Upload New SVG Asset
            </button>
            <button
              onClick={fetchIcons}
              className="px-4 py-2.5 rounded-xl bg-[#1ed760] hover:bg-[#1fdf64] text-black text-xs font-black transition-all flex items-center gap-2 hover:scale-[1.02] shadow-lg shadow-[#1ed760]/20"
            >
              <span>⚡</span> Refresh Map
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#141417] border border-[#222228] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8e8e99]">
                Total System Icons
              </span>
              <div className="text-2xl font-black text-white">{stats.total}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg">
              🎯
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#141417] border border-[#222228] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1ed760]">
                Custom SVG Mapped
              </span>
              <div className="text-2xl font-black text-[#1ed760]">{stats.custom}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1ed760]/10 flex items-center justify-center text-lg text-[#1ed760]">
              ✨
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#141417] border border-[#222228] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8e8e99]">
                Default Lucide Fallbacks
              </span>
              <div className="text-2xl font-black text-[#8e8e99]">{stats.defaults}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg">
              🛡️
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="space-y-4 p-4 sm:p-5 rounded-xl bg-[#141417] border border-[#222228]">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search icon name, category, or file..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1b1b20] border border-[#2b2b34] focus:border-[#1ed760] focus:ring-1 focus:ring-[#1ed760] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#71717a] outline-none transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#71717a] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Toggle Mode */}
            <div className="flex items-center gap-1.5 p-1 bg-[#1b1b20] border border-[#2b2b34] rounded-xl w-full md:w-auto justify-center">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'all'
                    ? 'bg-[#1ed760] text-black shadow-sm'
                    : 'text-[#a0a0ab] hover:text-white'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilterMode('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'custom'
                    ? 'bg-[#1ed760] text-black shadow-sm'
                    : 'text-[#a0a0ab] hover:text-white'
                }`}
              >
                Custom SVGs ({stats.custom})
              </button>
              <button
                onClick={() => setFilterMode('default')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'default'
                    ? 'bg-[#1ed760] text-black shadow-sm'
                    : 'text-[#a0a0ab] hover:text-white'
                }`}
              >
                Default Lucide ({stats.defaults})
              </button>
            </div>
          </div>

          {/* Section Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedSection === sec
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-[#1b1b20] text-[#8e8e99] border-[#2b2b34] hover:text-white hover:border-[#3b3b46]'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Icon Cards */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="py-24 text-center text-[#8e8e99] text-sm">
            <div className="inline-block animate-spin text-2xl mb-3 text-[#1ed760]">⚙️</div>
            <div>Loading icon library and mappings...</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-[#8e8e99] bg-[#141417] rounded-2xl border border-[#222228] p-8">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm font-bold text-white mb-1">No matching icons found</p>
            <p className="text-xs text-[#71717a]">
              Try searching with a different keyword or resetting filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const LiveComponent = MappedIcons[item.iconName];
              const DefaultLucideComponent = LucideIcons[item.iconName];
              const isCustom = Boolean(item.filename);

              return (
                <div
                  key={item.iconName}
                  className="rounded-2xl bg-[#141417] border border-[#222228] hover:border-[#33333e] p-5 space-y-4 transition-all hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between group"
                >
                  {/* Top Meta */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-mono text-base font-black text-white group-hover:text-[#1ed760] transition-colors flex items-center gap-1.5">
                          {item.iconName}
                        </h3>
                        <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#8e8e99]">
                          {item.section || 'General'}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          isCustom
                            ? 'bg-[#1ed760]/10 text-[#1ed760] border-[#1ed760]/30 shadow-sm'
                            : 'bg-white/5 text-[#8e8e99] border-white/10'
                        }`}
                      >
                        {isCustom ? 'Custom SVG' : 'Lucide Default'}
                      </span>
                    </div>

                    {/* Visual Comparison Box */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#0c0c0e] border border-[#1e1e24]">
                      {/* Live Rendered View */}
                      <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#141417] border border-[#26262e]">
                        <div className="w-8 h-8 flex items-center justify-center text-white mb-1.5">
                          {LiveComponent ? (
                            <LiveComponent size={28} className="text-white" />
                          ) : (
                            <span className="text-xs text-red-400">Missing</span>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-[#1ed760] uppercase tracking-wider">
                          Live Active
                        </span>
                      </div>

                      {/* Default Lucide Comparison View */}
                      <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#141417] border border-[#26262e] opacity-75">
                        <div className="w-8 h-8 flex items-center justify-center text-[#8e8e99] mb-1.5">
                          {DefaultLucideComponent ? (
                            <DefaultLucideComponent size={28} />
                          ) : (
                            <span className="text-xs text-[#555]">—</span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-[#8e8e99] uppercase tracking-wider">
                          Lucide Base
                        </span>
                      </div>
                    </div>

                    {/* UI Description */}
                    {item.description && (
                      <p className="text-xs text-[#a0a0ab] leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="space-y-2 pt-2 border-t border-[#1e1e24]">
                    {/* SVG Dropdown Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#71717a] block">
                        Assigned SVG File:
                      </label>
                      <select
                        value={item.filename || ''}
                        disabled={savingIcon === item.iconName}
                        onChange={(e) =>
                          handleUpdateMapping(item.iconName, e.target.value || null)
                        }
                        className="w-full bg-[#1b1b20] border border-[#2b2b34] hover:border-[#3b3b46] focus:border-[#1ed760] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none transition-all cursor-pointer"
                      >
                        <option value="">(None) Use Default Lucide Icon</option>
                        {availableSvgs.map((svg) => (
                          <option key={svg} value={svg}>
                            {svg}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Buttons: Upload & Reset */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => triggerUploadForIcon(item.iconName)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#22222a] hover:bg-[#2c2c36] text-white text-xs font-bold transition-all border border-[#33333f] flex items-center justify-center gap-1.5 hover:scale-[1.01]"
                      >
                        <span>📤</span> Replace SVG
                      </button>

                      {isCustom && (
                        <button
                          onClick={() => handleUpdateMapping(item.iconName, null)}
                          className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all border border-red-500/20 hover:scale-[1.01]"
                          title="Reset to default Lucide icon"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
