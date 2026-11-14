import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api.js';
import { Alert, Loader } from '../components/Alert.jsx';
import { INCOME_CATEGORIES, formatDate, formatMoney, todayInput, toInputDate } from '../utils.js';

const emptyForm = () => ({ title: '', amount: '', type: 'expense', category: '', date: todayInput() });

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ type: '', category: '', month: '' });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const expenseNames = categories.map((c) => c.name);
  const formCategories = form.type === 'income' ? INCOME_CATEGORIES : expenseNames;
  const allCategoryNames = [...new Set([...expenseNames, ...INCOME_CATEGORIES])];

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await api.get('/transactions', { params });
      setTransactions(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data)).catch((err) => setError(errorMessage(err)));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value, ...(name === 'type' ? { category: '' } : {}) }));
    setFormErrors((fe) => ({ ...fe, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter an amount greater than 0';
    if (!form.category) e.category = 'Select a category';
    if (!form.date) e.date = 'Date is required';
    return e;
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const v = validate();
    setFormErrors(v);
    if (Object.keys(v).length) return;

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, form);
        setSuccess('Transaction updated');
      } else {
        await api.post('/transactions', form);
        setSuccess('Transaction added');
      }
      resetForm();
      loadTransactions();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (t) => {
    setEditingId(t._id);
    setForm({ title: t.title, amount: t.amount, type: t.type, category: t.category, date: toInputDate(t.date) });
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
    setError('');
    try {
      await api.delete(`/transactions/${t._id}`);
      setSuccess('Transaction deleted');
      if (editingId === t._id) resetForm();
      loadTransactions();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Bonus: export the currently displayed transactions as CSV
  const exportCSV = () => {
    const rows = [['Date', 'Title', 'Type', 'Category', 'Amount']].concat(
      transactions.map((t) => [toInputDate(t.date), t.title, t.type, t.category, t.amount])
    );
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container">
      <div className="page-head">
        <h1>Transactions</h1>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>

      <form className="card form-grid" onSubmit={handleSubmit} noValidate>
        <h3 className="span-all">{editingId ? 'Edit transaction' : 'Add transaction'}</h3>

        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Groceries" />
          {formErrors.title && <span className="field-error">{formErrors.title}</span>}
        </div>

        <div className="field">
          <label htmlFor="amount">Amount (₹)</label>
          <input id="amount" name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange} />
          {formErrors.amount && <span className="field-error">{formErrors.amount}</span>}
        </div>

        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" value={form.type} onChange={handleChange}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" value={form.category} onChange={handleChange}>
            <option value="">Select category</option>
            {formCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {formErrors.category && <span className="field-error">{formErrors.category}</span>}
        </div>

        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" name="date" type="date" value={form.date} onChange={handleChange} />
          {formErrors.date && <span className="field-error">{formErrors.date}</span>}
        </div>

        <div className="field form-actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
          </button>
          {editingId && <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="card">
        <div className="filters">
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All categories</option>
            {allCategoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} />
          <button className="btn btn-ghost" onClick={() => setFilters({ type: '', category: '', month: '' })}>Clear</button>
          <button className="btn btn-ghost" onClick={exportCSV} disabled={!transactions.length}>Export CSV</button>
        </div>

        {loading ? (
          <Loader />
        ) : transactions.length === 0 ? (
          <p className="muted center">No transactions found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Title</th><th>Category</th><th>Type</th><th className="right">Amount</th><th /></tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td data-label="Date">{formatDate(t.date)}</td>
                    <td data-label="Title">{t.title}</td>
                    <td data-label="Category">{t.category}</td>
                    <td data-label="Type"><span className={`badge badge-${t.type}`}>{t.type}</span></td>
                    <td data-label="Amount" className={`right ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                    </td>
                    <td className="actions">
                      <button className="btn btn-small" onClick={() => startEdit(t)}>Edit</button>
                      <button className="btn btn-small btn-danger" onClick={() => handleDelete(t)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
