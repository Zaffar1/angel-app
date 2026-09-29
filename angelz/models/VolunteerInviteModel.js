const connectDB = require('../config/db');

exports.findOrganizationByUserId = async (userId) => {
  const db = await connectDB();
  const [rows] = await db.query(
    'SELECT * FROM organizations WHERE user_id = ?',
    [userId]
  );
  return rows[0];
};

exports.findInviteByOrgIdAndUser = async (orgId, userId) => {
  if (!orgId || !userId) throw new Error("orgId and userId are required");

  const db = await connectDB();
  const [rows] = await db.query(
    `
    SELECT *
    FROM volunteer_invites
    WHERE organization_id = ?
      AND user_id = ?
    `,
    [orgId, userId]
  );
  return rows[0];
};


exports.findOrganizationById = async (orgId) => {
  const db = await connectDB();

  const [rows] = await db.query(
    "SELECT * FROM organizations WHERE id = ?",
    [orgId]
  );

  return rows[0];
};


exports.findInvite = async (orgId, userId) => {
  const db = await connectDB();
  const [rows] = await db.query(
    'SELECT * FROM volunteer_invites WHERE organization_id = ? AND user_id = ?',
    [orgId, userId]
  );
  return rows[0];
};

exports.findInvitation = async (orgId, userId) => {
  const db = await connectDB();
  const [rows] = await db.query(
    "SELECT * FROM organization_volunteers WHERE organization_id = ? AND user_id = ? AND status = 'accepted'",
    [orgId, userId]
  );
  return rows[0] || null;
};

exports.createInvite = async (orgId, userId, token, expiresAt) => {
  const db = await connectDB();
  return db.query(
    `INSERT INTO volunteer_invites 
     (organization_id, user_id, token, expires_at)
     VALUES (?, ?, ?, ?)`,
    [orgId, userId, token, expiresAt]
  );
};

exports.findInviteByOrgId = async (orgId) => {
  if (!orgId) throw new Error("orgId is required");

  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT * FROM volunteer_invites WHERE organization_id = ?`,
    [orgId]
  );
  return rows[0];
};


exports.findOrgVolunteers = async (orgId) => {
  if (!orgId) throw new Error("orgId is required");

  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT DISTINCT user_id FROM organization_volunteers WHERE organization_id = ?`,
    [orgId]
  );
  return rows;
};

exports.acceptInviteRequest = async (orgId, userId) => {
  const pool = await connectDB();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO organization_volunteers
       (organization_id, user_id, status)
       VALUES (?, ?, 'accepted')`,
      [orgId, userId]
    );

    await conn.query(
      `UPDATE notifications n
      JOIN organizations o ON o.id = ?
      SET n.type = 'invite_accepted'
      WHERE n.sender_id = o.user_id
        AND n.receiver_id = ?`,
      [orgId, userId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};


// exports.acceptInviteRequest = async (orgId, userId) => {
//   const db = await connectDB();
//   return db.query(
//     `INSERT INTO organization_volunteers
//      (organization_id, user_id, status)
//      VALUES (?, ?, 'accepted')`,
//     [orgId, userId]
//   );
// };


exports.rejectInviteRequest = async (orgId, userId) => {
  const pool = await connectDB();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO organization_volunteers
       (organization_id, user_id, status)
       VALUES (?, ?, 'rejected')`,
      [orgId, userId]
    );

    await conn.query(
      `UPDATE notifications n
      JOIN organizations o ON o.id = ?
      SET n.type = 'invite_rejected'
      WHERE n.sender_id = o.user_id
        AND n.receiver_id = ?`,
      [orgId, userId]
    );


    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// exports.rejectInviteRequest = async (orgId, userId) => {
//   const db = await connectDB();
//   return db.query(
//     `INSERT INTO organization_volunteers
//      (organization_id, user_id, status)
//      VALUES (?, ?, 'rejected')`,
//     [orgId, userId]
//   );
// };

exports.deleteInvite = async (id) => {
  const db = await connectDB();
  return db.query(
    'DELETE FROM volunteer_invites WHERE id = ?',
    [id]
  );
};


exports.findUserById = async (userId) => {
  const db = await connectDB();
  const [rows] = await db.query(
    'SELECT email FROM users WHERE id = ?',
    [userId]
  );
  return rows[0];
};
