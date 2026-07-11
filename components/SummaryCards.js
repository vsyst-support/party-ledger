import { formatMoney } from "@/lib/ledger";

export default function SummaryCards({ parties }) {
  const receivable = parties
    .filter((p) => p.balance > 0)
    .reduce((s, p) => s + p.balance, 0);
  const payable = parties
    .filter((p) => p.balance < 0)
    .reduce((s, p) => s + p.balance, 0);
  const net = receivable + payable;

  return (
    <section className="summary">
      <div className="card">
        <div className="label">T. Receivable</div>
        <div className="value positive">{formatMoney(receivable)}</div>
      </div>
      <div className="card">
        <div className="label">T. Payable</div>
        <div className="value negative">{formatMoney(Math.abs(payable))}</div>
      </div>
      <div className="card">
        <div className="label">Net Balance</div>
        <div className={"value " + (net >= 0 ? "positive" : "negative")}>
          {formatMoney(net)}
        </div>
      </div>
    </section>
  );
}
