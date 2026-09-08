"use client";

import { useState } from "react";
import { useDashboard } from "./DashboardContext";

/** The same "01 – 30 jun. 2026" cosmetic date-picker button repeated on every page-head. */
export function DatePickerButton() {
  const { toast } = useDashboard();
  return (
    <div className="date-picker" onClick={() => toast("Seletor de período (demonstração)")}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
      01 – 30 jun. 2026
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

/** Generic, cosmetic tab group — clicking a tab only toggles its own active state, same as the prototype's JS. */
export function TabGroup({ tabs, id }: { tabs: string[]; id?: string }) {
  const [active, setActive] = useState(tabs[0]);
  return (
    <div className="tabs" id={id}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`tab-btn${tab === active ? " active" : ""}`}
          data-tab={tab}
          onClick={() => setActive(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function FilterButton() {
  const { toast } = useDashboard();
  return (
    <button className="filter-btn" onClick={() => toast("Filtros (demonstração)")}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </svg>
      Filtrar
    </button>
  );
}
