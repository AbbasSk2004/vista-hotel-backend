const express = require('express');
const {
  getReservations,
  createReservation,
  checkIn,
  checkOut,
} = require('../controllers/reservationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getReservations);
router.post('/', createReservation);
router.put('/:id/checkin', checkIn);
router.put('/:id/checkout', checkOut);

module.exports = router;
