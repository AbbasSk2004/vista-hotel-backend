const express = require('express');
const { getSummary } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('ADMIN'));

router.get('/summary', getSummary);

module.exports = router;
