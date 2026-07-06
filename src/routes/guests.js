const express = require('express');
const { getGuests, createGuest, getGuestById } = require('../controllers/guestController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getGuests);
router.get('/:id', getGuestById);
router.post('/', createGuest);

module.exports = router;
