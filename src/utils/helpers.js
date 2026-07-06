function nightsBetween(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end - start;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function calculateTotal(pricePerNight, checkIn, checkOut) {
  return Number(pricePerNight) * nightsBetween(checkIn, checkOut);
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

module.exports = { nightsBetween, calculateTotal, todayISO };
