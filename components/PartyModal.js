"use client";

import { useEffect, useRef, useState } from "react";
import DateInput from "@/components/DateInput";
import { STATUSES } from "@/lib/ledger";

const emptyForm = () => ({
  name: "",
  date: new Date().toISOString().slice(0, 10),
  category: "",
  status: STATUSES[0],
});

// Auto-focus only on desktop — on touch devices it would pop the keyboard open.
const shouldAutoFocus = () =>
  typeof window !== "undefined" && !window.matchMedia("(pointer: coarse)").matches;

export default function PartyModal({ party, categories, saving, onSave, onDelete, onClose }) {
  const isEdit = party !== null;
  const [form, setForm] = useState(isEdit ? { ...party } : emptyForm());
  const [catOpen, setCatOpen] = useState(false);
  const [fetchedCategories, setFetchedCategories] = useState([]);
  const catRef = useRef(null);

  useEffect(() => {
    const onKeyDown = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // When the page doesn't pass categories, derive them from all parties.
  useEffect(() => {
    if (categories) return;
    let cancelled = false;
    fetch("/api/parties")
      .then(res => (res.ok ? res.json() : []))
      .then(parties => {
        if (cancelled) return;
        setFetchedCategories(
          [...new Set(parties.map(p => p.category))].sort((a, b) => a.localeCompare(b)),
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [categories]);

  useEffect(() => {
    if (!catOpen) return;
    const onClickOutside = e => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [catOpen]);

  const allCategories = categories ?? fetchedCategories;
  const catQuery = form.category.trim().toLowerCase();
  const catMatches = allCategories.filter(c => c.toLowerCase().includes(catQuery));
  const catExists = allCategories.some(c => c.toLowerCase() === catQuery);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = e => {
    e.preventDefault();
    const name = form.name.trim();
    const category = form.category.trim();
    if (!name || !category) return;
    onSave({
      name,
      // balance is derived from sub-entries; keep the existing value on edit
      balance: isEdit ? party.balance : 0,
      date: form.date,
      category,
      status: form.status,
    });
  };

  const handleDelete = () => {
    if (confirm(`Delete "${party.name}" from the ledger?`)) onDelete(party.id);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          &#10005;
        </button>
        <h2 id="modalTitle">{isEdit ? "Edit Ledger" : "Create Ledger"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fName">Party Ledger Name</label>
            <input
              id="fName"
              type="text"
              required
              maxLength={60}
              autoFocus={shouldAutoFocus()}
              placeholder="Enter Party Ledger Name"
              value={form.name}
              onChange={e => set("name", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="fDate">Date</label>
            <DateInput
              id="fDate"
              required
              value={form.date}
              onChange={v => set("date", v)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="fCategory">Category</label>
            <div className="autocomplete" ref={catRef}>
              <input
                id="fCategory"
                type="text"
                required
                maxLength={40}
                autoComplete="off"
                placeholder="Enter Categories"
                value={form.category}
                onFocus={() => setCatOpen(true)}
                onChange={e => { set("category", e.target.value); setCatOpen(true); }}
              />
              {catOpen && (catMatches.length > 0 || (catQuery && !catExists)) && (
                <div className="autocomplete-menu" role="listbox">
                  {catMatches.map(c => (
                    <button
                      type="button"
                      key={c}
                      className="autocomplete-option"
                      role="option"
                      aria-selected={c.toLowerCase() === catQuery}
                      onClick={() => { set("category", c); setCatOpen(false); }}
                    >
                      {c}
                    </button>
                  ))}
                  {catQuery && !catExists && (
                    <button
                      type="button"
                      className="autocomplete-option autocomplete-new"
                      onClick={() => setCatOpen(false)}
                    >
                      + Create new category &ldquo;{form.category.trim()}&rdquo;
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <span className="form-label">Status</span>
            <div className="radio-group" role="radiogroup" aria-label="Status">
              {STATUSES.map(s => (
                <label key={s} className="radio-option">
                  <input
                    type="radio"
                    name="fStatus"
                    value={s}
                    checked={form.status === s}
                    onChange={() => set("status", s)}
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            {isEdit && (
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                Delete
              </button>
            )}
            <div className="right">
              <button type="submit" className="btn btn-primary btn-loading" disabled={saving}>
                {saving && <span className="spinner" aria-hidden="true"></span>}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
