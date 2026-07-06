const mongoose = require('mongoose');

const isObjectId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

const roomSchema = new mongoose.Schema(
  {
    postgreSQL_id: { type: Number, sparse: true, index: true },
    room_number: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['SINGLE', 'DOUBLE', 'SUITE'], required: true },
    price_per_night: { type: Number, required: true },
    status: { type: String, enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'], default: 'AVAILABLE' },
    floor: { type: Number, required: true },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.room_id = ret._id.toString();
        return ret;
      },
    },
  }
);

const RoomModel = mongoose.model('Room', roomSchema, 'rooms');

// Extract a usable string id from a value that might be an ObjectId, string, or populated object
const extractId = (id) => {
  if (!id) return null;
  if (typeof id === 'object' && id._id) return String(id._id);
  return String(id);
};

const Room = {
  findAll: async (filters = {}) => {
    let query = {};
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    return RoomModel.find(query).sort({ floor: 1, room_number: 1 });
  },

  findById: async (id) => {
    const strId = extractId(id);
    if (!strId) return null;
    if (isObjectId(strId)) {
      const result = await RoomModel.findById(strId);
      if (result) return result;
    }
    const parsedId = parseInt(strId);
    if (!isNaN(parsedId)) {
      return RoomModel.findOne({ postgreSQL_id: parsedId });
    }
    return null;
  },

  create: async ({ room_number, type, price_per_night, status, floor }) => {
    const room = new RoomModel({
      room_number,
      type,
      price_per_night,
      status: status || 'AVAILABLE',
      floor,
    });
    await room.save();
    return room.toObject();
  },

  update: async (id, data) => {
    const strId = extractId(id);
    if (!strId) return null;
    const query = isObjectId(strId) ? { _id: strId } : { postgreSQL_id: parseInt(strId) };
    if (!isObjectId(strId) && isNaN(parseInt(strId))) return null;
    const updateData = {};
    if (data.room_number) updateData.room_number = data.room_number;
    if (data.type) updateData.type = data.type;
    if (data.price_per_night) updateData.price_per_night = data.price_per_night;
    if (data.status) updateData.status = data.status;
    if (data.floor) updateData.floor = data.floor;
    return RoomModel.findOneAndUpdate(query, updateData, { new: true });
  },

  updateStatus: async (id, status) => {
    const strId = extractId(id);
    if (!strId) return null;
    const query = isObjectId(strId) ? { _id: strId } : { postgreSQL_id: parseInt(strId) };
    if (!isObjectId(strId) && isNaN(parseInt(strId))) return null;
    return RoomModel.findOneAndUpdate(query, { status }, { new: true });
  },

  remove: async (id) => {
    const strId = extractId(id);
    if (!strId) return false;
    const query = isObjectId(strId) ? { _id: strId } : { postgreSQL_id: parseInt(strId) };
    if (!isObjectId(strId) && isNaN(parseInt(strId))) return false;
    const result = await RoomModel.findOneAndDelete(query);
    return result !== null;
  },

  countByStatus: async () => {
    return RoomModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]);
  },
};

module.exports = Room;
