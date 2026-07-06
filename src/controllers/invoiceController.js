const Invoice = require('../models/Invoice');

async function getInvoice(req, res) {
  try {
    const invoice = await Invoice.findByReservationId(req.params.reservationId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    return res.status(200).json(invoice);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getInvoice };
