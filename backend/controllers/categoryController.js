const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/error');

// GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
  res.json(await Category.find({ user: req.user._id }).sort({ name: 1 }));
});

// POST /api/categories
const createCategory = asyncHandler(async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }
  const exists = await Category.findOne({
    user: req.user._id,
    name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  });
  if (exists) {
    res.status(409);
    throw new Error('Category already exists');
  }
  res.status(201).json(await Category.create({ user: req.user._id, name }));
});

// DELETE /api/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findOne({ _id: req.params.id, user: req.user._id });
  if (!cat) {
    res.status(404);
    throw new Error('Category not found');
  }
  const inUse = await Transaction.exists({ user: req.user._id, type: 'expense', category: cat.name });
  if (inUse) {
    res.status(400);
    throw new Error('Category is used by existing transactions and cannot be deleted');
  }
  await cat.deleteOne();
  res.json({ message: 'Category deleted', id: cat._id });
});

module.exports = { getCategories, createCategory, deleteCategory };
