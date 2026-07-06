const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const Invoice = require('../models/Invoice');
const { calculateTotal } = require('../utils/helpers');

async function getReservations(req, res) {
  try {
    const reservations = await Reservation.findAll({
      search: req.query.search,
      status: req.query.status,
      date: req.query.date,
    });
    return res.status(200).json(reservations);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function createReservation(req, res) {
  try {
    const { guest_id, room_id, check_in_date, check_out_date, status } = req.body;
    if (!guest_id || !room_id || !check_in_date || !check_out_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (new Date(check_out_date) <= new Date(check_in_date)) {
      return res.status(400).json({ error: 'Check-out must be after check-in' });
    }

    const room = await Room.findById(room_id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status === 'MAINTENANCE') {
      return res.status(400).json({ error: 'Room is under maintenance' });
    }

    const total_price = calculateTotal(room.price_per_night, check_in_date, check_out_date);

    const reservation = await Reservation.create({
      guest_id,
      room_id,
      check_in_date,
      check_out_date,
      status: status || 'CONFIRMED',
      total_price,
      created_by: req.user.staff_id,
    });

    const full = await Reservation.findById(reservation._id);
    return res.status(201).json(full);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function checkIn(req, res) {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    if (!['CONFIRMED', 'PENDING'].includes(reservation.status)) {
      return res.status(400).json({ error: `Cannot check in reservation with status ${reservation.status}` });
    }

    const room = await Room.findById(reservation.room_id);
    if (room.status === 'OCCUPIED' && reservation.status !== 'CHECKED_IN') {
      return res.status(400).json({ error: 'Room is already occupied' });
    }

    // Update both reservations and rooms
    await Reservation.updateStatus(req.params.id, 'CHECKED_IN');
    await Room.updateStatus(reservation.room_id, 'OCCUPIED');

    const updated = await Reservation.findById(req.params.id);
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function checkOut(req, res) {
  try {
    const { payment_method, amount_paid } = req.body;
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    if (reservation.status !== 'CHECKED_IN') {
      return res.status(400).json({ error: 'Guest must be checked in before checkout' });
    }

    const amountDue = Number(reservation.total_price);
    const paid = Number(amount_paid) || 0;
    let invoiceStatus = 'UNPAID';
    if (paid >= amountDue) invoiceStatus = 'PAID';
    else if (paid > 0) invoiceStatus = 'PARTIAL';

    // Update reservation and room status
    await Reservation.updateStatus(req.params.id, 'CHECKED_OUT');
    await Room.updateStatus(reservation.room_id, 'AVAILABLE');

    // Handle invoice
    const existing = await Invoice.findByReservationId(req.params.id);
    let invoice;
    if (existing) {
      invoice = await Invoice.update(existing._id, {
        amount_paid: paid,
        payment_method,
        status: invoiceStatus,
      });
    } else {
      invoice = await Invoice.create({
        reservation_id: req.params.id,
        amount_due: amountDue,
        amount_paid: paid,
        payment_method,
        status: invoiceStatus,
      });
    }

    const fullInvoice = await Invoice.findByReservationId(req.params.id);
    const updated = await Reservation.findById(req.params.id);
    return res.status(200).json({ reservation: updated, invoice: fullInvoice });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getReservations, createReservation, checkIn, checkOut };
