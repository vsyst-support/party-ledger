import Link from "next/link";
import { formatMoney, balanceClass, formatDate } from "@/lib/ledger";

const SORTABLE_COLUMNS = [
  { key: "name", label: "Party Ledger Name" },
  { key: "balance", label: "Balance" },
  { key: "date", label: "Date" },
];

export default function LedgerTable({ parties, sort, onSort, onEdit }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {SORTABLE_COLUMNS.map((col) => (
              <th
                key={col.key}
                className={"sortable" + (sort.key === col.key ? " sorted" : "")}
                aria-sort={
                  sort.key === col.key
                    ? sort.dir === 1
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                onClick={() => onSort(col.key)}
              >
                {col.label}
                <span className="sort-icon">
                  {sort.key === col.key ? (sort.dir === 1 ? "▲" : "▼") : "⇅"}
                </span>
              </th>
            ))}
            <th>Category</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {parties.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/party/${p.id}`} className="party-name party-link">
                  {p.name}
                </Link>
              </td>
              <td className={"balance " + balanceClass(p.balance)}>
                {formatMoney(Math.abs(p.balance))}
              </td>
              <td className="nowrap">{formatDate(p.date)}</td>
              <td>
                <span className="chip">{p.category}</span>
              </td>
              <td>
                <span className={"badge " + p.status.toLowerCase()}>
                  {p.status}
                </span>
              </td>
              <td>
                <button className="btn-edit" onClick={() => onEdit(p)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {parties.length === 0 && (
        <div className="empty-state">
          <div className="icon">&#128203;</div>
          <p>
            No entries found. Click <strong>+ New</strong> to create your first
            entry.
          </p>
        </div>
      )}
    </div>
  );
}
