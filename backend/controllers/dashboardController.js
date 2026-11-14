const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/error');
const { monthRange, isValidMonth, currentMonth } = require('../utils/helpers');
const { buildBudgetSummary } = require('./budgetController');

// GET /api/dashboard?month=YYYY-MM
const getDashboard = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonth();
  if (!isValidMonth(month)) {
    res.status(400);
    throw new Error('Month must be YYYY-MM');
  }
  const userId = req.user._id;
  const { start, end } = monthRange(month);

  const sumByType = (match) =>
    Transaction.aggregate([{ $match: match }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]);

  const [allTime, monthly, recent, budget] = await Promise.all([
    sumByType({ user: userId }),
    sumByType({ user: userId, date: { $gte: start, $lt: end } }),
    Transaction.find({ user: userId }).sort({ date: -1, createdAt: -1 }).limit(5),
    buildBudgetSummary(userId, month),
  ]);

  const pick = (rows, type) => rows.find((r) => r._id === type)?.total || 0;

  const totalIncome = pick(allTime, 'income');
  const totalExpenses = pick(allTime, 'expense');
  const monthIncome = pick(monthly, 'income');
  const monthExpenses = pick(monthly, 'expense');

  res.json({
    month,
    totalIncome,
    totalExpenses,
    totalBalance: totalIncome - totalExpenses, // calculated dynamically, never stored
    monthly: {
      income: monthIncome,
      expenses: monthExpenses,
      savings: monthIncome - monthExpenses,
      byCategory: budget.byCategory,
    },
    budget: {
      amount: budget.budget,
      hasBudget: budget.hasBudget,
      spent: budget.spent,
      remaining: budget.remaining,
      percentUsed: budget.percentUsed,
    },
    recentTransactions: recent,
  });
});

module.exports = { getDashboard };
