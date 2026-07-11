"use client";

import { useEffect, useState } from "react";

const emptyForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  particulars: "",
  paid: true,
  amount: "",
  remarks: "",
});

// Auto-focus only on desktop — on touch devices it would pop the keyboard open.
const shouldAutoFocus = () =>
  typeof window !== "undefined" && !window.matchMedia("(pointer: coarse)").matches;

export default function EntryModal({ entry, saving, onSave, onDelete, onClose }) {
  const isEdit = entry !== null;
  const [form, setForm] = useState(
    isEdit
      ? {
          date: entry.date,
          particulars: entry.particulars,
          paid: entry.dr > 0 || entry.cr === 0,
          amount: String(entry.dr > 0 ? entry.dr : entry.cr),
          remarks: entry.remarks,
        }
      : emptyForm()
  );

  useEffect(() => {
    const onKeyDown = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = e => {
    e.preventDefault();
    const particulars = form.particulars.trim();
    if (!particulars) return;
    const amount = parseFloat(form.amount) || 0;
    onSave({
      date: form.date,
      particulars,
      dr: form.paid ? amount : 0,
      cr: form.paid ? 0 : amount,
      remarks: form.remarks.trim(),
    });
  };

  const handleDelete = () => {
    if (confirm("Delete this entry?")) onDelete(entry.id);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="entryModalTitle">
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
          &#10005;
        </button>
        <h2 id="entryModalTitle">{isEdit ? "Edit Entry" : "Add Entry"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="eDate">Date</label>
              <input
                id="eDate"
                type="date"
                required
                value={form.date}
                onChange={e => set("date", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="eParticulars">Particulars</label>
              <input
                id="eParticulars"
                type="text"
                required
                maxLength={120}
                autoFocus={shouldAutoFocus()}
                placeholder="Enter Particulars name"
                value={form.particulars}
                onChange={e => set("particulars", e.target.value)}
              />
            </div>
          </div>
          <div className="form-row switch-amount-row">
            <div className="form-group switch-group">
              <span className="switch-row">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={form.paid}
                    onChange={e => set("paid", e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
                <span className={"switch-label " + (form.paid ? "paid" : "received")}>
                  {form.paid ? "Paid (Dr)" : "Got (Cr)"}
                </span>
              </span>
            </div>
            <div className="form-group">
              <input
                id="eAmount"
                type="number"
                required
                min="0.01"
                step="0.01"
                aria-label={form.paid ? "Paid Amount" : "Received Amount"}
                placeholder={form.paid ? "Paid Amount" : "Received Amount"}
                value={form.amount}
                onChange={e => set("amount", e.target.value)}
              />
            </div>
          </div>
          <div className="form-hint switch-amount-hint">
            {form.paid
              ? "Money you paid to the party — increases their balance owed to you."
              : "Money you received from the party — reduces their balance."}
          </div>
          <div className="form-group">
            <label htmlFor="eRemarks">Remarks</label>
            <input
              id="eRemarks"
              type="text"
              maxLength={200}
              placeholder="Optional note..."
              value={form.remarks}
              onChange={e => set("remarks", e.target.value)}
            />
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
