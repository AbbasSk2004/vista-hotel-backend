const Room = require('../models/Room');

async function getRooms(req, res) {
  try {
    const rooms = await Room.findAll(req.query);
    return res.status(200).json(rooms);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function createRoom(req, res) {
  try {
    const { room_number, type, price_per_night, status, floor } = req.body;
    if (!room_number || !type || price_per_night == null || floor == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const room = await Room.create({ room_number, type, price_per_night, status, floor });
    return res.status(201).json(room);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Room number already exists' });
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function updateRoom(req, res) {
  try {
    const room = await Room.update(req.params.id, req.body);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    return res.status(200).json(room);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function deleteRoom(req, res) {
  try {
    const deleted = await Room.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Room not found' });
    return res.status(200).json({ message: 'Room deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getRooms, createRoom, updateRoom, deleteRoom };
