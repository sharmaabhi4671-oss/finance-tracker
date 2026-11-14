// Returns [start, end) Date range (UTC) for a "YYYY-MM" string
const monthRange = (month) => {
  const [y, m] = month.split('-').map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
};

const isValidMonth = (month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month || '');

const currentMonth = () => new Date().toISOString().slice(0, 7);

module.exports = { monthRange, isValidMonth, currentMonth };
