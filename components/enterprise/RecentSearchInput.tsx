"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Clock, X } from 'lucide-react';

interface RecentSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  storageKey: string;
  isLight?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

export function RecentSearchInput({
  value,
  onChange,
  placeholder,
  storageKey,
  isLight = false,
  onKeyDown,
  className = '',
}: RecentSearchInputProps) {
  const [history, setHistory] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`drishti_search_history_${storageKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 5));
        }
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }, [storageKey]);

  // Save term to recent search history (max 5)
  const saveSearchTerm = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const filtered = history.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5); // Strictly cap at last 5 searches
      setHistory(updated);
      localStorage.setItem(`drishti_search_history_${storageKey}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save search term:', e);
    }
  };

  const removeItem = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    const updated = history.filter((item) => item !== termToRemove);
    setHistory(updated);
    try {
      localStorage.setItem(`drishti_search_history_${storageKey}`, JSON.stringify(updated));
    } catch (e) {}
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTerm = (term: string) => {
    onChange(term);
    saveSearchTerm(term);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative flex-1 ${className}`}>
      <label
        className={`flex h-11 items-center gap-2.5 rounded-sm border px-3.5 transition-all shadow-xs ${
          isLight
            ? 'border-zinc-300 bg-zinc-50 text-black focus-within:border-black focus-within:bg-white focus-within:ring-1 focus-within:ring-black'
            : 'border-zinc-800 bg-black text-white focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-white'
        }`}
      >
        <Search className="h-4 w-4 shrink-0 text-zinc-400" />
        <input
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              saveSearchTerm(value);
              setIsOpen(false);
            }
            if (onKeyDown) onKeyDown(e);
          }}
          placeholder={placeholder}
          className={`w-full bg-transparent text-sm md:text-[13.5px] font-medium outline-none ${
            isLight ? 'text-black placeholder:text-zinc-400' : 'text-white placeholder:text-zinc-500'
          }`}
        />
      </label>

      {/* Recent Searches Dropdown (Max 5 items) */}
      {isOpen && history.length > 0 && (
        <div
          className={`absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-sm border shadow-2xl backdrop-blur-md ${
            isLight
              ? 'border-zinc-300 bg-white text-black shadow-zinc-300/50'
              : 'border-zinc-800 bg-zinc-950 text-white shadow-black/80'
          }`}
        >
          <div className="flex items-center justify-between border-b px-3.5 py-2 text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 border-inherit">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-zinc-400" /> Recent Searches (Max 5)
            </span>
          </div>

          <div className="py-1">
            {history.slice(0, 5).map((term, index) => (
              <div
                key={index}
                onClick={() => handleSelectTerm(term)}
                className={`group flex items-center justify-between px-3.5 py-2.5 text-[13px] font-semibold cursor-pointer transition ${
                  isLight
                    ? 'hover:bg-zinc-100 text-zinc-800'
                    : 'hover:bg-zinc-900 text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500 group-hover:text-current" />
                  <span className="truncate">{term}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => removeItem(e, term)}
                  className="rounded-sm p-1 text-zinc-400 opacity-0 transition hover:bg-zinc-800 hover:text-white group-hover:opacity-100"
                  title="Remove search entry"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
