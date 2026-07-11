"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SummaryCards from "@/components/SummaryCards";
import Toolbar from "@/components/Toolbar";
import LedgerTable from "@/components/LedgerTable";
import PartyModal from "@/components/PartyModal";

export default function Home() {
  const router = useRouter();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    query: "",
    categories: [],
    status: "",
  });
  const [sort, setSort] = useState({ key: "date", dir: -1 });
  // modal: null = closed, { party: null } = add, { party: {...} } = edit
  const [modal, setModal] = useState(null);

  const loadParties = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/parties");
      if (!res.ok)
        throw new Error((await res.json()).error || "Request failed");
      setParties(await res.json());
    } catch (err) {
      setError("Could not load data from the database. " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  const categories = useMemo(
    () =>
      [...new Set(parties.map((p) => p.category))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [parties],
  );

  const visible = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return parties
      .filter(
        (p) =>
          (!q || p.name.toLowerCase().includes(q)) &&
          (filters.categories.length === 0 ||
            filters.categories.includes(p.category)) &&
          (!filters.status || p.status === filters.status),
      )
      .sort((a, b) => {
        let r;
        if (sort.key === "name") r = a.name.localeCompare(b.name);
        else if (sort.key === "balance") r = a.balance - b.balance;
        else r = a.date.localeCompare(b.date);
        return r * sort.dir;
      });
  }, [parties, filters, sort]);

  const handleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));

  const handleSave = async (entry) => {
    setSaving(true);
    setError(null);
    try {
      const editing = modal.party;
      const res = await fetch(
        editing ? `/api/parties/${editing.id}` : "/api/parties",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setParties((ps) =>
        editing ? ps.map((p) => (p.id === data.id ? data : p)) : [...ps, data],
      );
      setModal(null);
    } catch (err) {
      setError("Could not save. " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/parties/${id}`, { method: "DELETE" });
      if (!res.ok)
        throw new Error((await res.json()).error || "Request failed");
      setParties((ps) => ps.filter((p) => p.id !== id));
      setModal(null);
    } catch (err) {
      setError("Could not delete. " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Ledgers</h1>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setModal({ party: null })}
          >
            + New
          </button>
          <button
            className="btn btn-ghost btn-icon"
            aria-label="Logout"
            title="Logout"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {error && <div className="alert-error">{error}</div>}

      <SummaryCards parties={parties} />
      <Toolbar
        filters={filters}
        categories={categories}
        onChange={setFilters}
      />
      {loading ? (
        <div className="table-wrap">
          <div className="empty-state">Loading ledger…</div>
        </div>
      ) : (
        <LedgerTable
          parties={visible}
          sort={sort}
          onSort={handleSort}
          onEdit={(party) => setModal({ party })}
        />
      )}

      {modal && (
        <PartyModal
          party={modal.party}
          saving={saving}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
