import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api.js';
import { Alert, Loader } from '../components/Alert.jsx';
import BudgetBar from '../components/BudgetBar.jsx';
import { currentMonth, formatMoney } from '../utils.js';

export default function Budget() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadBudget = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/budget', { params: { month } });
      setSummary(data);
      setAmount(data.hasBudget ? String(data.budget) : '');
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  useEffect(() => {
    loadCategories();
  }, []);

  const saveBudget = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (amount === '' || Number(amount) < 0) {
      setError('Enter a budget of 0 or more');
      return;
    }
    try {
      const { data } = await api.put('/budget', { month, amount });
      setSummary(data);
      setSuccess('Budget saved');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newCategory.trim()) {
      setError('Category name is required');
      return;
    }
    try {
      await api.post('/categories', { name: newCategory });
      setNewCategory('');
      setSuccess('Category added');
      loadCategories();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const deleteCategory = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/categories/${c._id}`);
      setSuccess('Category deleted');
      loadCategories();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const spentFor = (name) => summary?.byCategory.find((c) => c.category === name)?.total || 0;

  return (
    <main className="container">
      <div className="page-head">
        <h1>Budget &amp; Categories</h1>
        <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>

      <div className="grid-2">
        <div className="card">
          <h3>Monthly spending budget</h3>
          <form className="inline-form" onSubmit={saveBudget} noValidate>
            <input type="number" min="0" step="0.01" placeholder="Budget amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="btn btn-primary">Save</button>
          </form>

          {loading ? (
            <Loader />
          ) : (
            summary && (
              <>
                <div className="budget-figures">
                  <div><span className="stat-label">Budget</span><strong>{formatMoney(summary.budget)}</strong></div>
                  <div><span className="stat-label">Spent</span><strong className="text-expense">{formatMoney(summary.spent)}</strong></div>
                  <div>
                    <span className="stat-label">Remaining</span>
                    <strong className={summary.remaining < 0 ? 'text-expense' : 'text-income'}>{formatMoney(summary.remaining)}</strong>
                  </div>
                </div>
                <BudgetBar budget={summary} />
              </>
            )
          )}
        </div>

        <div className="card">
          <h3>Expense categories</h3>
          <form className="inline-form" onSubmit={addCategory} noValidate>
            <input placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            <button className="btn btn-primary">Add</button>
          </form>

          {categories.length === 0 ? (
            <p className="muted">No categories yet.</p>
          ) : (
            <ul className="cat-list">
              {categories.map((c) => (
                <li key={c._id}>
                  <span>{c.name}</span>
                  <span className="muted small">{formatMoney(spentFor(c.name))} this month</span>
                  <button className="btn btn-small btn-danger" onClick={() => deleteCategory(c)}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
