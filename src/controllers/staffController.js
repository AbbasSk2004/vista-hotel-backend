const bcrypt = require('bcryptjs');
const Staff = require('../models/Staff');
const mongoose = require('mongoose');

const SALT_ROUNDS = 10;
const VALID_ROLES = ['ADMIN', 'RECEPTIONIST'];

async function getAllStaff(req, res) {
  try {
    const staff = await Staff.findAll();
    return res.status(200).json(staff);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function createStaff(req, res) {
  try {
    const { full_name, email, password, role } = req.body;

    if (!full_name?.trim() || !email?.trim() || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Role must be ADMIN or RECEPTIONIST' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await Staff.findByEmail(email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const created = await Staff.create({
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      role,
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000 || err.keyPattern?.email) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function updateStaff(req, res) {
  try {
    const { id } = req.params;
    const { full_name, password, role } = req.body;
    let { email } = req.body;

    const current = await Staff.findById(id);
    if (!current) return res.status(404).json({ error: 'Staff member not found' });

    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Role must be ADMIN or RECEPTIONIST' });
    }

    if (email !== undefined) {
      email = email.trim().toLowerCase();
      const existing = await Staff.findByEmail(email);
      if (existing) {
        // Check if it's a different user
        const existingId = existing.postgreSQL_id || existing._id.toString();
        const currentId = current.postgreSQL_id || current._id.toString();
        if (existingId !== currentId) {
          return res.status(400).json({ error: 'Email already in use' });
        }
      }
    }

    if (password !== undefined && password !== '' && password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name.trim();
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const updated = await Staff.update(id, updateData);
    if (!updated) return res.status(404).json({ error: 'Staff member not found' });

    return res.status(200).json(updated);
  } catch (err) {
    if (err.code === 11000 || err.keyPattern?.email) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function deleteStaff(req, res) {
  try {
    const { id } = req.params;

    // Compare IDs - handle both ObjectId and postgreSQL_id
    const userIdStr = String(req.user.staff_id);
    const paramIdStr = String(id);
    
    if (userIdStr === paramIdStr) {
      return res.status(403).json({ error: 'You cannot delete your own account' });
    }

    const deleted = await Staff.remove(id);
    if (!deleted) return res.status(404).json({ error: 'Staff member not found' });

    return res.status(200).json({ message: 'Staff member deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getAllStaff, createStaff, updateStaff, deleteStaff };
