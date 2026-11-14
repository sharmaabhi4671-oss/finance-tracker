import { formatMoney } from '../utils.js';

// Visual indicator: green < 80%, amber 80-100%, red when over budget
export default function BudgetBar({ budget }) {
  if (!budget?.hasBudget) {
    return <p className="muted">No budget set for this month yet.</p>;
  }
  const pct = budget.percentUsed;
  const level = pct >= 100 ? 'danger' : pct >= 80 ? 'warn' : 'ok';

  return (
    <div>
      <div className="bar-track">
        <div className={`bar-fill bar-${level}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className="bar-meta">
        <span>{formatMoney(budget.spent)} of {formatMoney(budget.amount ?? budget.budget)} ({pct}%)</span>
        <span className={budget.remaining < 0 ? 'text-expense' : 'text-income'}>
          {budget.remaining < 0
            ? `${formatMoney(Math.abs(budget.remaining))} over budget`
            : `${formatMoney(budget.remaining)} left`}
        </span>
      </div>
      {level === 'warn' && <p className="hint warn-text">⚠ You're approaching your monthly budget.</p>}
      {level === 'danger' && <p className="hint danger-text">🚨 You've exceeded your monthly budget!</p>}
    </div>
  );
}
