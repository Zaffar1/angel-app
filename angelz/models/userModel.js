const connectDB = require('../config/db');


exports.findByEmail = async (email) => {
const pool = await connectDB();
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};

exports.createUser = async (userData) => {
const pool = await connectDB();
  const {
    name,
    last_name,
    email,
    password,
    contact_no,
    description,
    type,
    image,
    city,
    state,
    zipcode,
    lat,
    lng,
  } = userData;
  
    const [result] = await pool.query(
    `INSERT INTO users 
     (name, last_name, email, password, contact_no, description, type, image, city, state, zipcode, lat, lng) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, last_name, email, password, contact_no, description, type, image, city, state, zipcode, lat, lng]
  );

  return result.insertId;
};



exports.findById = async (id) => {
    const pool = await connectDB();
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
}

exports.updateUser = async (id, fields) => {
  const pool = await connectDB();
  const fieldStr = Object.keys(fields).map(f => `${f} = ?`).join(", ");
  const values = Object.values(fields);

  await pool.query(`UPDATE users SET ${fieldStr} WHERE id = ?`, [...values, id]);
};


exports.getProfileById = async (id) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `SELECT id, name, last_name, email, contact_no, description, type, image,address, city, state, country, zipcode, lat, lng, isApproved, status, created_at, updated_at 
     FROM users WHERE id = ?`,
    [id]
  );
  return rows[0];
};

exports.deleteUser = async (id) => {
  const pool = await connectDB();
  const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
  return result.affectedRows > 0;
};