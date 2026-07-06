const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const staff = await Staff.findByEmail(email);
    if (!staff) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, staff.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Always use MongoDB _id (ObjectId string) as the canonical identifier
    const staffId = staff._id.toString();

    const token = jwt.sign(
      { staff_id: staffId, email: staff.email, role: staff.role, full_name: staff.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      token,
      user: {
        staff_id: staffId,
        full_name: staff.full_name,
        email: staff.email,
        role: staff.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function getMe(req, res) {
  try {
    const staff = await Staff.findById(req.user.staff_id);
    if (!staff) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(staff);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { login, getMe };
