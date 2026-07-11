"use client";

import { useEffect, useState } from "react";
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

export default function PartyModal({ party, saving, onSave, onDelete, onClose }) {
  const isEdit = party !== null;
  const [form, setForm] = useState(isEdit ? { ...party } : emptyForm());

  useEffect(() => {
    const onKeyDown = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
            <input
              id="fDate"
              type="date"
              required
              value={form.date}
              onChange={e => set("date", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="fCategory">Category</label>
            <input
              id="fCategory"
              type="text"
              required
              maxLength={40}
              placeholder="Enter Categories"
              value={form.category}
              onChange={e => set("category", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="fStatus">Status</label>
            <select id="fStatus" value={form.status} onChange={e => set("status", e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
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
