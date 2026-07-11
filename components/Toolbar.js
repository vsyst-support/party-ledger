import { useEffect, useRef, useState } from "react";
import { STATUSES } from "@/lib/ledger";

const NO_FILTERS = { query: "", categories: [], status: "" };

export default function Toolbar({ filters, categories, onChange }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const hasFilters = filters.query || filters.categories.length > 0 || filters.status;

  useEffect(() => {
    if (!open) return;
    const onClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const toggleCategory = c => {
    const next = filters.categories.includes(c)
      ? filters.categories.filter(x => x !== c)
      : [...filters.categories, c];
    onChange({ ...filters, categories: next });
  };

  const categoryLabel =
    filters.categories.length === 0
      ? "All Categories"
      : filters.categories.length === 1
        ? filters.categories[0]
        : `${filters.categories.length} categories`;

  return (
    <div className="toolbar">
      <input
        type="search"
        placeholder="Search party ledger name..."
        value={filters.query}
        onChange={e => onChange({ ...filters, query: e.target.value })}
      />
      <div className="multi-select" ref={menuRef}>
        <button
          type="button"
          className={"multi-select-btn" + (filters.categories.length ? " active" : "")}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
        >
          {categoryLabel}
        </button>
        {open && (
          <div className="multi-select-menu" role="listbox">
            {categories.length === 0 && (
              <div className="multi-select-empty">No categories yet</div>
            )}
            {categories.map(c => (
              <label key={c} className="multi-select-option">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(c)}
                  onChange={() => toggleCategory(c)}
                />
                <span>{c}</span>
              </label>
            ))}
            {filters.categories.length > 0 && (
              <button
                type="button"
                className="multi-select-clear"
                onClick={() => onChange({ ...filters, categories: [] })}
              >
                Clear categories
              </button>
            )}
          </div>
        )}
      </div>
      <select
        value={filters.status}
        onChange={e => onChange({ ...filters, status: e.target.value })}
        aria-label="Filter by status"
        className={filters.status ? "active" : ""}
      >
        <option value="">All Statuses</option>
        {STATUSES.map(s => <option key={s}>{s}</option>)}
      </select>
      {hasFilters && (
        <button type="button" className="btn-clear" onClick={() => onChange(NO_FILTERS)}>
          &#10005; Clear
        </button>
      )}
    </div>
  );
}
