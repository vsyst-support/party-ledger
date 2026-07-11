"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import EntryModal from "@/components/EntryModal";
import PartyModal from "@/components/PartyModal";
import {
  formatMoney,
  formatNumber,
  formatDate,
  formatBalance,
  balanceClass,
} from "@/lib/ledger";

export default function PartyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [party, setParty] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  // modal: null = closed, { entry: null } = add, { entry: {...} } = edit
  const [modal, setModal] = useState(null);
  const [partyModalOpen, setPartyModalOpen] = useState(false);

  const openEntryModal = (entry) => setModal({ entry });

  const load = useCallback(async () => {
    setError(null);
    try {
      const [partyRes, entriesRes] = await Promise.all([
        fetch(`/api/parties/${id}`),
        fetch(`/api/parties/${id}/entries`),
      ]);
      if (!partyRes.ok)
        throw new Error((await partyRes.json()).error || "Request failed");
      if (!entriesRes.ok)
        throw new Error((await entriesRes.json()).error || "Request failed");
      setParty(await partyRes.json());
      setEntries(await entriesRes.json());
    } catch (err) {
      setError("Could not load ledger. " + err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (entry) => {
    setSaving(true);
    setError(null);
    try {
      const editing = modal.entry;
      const res = await fetch(
        editing ? `/api/entries/${editing.id}` : `/api/parties/${id}/entries`,
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setModal(null);
      await load(); // reload so running balances stay correct
    } catch (err) {
      setError("Could not save. " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      if (!res.ok)
        throw new Error((await res.json()).error || "Request failed");
      setModal(null);
      await load();
    } catch (err) {
      setError("Could not delete. " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePartySave = async (updated) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/parties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setParty(data);
      setPartyModalOpen(false);
    } catch (err) {
      setError("Could not save. " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePartyDelete = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/parties/${id}`, { method: "DELETE" });
      if (!res.ok)
        throw new Error((await res.json()).error || "Request failed");
      router.push("/");
    } catch (err) {
      setError("Could not delete. " + err.message);
      setSaving(false);
    }
  };

  const totalDr = entries.reduce((s, e) => s + e.dr, 0);
  const totalCr = entries.reduce((s, e) => s + e.cr, 0);
  const balance = totalDr - totalCr;

  return (
    <div className="container">
      <header className="header-end">
        <button
          className="btn btn-primary header-new-btn"
          onClick={() => openEntryModal(null)}
        >
          + New
        </button>
      </header>

      {error && <div className="alert-error">{error}</div>}

      {party && (
        <div className="party-card-row">
          <Link href="/" className="back-arrow" aria-label="Back to all ledgers" title="Back to all ledgers">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <section className={"party-card " + party.status.toLowerCase()}>
            <div className="party-card-identity">
              <div className="party-card-info">
                <button
                  type="button"
                  className="party-card-name party-card-name-button"
                  title="Edit party details"
                  onClick={() => setPartyModalOpen(true)}
                >
                  {party.name}
                </button>
                <div className="party-card-meta">
                  <span className="chip">{party.category}</span>
                  <span className="party-card-date">
                    {formatDate(party.date)}
                  </span>
                </div>
              </div>
            </div>
          </section>
          <button
            className="btn btn-primary mobile-new-btn"
            onClick={() => openEntryModal(null)}
          >
            + New
          </button>
        </div>
      )}

      <section className="summary">
        <div className="card">
          <div className="label">Total Dr</div>
          <div className="value negative">{formatMoney(totalDr)}</div>
        </div>
        <div className="card">
          <div className="label">Total Cr</div>
          <div className="value positive">{formatMoney(totalCr)}</div>
        </div>
        <div className="card">
          <div className="label">Balance</div>
          <div className={"value " + balanceClass(balance)}>
            {formatBalance(balance)}
          </div>
        </div>
      </section>

      <div className="table-wrap entries-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th className="col-particulars">Particulars</th>
              <th className="num">
                <span className="full-label">Dr (Paid)</span>
                <span className="short-label">Dr</span>
              </th>
              <th className="num">
                <span className="full-label">Cr (Received)</span>
                <span className="short-label">Cr</span>
              </th>
              <th className="num">Balance</th>
              <th className="col-remarks">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td data-label="Date">
                  <button
                    type="button"
                    className="date-link"
                    title="Edit entry"
                    onClick={() => openEntryModal(e)}
                  >
                    {formatDate(e.date)}
                  </button>
                  <div
                    className="mobile-particulars"
                    role="button"
                    title="Edit entry"
                    onClick={() => openEntryModal(e)}
                  >
                    {e.particulars}
                  </div>
                </td>
                <td
                  data-label="Particulars"
                  className="party-name col-particulars"
                >
                  {e.particulars}
                </td>
                <td
                  data-label="Dr (Paid)"
                  className="num balance negative cell-dr"
                >
                  {e.dr ? formatNumber(e.dr) : "—"}
                </td>
                <td
                  data-label="Cr (Received)"
                  className="num balance positive cell-cr"
                >
                  {e.cr ? formatNumber(e.cr) : "—"}
                </td>
                <td
                  data-label="Balance"
                  className={"num balance " + balanceClass(e.balance)}
                >
                  {formatNumber(Math.abs(e.balance))}
                </td>
                <td data-label="Remarks" className="muted col-remarks">
                  {e.remarks || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? (
          <div className="empty-state">Loading entries…</div>
        ) : (
          entries.length === 0 && (
            <div className="empty-state">
              <div className="icon">&#128203;</div>
              <p>
                No entries yet. Click <strong>+ Add Entry</strong> to record the
                first transaction.
              </p>
            </div>
          )
        )}
      </div>

      {modal && (
        <EntryModal
          entry={modal.entry}
          saving={saving}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}

      {partyModalOpen && party && (
        <PartyModal
          party={party}
          saving={saving}
          onSave={handlePartySave}
          onDelete={handlePartyDelete}
          onClose={() => setPartyModalOpen(false)}
        />
      )}
    </div>
  );
}
