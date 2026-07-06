const mongoose = require('mongoose');

// Strict check: only 24-char hex strings are real ObjectIds.
// mongoose.Types.ObjectId.isValid(1) returns true for integers, causing CastError.
const isObjectId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

const staffSchema = new mongoose.Schema(
  {
    postgreSQL_id: { type: Number, sparse: true, index: true },
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'RECEPTIONIST'], required: true },
    created_at: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.staff_id = ret._id.toString();
        return ret;
      },
    },
  }
);

const StaffModel = mongoose.model('Staff', staffSchema, 'staff');

const Staff = {
  findByEmail: async (email) => {
    return StaffModel.findOne({ email });
  },

  findById: async (id) => {
    const strId = String(id);
    if (isObjectId(strId)) {
      const result = await StaffModel.findById(strId);
      if (result) return result;
    }
    // Fall back to postgreSQL_id
    const parsedId = parseInt(strId);
    if (!isNaN(parsedId)) {
      return StaffModel.findOne({ postgreSQL_id: parsedId });
    }
    return null;
  },

  findAll: async () => {
    return StaffModel.find().sort({ created_at: 1 });
  },

  create: async ({ full_name, email, password_hash, role }) => {
    const staff = new StaffModel({ full_name, email, password_hash, role });
    await staff.save();
    return staff.toObject();
  },

  update: async (id, fields) => {
    const strId = String(id);
    const query = isObjectId(strId)
      ? { _id: strId }
      : { postgreSQL_id: parseInt(strId) };
    if (!isObjectId(strId) && isNaN(parseInt(strId))) return null;
    return StaffModel.findOneAndUpdate(query, fields, { new: true });
  },

  remove: async (id) => {
    const strId = String(id);
    const query = isObjectId(strId)
      ? { _id: strId }
      : { postgreSQL_id: parseInt(strId) };
    if (!isObjectId(strId) && isNaN(parseInt(strId))) return false;
    const result = await StaffModel.findOneAndDelete(query);
    return result !== null;
  },
};

module.exports = Staff;
