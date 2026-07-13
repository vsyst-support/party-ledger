"use client";

import { useEffect, useState } from "react";

// Native date inputs render in the OS locale (often month-first); this keeps
// typing and display in dd/mm/yyyy while the calendar icon still opens the
// native picker. Value in/out stays ISO (yyyy-mm-dd).

const toDisplay = iso =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split("-").reverse().join("/") : "";

const toIso = text => {
  const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(`${y}-${mo}-${d}T00:00:00`);
  if (isNaN(date) || date.getDate() !== Number(d) || date.getMonth() + 1 !== Number(mo)) {
    return null;
  }
  return `${y}-${mo}-${d}`;
};

export default function DateInput({ id, value, onChange, required }) {
  const [text, setText] = useState(toDisplay(value));

  // Stay in sync when the picker (or parent) changes the value.
  useEffect(() => { setText(toDisplay(value)); }, [value]);

  const handleText = raw => {
    // digits only, slashes auto-inserted: "31122026" -> "31/12/2026"
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const out =
      digits.length > 4
        ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
        : digits.length > 2
          ? `${digits.slice(0, 2)}/${digits.slice(2)}`
          : digits;
    setText(out);
    const iso = toIso(out);
    if (iso) onChange(iso);
  };

  return (
    <div className="date-input">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        required={required}
        pattern="\d{2}/\d{2}/\d{4}"
        title="Enter the date as dd/mm/yyyy"
        value={text}
        onChange={e => handleText(e.target.value)}
        onBlur={() => { if (!toIso(text)) setText(toDisplay(value)); }}
      />
      <span className="date-input-picker">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <input
          type="date"
          tabIndex={-1}
          aria-label="Open calendar"
          value={/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""}
          onClick={e => e.target.showPicker?.()}
          onChange={e => { if (e.target.value) onChange(e.target.value); }}
        />
      </span>
    </div>
  );
}
