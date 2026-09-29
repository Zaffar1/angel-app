const mongoose = require('mongoose');
const User = require('../../models/User');
const connectDB = require('../../config/db');


async function approveUser(userId) {
  const pool = await connectDB();

  await pool.query(
    `UPDATE users SET isApproved = 'approved' WHERE id = ?`,
    [userId]
  );

  const [rows] = await pool.query(
    `SELECT id, name, email, type, status, isApproved, created_at 
     FROM users WHERE id = ?`,
    [userId]
  );

  return rows[0] || null;
}


async function rejectUser(userId) {
  const pool = await connectDB();

  await pool.query("UPDATE users SET isApproved = 'rejected' WHERE id = ?",[userId]);
  
  const [rows] = await pool.query(
    `SELECT id, name, email, type, status, isApproved, created_at 
     FROM users WHERE id = ?`,
    [userId]
  );

  return rows[0] || null;

};

module.exports = {
  approveUser,
  rejectUser
};
