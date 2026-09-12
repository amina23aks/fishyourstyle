"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ALGERIA_WILAYAS } from "@/data/algeriaWilayas";

type Props = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onSelect: (canonicalWilaya: string) => void;
};

export default function MobileWilayaSelect({ id, label, value, placeholder, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return ALGERIA_WILAYAS.filter((wilaya) => !term || wilaya.label.toLocaleLowerCase().includes(term));
  }, [query]);

  useEffect(() => setQuery(value), [value]);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative md:hidden">
      <input
        id={id}
        role="combobox"
        aria-label={label}
        aria-controls={`${id}-listbox`}
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        className="w-full min-w-0 rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white shadow-inner shadow-black/30 placeholder:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      />
      {open ? (
        <ul id={`${id}-listbox`} role="listbox" className="absolute inset-x-0 top-full z-[80] mt-1 max-h-56 overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl border border-white/20 bg-slate-950 p-1 shadow-2xl">
          {filtered.map((wilaya) => (
            <li key={wilaya.code} role="option" aria-selected={wilaya.label === value}>
              <button type="button" onClick={() => { onSelect(wilaya.label); setQuery(wilaya.label); setOpen(false); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${wilaya.label === value ? "bg-sky-200 text-slate-950" : "text-sky-50 hover:bg-white/10"}`}>
                {wilaya.label}
              </button>
            </li>
          ))}
          {filtered.length === 0 ? <li className="px-3 py-2 text-sm text-sky-200">No matching wilaya</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
