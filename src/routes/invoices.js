const express = require('express');
const { getInvoice } = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/:reservationId', getInvoice);

module.exports = router;
