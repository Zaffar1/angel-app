const connectDB = require("../config/db");
const { toLocalISOString } = require("../utils/datetime");


// Insert or Update (Upsert) organization record

const upsertOrganization = async (userId, data) => {
  const pool = await connectDB();

  // Make sure "services" is properly stored as JSON in DB
  const servicesValue = Array.isArray(data.services)
    ? JSON.stringify(data.services)
    : data.services || "[]";

  const [rows] = await pool.query(
    "SELECT id FROM organizations WHERE user_id = ?",
    [userId]
  );

  if (rows.length > 0) {
    // UPDATE existing organization
    const [updateResult] = await pool.query(
      `UPDATE organizations SET company_name=?, type=?,services=?, organization_website=? WHERE user_id=?`,
      [
        data.company_name || "",
        data.company_type || "",
        servicesValue,
        data.organization_website || null,
        userId
      ]
    );

    return updateResult;

  } else {
    // INSERT new organization
    const [insertResult] = await pool.query(
      `INSERT INTO organizations
       (user_id, company_name, type, services, organization_website)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        data.company_name || "",
        data.company_type || "",
        servicesValue,
        data.organization_website || null
      ]
    );

    return insertResult;
  }
};


const findByUserId = async (userId) => {
  const pool = await connectDB();

  // Fetch organization by user_id
  const [orgRows] = await pool.query(
    `
    SELECT 
      id AS org_id,
      user_id AS id, 
      company_name, 
      type AS company_type,
      services,
      organization_website
    FROM organizations 
    WHERE user_id = ?
    `,
    [userId]
  );

  if (!orgRows.length) return null;

  const org = orgRows[0];

  // Get available organization types
  const [types] = await pool.query("SELECT name FROM organization_types");

  // Fetch missions created by this organization using org.id
  const [missions] = await pool.query(
    `
    SELECT 
      m.id,
      m.name,
      m.description,
      m.start_time,
      m.end_time,
      m.points,
      m.mission_type,
      m.file,
      m.status
    FROM missions m
    WHERE m.organization_id = ?
    ORDER BY m.created_at DESC
    `,
    [org.org_id]
  );

  // Fetch accepted volunteers for this organization
  const [volunteers] = await pool.query(
    `
    SELECT 
      u.id AS user_id,
      u.name,
      u.email,
      u.city,
      u.state,
      u.points,
      u.image,
      ov.assigned_by,
      ov.created_at AS assigned_at
    FROM organization_volunteers ov
    JOIN users u ON u.id = ov.user_id
    WHERE ov.status = 'accepted'
      AND ov.organization_id = ?
    ORDER BY ov.created_at DESC
    `,
    [org.org_id]
  );

  // Helper: attach volunteers info for each mission
  const formatMission = async (mission) => {
    const [pendingVolunteers] = await pool.query(
      `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.points,
        u.image
      FROM mission_pending_requests mpr
      JOIN users u ON u.id = mpr.volunteer_id
      WHERE mpr.mission_id = ?
      `,
      [mission.id]
    );

    const [assignedVolunteers] = await pool.query(
      `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.points,
        u.image
      FROM mission_assigned_volunteers mav
      JOIN users u ON u.id = mav.volunteer_id
      WHERE mav.mission_id = ?
      `,
      [mission.id]
    );

    let completedVolunteers = [];

    if (mission.status === "completed") {
      const [rows] = await pool.query(
        `
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.points,
          u.image
        FROM mission_assigned_volunteers mav
        JOIN users u ON u.id = mav.volunteer_id
        WHERE mav.mission_id = ?
        `,
        [mission.id]
      );
      completedVolunteers = rows;
    }

    return {
      ...mission,
      start_time: mission.start_time ? toLocalISOString(mission.start_time) : null,
      end_time: mission.end_time ? toLocalISOString(mission.end_time) : null,
      created_at: mission.created_at ? toLocalISOString(mission.created_at) : null,
      pending_volunteers: pendingVolunteers,
      assigned_volunteers: assignedVolunteers,
      completed_volunteers: completedVolunteers,
    };
  };

  // Format all missions in parallel
  const formattedMissions = await Promise.all(missions.map(formatMission));

  // Return the complete organization object
  return {
    ...org,
    company_type: org.company_type || "",
    all_company_types: types.map((t) => t.name),
    missions: formattedMissions,
    volunteers,
  };
};

const orgVols = async (id) => {
  const db = await connectDB();
  const [rows] = await db.query(
    `
    SELECT 
      u.id AS user_id,
      u.name,
      u.email,
      u.type,
      u.city,
      u.state,
      u.points,
      u.image,
      ov.organization_id
    FROM organization_volunteers ov
    JOIN users u ON ov.user_id = u.id
    WHERE ov.status = 'accepted'
      AND ov.organization_id = ?`,
    [id]
  );

  return rows;
};


const orgVolunteers = async (id) => {
  const db = await connectDB();
  const [rows] = await db.query(
    `
    SELECT 
      u.id AS user_id,
      u.name,
      u.email,
      u.type,
      u.city,
      u.state,
      u.points,
      u.image,
      ov.organization_id
    FROM organization_volunteers ov
    JOIN users u ON u.id = ov.user_id
    WHERE ov.status = 'accepted'
      AND ov.organization_id = ?
    `,
    [id]
  );

  return rows;
};


const getAllOrgTypes = async () => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM organization_types");
  return rows;
};

const getOrganizations = async (limit) => {
  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT 
        u.id AS user_id,
        u.name, 
        u.email, 
        u.type, 
        o.company_name,
        o.type AS company_type,
        o.services,
        o.organization_website,
        o.created_at
     FROM organizations o 
     JOIN users u ON o.user_id = u.id
     WHERE u.type = 'organization'
     ORDER BY o.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};


const getVolunteers = async (limit) => {
  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT * 
     FROM users
     WHERE type = 'volunteer'
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );

  const sanitized = rows.map(({ password, ...rest }) => rest);

  return sanitized;
};



const getMissions = async (limit) => {
  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT 
        m.id,
        m.name,
        m.description,
        m.points,
        m.start_time,
        m.end_time,
        o.company_name AS organization_name
     FROM missions m
     JOIN organizations o ON m.organization_id = o.id
     ORDER BY m.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};


module.exports = {
  upsertOrganization,
  findByUserId,
  orgVols,
  orgVolunteers,
  getAllOrgTypes,
  getOrganizations,
  getVolunteers,
  getMissions,
};