const mongoose = require('mongoose');

const isObjectId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

const guestSchema = new mongoose.Schema(
  {
    postgreSQL_id: { type: Number, sparse: true, index: true },
    full_name: { type: String, required: true, index: true },
    email: { type: String, sparse: true, unique: true, index: true },
    phone: String,
    id_document: String,
    nationality: String,
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.guest_id = ret._id.toString();
        return ret;
      },
    },
  }
);

const GuestModel = mongoose.model('Guest', guestSchema, 'guests');

const Guest = {
  findAll: async (search) => {
    if (search) {
      const regex = new RegExp(search, 'i');
      return GuestModel.find({
        $or: [{ full_name: regex }, { email: regex }, { phone: regex }],
      }).sort({ full_name: 1 });
    }
    return GuestModel.find().sort({ full_name: 1 });
  },

  findById: async (id) => {
    const strId = String(id);
    if (isObjectId(strId)) {
      const result = await GuestModel.findById(strId);
      if (result) return result;
    }
    const parsedId = parseInt(strId);
    if (!isNaN(parsedId)) {
      return GuestModel.findOne({ postgreSQL_id: parsedId });
    }
    return null;
  },

  create: async (data) => {
    const guest = new GuestModel({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      id_document: data.id_document,
      nationality: data.nationality,
    });
    await guest.save();
    return guest.toObject();
  },

  update: async (id, data) => {
    const strId = String(id);
    const query = isObjectId(strId)
      ? { _id: strId }
      : { postgreSQL_id: parseInt(strId) };
    if (!isObjectId(strId) && isNaN(parseInt(strId))) return null;
    const updateData = {};
    if (data.full_name) updateData.full_name = data.full_name;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.id_document) updateData.id_document = data.id_document;
    if (data.nationality) updateData.nationality = data.nationality;
    return GuestModel.findOneAndUpdate(query, updateData, { new: true });
  },
};

module.exports = Guest;
