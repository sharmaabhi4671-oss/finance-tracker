const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/error');
const { monthRange, isValidMonth, currentMonth } = require('../utils/helpers');

const buildBudgetSummary = async (userId, month) => {
  const { start, end } = monthRange(month);
  const budget = await Budget.findOne({ user: userId, month });

  const [byCategory, totals] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const spent = totals[0]?.total || 0;
  const amount = budget ? budget.amount : 0;

  return {
    month,
    budget: amount,
    hasBudget: !!budget,
    spent,
    remaining: amount - spent,
    percentUsed: amount > 0 ? Math.round((spent / amount) * 100) : 0,
    byCategory: byCategory.map((c) => ({ category: c._id, total: c.total })),
  };
};

// GET /api/budget?month=YYYY-MM
const getBudget = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonth();
  if (!isValidMonth(month)) {
    res.status(400);
    throw new Error('Month must be YYYY-MM');
  }
  res.json(await buildBudgetSummary(req.user._id, month));
});

// PUT /api/budget  { month, amount }
const setBudget = asyncHandler(async (req, res) => {
  const { month, amount } = req.body;
  if (!isValidMonth(month)) {
    res.status(400);
    throw new Error('Month must be YYYY-MM');
  }
  if (amount === undefined || amount === '' || isNaN(Number(amount)) || Number(amount) < 0) {
    res.status(400);
    throw new Error('Budget must be a number, 0 or greater');
  }
  await Budget.findOneAndUpdate(
    { user: req.user._id, month },
    { amount: Number(amount) },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json(await buildBudgetSummary(req.user._id, month));
});

module.exports = { getBudget, setBudget, buildBudgetSummary };
