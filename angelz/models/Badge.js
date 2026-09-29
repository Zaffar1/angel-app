const connectDB = require('../config/db');

async function findAll({ limit, offset, search }) {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `
    SELECT * FROM badges
    WHERE title LIKE ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
    `,
    [`%${search}%`, limit, offset]
  );
  return rows;
}

async function count(search) {
  const pool = await connectDB();
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS total FROM badges WHERE title LIKE ?`,
    [`%${search}%`]
  );
  return row.total;
}

async function create(data) {
  const pool = await connectDB();
  const [result] = await pool.query(
    `
    INSERT INTO badges (title, min_points, max_points, status, description)
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      data.title,
      data.min_points,
      data.max_points,
      data.status || 'active',
      data.description
    ]
  );
  return { id: result.insertId, ...data };
}

  async function findById(id) {
    const pool = await connectDB();
    const [[row]] = await pool.query(`SELECT * FROM badges WHERE id = ?`, [id]);
    if (!row) throw new AppError("Badge not found", 404);
    return row;
  }

// async function findById(id) {
//   const pool = await connectDB();
//   const [[row]] = await pool.query(
//     `SELECT * FROM badges WHERE id = ?`,
//     [id]
//   );
//   return row;
// }

async function update(id, data) {
  const pool = await connectDB();
  return pool.query(
    `
    UPDATE badges
    SET title = ?, min_points = ?, max_points = ?, status = ?, description = ?
    WHERE id = ?
    `,
    [
      data.title,
      data.min_points,
      data.max_points,
      data.status,
      data.description,
      id
    ]
  );
}

async function remove(id) {
  const pool = await connectDB();
  return pool.query(`DELETE FROM badges WHERE id = ?`, [id]);
}

module.exports = {
  findAll,
  count,
  create,
  findById,
  update,
  remove
};
