const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/error');
const { monthRange, isValidMonth } = require('../utils/helpers');

const validate = (res, { title, amount, type, category, date }) => {
  if (!title?.trim()) return fail(res, 'Title is required');
  if (amount === undefined || amount === '' || isNaN(Number(amount)) || Number(amount) <= 0)
    return fail(res, 'Amount must be a number greater than 0');
  if (!['income', 'expense'].includes(type)) return fail(res, 'Type must be income or expense');
  if (!category?.trim()) return fail(res, 'Category is required');
  if (!date || isNaN(new Date(date).getTime())) return fail(res, 'A valid date is required');
};

const fail = (res, message) => {
  res.status(400);
  throw new Error(message);
};

// GET /api/transactions?type=&category=&month=YYYY-MM&search=
const getTransactions = asyncHandler(async (req, res) => {
  const { type, category, month, search } = req.query;
  const filter = { user: req.user._id }; // users only ever see their own records

  if (type && ['income', 'expense'].includes(type)) filter.type = type;
  if (category) filter.category = category;
  if (month) {
    if (!isValidMonth(month)) return fail(res, 'Month must be YYYY-MM');
    const { start, end } = monthRange(month);
    filter.date = { $gte: start, $lt: end };
  }
  if (search) filter.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });
  res.json(transactions);
});

// POST /api/transactions
const createTransaction = asyncHandler(async (req, res) => {
  validate(res, req.body);
  const { title, amount, type, category, date } = req.body;
  const tx = await Transaction.create({
    user: req.user._id,
    title,
    amount: Number(amount),
    type,
    category,
    date: new Date(date),
  });
  res.status(201).json(tx);
});

// PUT /api/transactions/:id
const updateTransaction = asyncHandler(async (req, res) => {
  validate(res, req.body);
  const { title, amount, type, category, date } = req.body;
  const tx = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { title, amount: Number(amount), type, category, date: new Date(date) },
    { new: true, runValidators: true }
  );
  if (!tx) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  res.json(tx);
});

// DELETE /api/transactions/:id
const deleteTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!tx) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  res.json({ message: 'Transaction deleted', id: tx._id });
});

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction };
