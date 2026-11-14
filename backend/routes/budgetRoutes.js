const router = require('express').Router();
const c = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(c.getBudget).put(c.setBudget);

module.exports = router;
