const mongoose = require('mongoose');

const isObjectId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

const extractId = (id) => {
  if (!id) return null;
  if (typeof id === 'object' && id._id) return String(id._id);
  return String(id);
};

const reservationSchema = new mongoose.Schema(
  {
    postgreSQL_id: { type: Number, sparse: true, index: true },
    guest_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
    postgreSQL_guest_id: Number,
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    postgreSQL_room_id: Number,
    check_in_date: { type: Date, required: true, index: true },
    check_out_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'],
      default: 'PENDING',
    },
    total_price: { type: Number, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    postgreSQL_created_by: Number,
    created_at: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.reservation_id = ret._id.toString();
        // Flatten populated guest_id and room_id for convenience
        if (ret.guest_id && typeof ret.guest_id === 'object') {
          ret.guest_name = ret.guest_id.full_name || '';
        }
        if (ret.room_id && typeof ret.room_id === 'object') {
          ret.room_number = ret.room_id.room_number || '';
        }
        return ret;
      },
    },
  }
);

const ReservationModel = mongoose.model('Reservation', reservationSchema, 'reservations');

// Normalize a lean() reservation document for the frontend
const normalizeReservation = (r) => {
  if (!r) return null;
  return {
    ...r,
    reservation_id: String(r._id),
    guest_name: r.guest_id?.full_name || '',
    room_number: r.room_id?.room_number || '',
  };
};

const buildQuery = (id) => {
  const strId = extractId(id);
  if (!strId) return null;
  if (isObjectId(strId)) return { _id: strId };
  const n = parseInt(strId);
  if (!isNaN(n)) return { postgreSQL_id: n };
  return null;
};

const Reservation = {
  findAll: async ({ search, status, date }) => {
    let query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      const guests = await mongoose.model('Guest').find({ full_name: regex });
      const guestIds = guests.map((g) => g._id);
      query.guest_id = { $in: guestIds };
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      const d = new Date(date);
      query.$expr = {
        $and: [
          { $lte: ['$check_in_date', d] },
          { $gte: ['$check_out_date', d] },
        ],
      };
    }

    const docs = await ReservationModel.find(query)
      .populate('guest_id', 'full_name email phone')
      .populate('room_id', 'room_number type price_per_night status')
      .sort({ created_at: -1 })
      .lean();
    return docs.map(normalizeReservation);
  },

  findById: async (id) => {
    const query = buildQuery(id);
    if (!query) return null;
    const doc = await ReservationModel.findOne(query)
      .populate('guest_id', 'full_name email phone')
      .populate('room_id', 'room_number type price_per_night status')
      .lean();
    return normalizeReservation(doc);
  },

  create: async (data) => {
    const reservation = new ReservationModel({
      guest_id: data.guest_id,
      room_id: data.room_id,
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      status: data.status || 'CONFIRMED',
      total_price: data.total_price,
      created_by: data.created_by,
    });
    await reservation.save();
    const doc = await ReservationModel.findById(reservation._id)
      .populate('guest_id', 'full_name email phone')
      .populate('room_id', 'room_number type price_per_night status')
      .lean();
    return normalizeReservation(doc);
  },

  updateStatus: async (id, status) => {
    const query = buildQuery(id);
    if (!query) return null;
    return ReservationModel.findOneAndUpdate(query, { status }, { new: true })
      .populate('guest_id', 'full_name email phone')
      .populate('room_id', 'room_number type price_per_night status');
  },

  todayCheckIns: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const docs = await ReservationModel.find({
      check_in_date: { $gte: today, $lt: tomorrow },
      status: { $in: ['CONFIRMED', 'CHECKED_IN'] },
    })
      .populate('guest_id', 'full_name email phone')
      .populate('room_id', 'room_number type price_per_night status')
      .lean();
    return docs.map(normalizeReservation);
  },

  monthlyRevenue: async () => {
    const invoices = mongoose.model('Invoice');
    return invoices.aggregate([
      { $match: { status: { $in: ['PAID', 'PARTIAL'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$issue_date' } },
          revenue: { $sum: '$amount_paid' },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
      { $project: { month: '$_id', revenue: 1, _id: 0 } },
    ]);
  },

  occupancyStats: async () => {
    const rooms = mongoose.model('Room');
    const total = await rooms.countDocuments();
    const occupied = await rooms.countDocuments({ status: 'OCCUPIED' });
    const available = await rooms.countDocuments({ status: 'AVAILABLE' });
    return { total_rooms: total, occupied_rooms: occupied, available_rooms: available };
  },
};

module.exports = Reservation;
