import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import { Alert, Loader } from '../components/Alert.jsx';
import BudgetBar from '../components/BudgetBar.jsx';
import { currentMonth, formatDate, formatMoney } from '../utils.js';

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get('/dashboard', { params: { month } })
      .then((res) => active && setData(res.data))
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [month]);

  const m = data?.monthly;
  const maxBar = m ? Math.max(m.income, m.expenses, 1) : 1;

  return (
    <main className="container">
      <div className="page-head">
        <h1>Dashboard</h1>
        <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
      </div>

      <Alert type="error">{error}</Alert>
      {loading && <Loader />}

      {data && !loading && (
        <>
          <section className="grid-3">
            <div className="card stat">
              <span className="stat-label">Total Balance</span>
              <span className={`stat-value ${data.totalBalance < 0 ? 'text-expense' : ''}`}>{formatMoney(data.totalBalance)}</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Total Income</span>
              <span className="stat-value text-income">{formatMoney(data.totalIncome)}</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Total Expenses</span>
              <span className="stat-value text-expense">{formatMoney(data.totalExpenses)}</span>
            </div>
          </section>

          <section className="grid-2">
            <div className="card">
              <h3>Income vs Expenses ({month})</h3>
              <div className="chart">
                <div className="chart-row">
                  <span>Income</span>
                  <div className="bar-track"><div className="bar-fill bar-income" style={{ width: `${(m.income / maxBar) * 100}%` }} /></div>
                  <strong>{formatMoney(m.income)}</strong>
                </div>
                <div className="chart-row">
                  <span>Expenses</span>
                  <div className="bar-track"><div className="bar-fill bar-danger" style={{ width: `${(m.expenses / maxBar) * 100}%` }} /></div>
                  <strong>{formatMoney(m.expenses)}</strong>
                </div>
              </div>
              <p className="muted">
                Net savings this month:{' '}
                <strong className={m.savings < 0 ? 'text-expense' : 'text-income'}>{formatMoney(m.savings)}</strong>
              </p>
            </div>

            <div className="card">
              <div className="card-head">
                <h3>Monthly Budget</h3>
                <Link to="/budget">Manage</Link>
              </div>
              <BudgetBar budget={data.budget} />
            </div>
          </section>

          <section className="grid-2">
            <div className="card">
              <h3>Monthly Spending Summary</h3>
              {m.byCategory.length === 0 ? (
                <p className="muted">No expenses recorded for this month.</p>
              ) : (
                <ul className="summary-list">
                  {m.byCategory.map((c) => (
                    <li key={c.category}>
                      <div className="summary-top">
                        <span>{c.category}</span>
                        <strong>{formatMoney(c.total)}</strong>
                      </div>
                      <div className="bar-track thin">
                        <div className="bar-fill bar-primary" style={{ width: `${(c.total / (m.expenses || 1)) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <div className="card-head">
                <h3>Recent Transactions</h3>
                <Link to="/transactions">View all</Link>
              </div>
              {data.recentTransactions.length === 0 ? (
                <p className="muted">No transactions yet. <Link to="/transactions">Add your first one.</Link></p>
              ) : (
                <ul className="tx-list">
                  {data.recentTransactions.map((t) => (
                    <li key={t._id}>
                      <div>
                        <strong>{t.title}</strong>
                        <span className="muted small">{t.category} • {formatDate(t.date)}</span>
                      </div>
                      <span className={t.type === 'income' ? 'text-income' : 'text-expense'}>
                        {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
