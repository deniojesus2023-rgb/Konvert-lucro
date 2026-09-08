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

interface TabGroupProps {
  tabs: string[];
  id?: string;
  /** Controlled mode: parent owns which tab is active and renders content per tab. */
  active?: string;
  onChange?: (tab: string) => void;
}

/**
 * The prototype's tab strip. Uncontrolled by default (a tab just toggles
 * its own active class, same as the original's cosmetic-only JS) — pass
 * `active`/`onChange` when the page actually shows different content per
 * tab (Configurações, Perfil, Custos).
 */
export function TabGroup({ tabs, id, active, onChange }: TabGroupProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]);
  const current = active ?? internalActive;

  function select(tab: string) {
    if (onChange) onChange(tab);
    else setInternalActive(tab);
  }

  return (
    <div className="tabs" id={id}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`tab-btn${tab === current ? " active" : ""}`}
          data-tab={tab}
          onClick={() => select(tab)}
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

/** The prototype's on/off pill, now with a real (local) on/off state instead of a purely cosmetic class toggle. */
export function ToggleSwitch({ defaultOn = true }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return <div className={`toggle${on ? " on" : ""}`} onClick={() => setOn((v) => !v)}></div>;
}
