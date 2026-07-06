const express = require('express');
const { getRooms, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getRooms);
router.post('/', roleMiddleware('ADMIN'), createRoom);
router.put('/:id', roleMiddleware('ADMIN'), updateRoom);
router.delete('/:id', roleMiddleware('ADMIN'), deleteRoom);

module.exports = router;
