const Guest = require('../models/Guest');

async function getGuests(req, res) {
  try {
    const guests = await Guest.findAll(req.query.search);
    return res.status(200).json(guests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function createGuest(req, res) {
  try {
    const { full_name, email, phone, id_document, nationality } = req.body;
    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    const guest = await Guest.create({ full_name, email, phone, id_document, nationality });
    return res.status(201).json(guest);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getGuestById(req, res) {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    return res.status(200).json(guest);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getGuests, createGuest, getGuestById };
