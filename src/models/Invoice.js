const mongoose = require('mongoose');

const isObjectId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

const invoiceSchema = new mongoose.Schema({
  postgreSQL_id: { type: Number, sparse: true, index: true },
  reservation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true, unique: true },
  postgreSQL_reservation_id: Number,
  issue_date: { type: Date, required: true, default: Date.now },
  amount_due: { type: Number, required: true },
  amount_paid: { type: Number, default: 0 },
  payment_method: String,
  status: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },
});

const InvoiceModel = mongoose.model('Invoice', invoiceSchema, 'invoices');

const populateOpts = {
  path: 'reservation_id',
  populate: [
    { path: 'guest_id', select: 'full_name email phone' },
    { path: 'room_id', select: 'room_number type' },
  ],
};

const Invoice = {
  findByReservationId: async (reservationId) => {
    const strId = String(reservationId);
    const query = isObjectId(strId)
      ? { reservation_id: strId }
      : { postgreSQL_reservation_id: parseInt(strId) };
    return InvoiceModel.findOne(query).populate(populateOpts).lean();
  },

  create: async ({ reservation_id, amount_due, amount_paid, payment_method, status }) => {
    const invoice = new InvoiceModel({
      reservation_id,
      amount_due,
      amount_paid: amount_paid || 0,
      payment_method,
      status: status || 'UNPAID',
    });
    await invoice.save();
    return InvoiceModel.findById(invoice._id).populate(populateOpts).lean();
  },

  update: async (id, data) => {
    const strId = String(id);
    const query = isObjectId(strId) ? { _id: strId } : { postgreSQL_id: parseInt(strId) };
    if (!isObjectId(strId) && isNaN(parseInt(strId))) return null;
    const updateData = {};
    if (data.amount_paid !== undefined) updateData.amount_paid = data.amount_paid;
    if (data.payment_method) updateData.payment_method = data.payment_method;
    if (data.status) updateData.status = data.status;
    return InvoiceModel.findOneAndUpdate(query, updateData, { new: true }).populate(populateOpts);
  },

  findById: async (id) => {
    const strId = String(id);
    if (isObjectId(strId)) {
      const result = await InvoiceModel.findById(strId).populate(populateOpts).lean();
      if (result) return result;
    }
    const parsedId = parseInt(strId);
    if (!isNaN(parsedId)) {
      return InvoiceModel.findOne({ postgreSQL_id: parsedId }).populate(populateOpts).lean();
    }
    return null;
  },

  findAll: async () => {
    return InvoiceModel.find().populate(populateOpts).sort({ issue_date: -1 }).lean();
  },
};

module.exports = Invoice;
