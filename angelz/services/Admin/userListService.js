const User = require('../../models/User');
const Organization = require('../../models/Organization');
const OrganizationMedia = require('../../models/OrganizationMedia');
const { default: mongoose } = require('mongoose');
const connectDB = require('../../config/db');

async function getDashboardSummary() {
  const [organizations, volunteers, missions] = await Promise.all([
    Organization.getOrganizations(6),
    Organization.getVolunteers(6),
    Organization.getMissions(6),
  ]);

  return { organizations, volunteers, missions };
}


async function getDashboardStats(page = 1, limit = 10, sortBy = "id", sortOrder = "desc") {
  const pool = await connectDB();
  const offset = (page - 1) * limit;

  const SORTABLE_COLUMNS = {
    id: "m.id",
    name: "m.name",
    mission_type: "m.mission_type",
    status: "m.status",
    organization_name: "o.company_name",
    created_at: "m.created_at",
    assigned_count: `(SELECT COUNT(*) FROM mission_assigned_volunteers mav WHERE mav.mission_id = m.id)`,
    applied_count: `(SELECT COUNT(*) FROM mission_pending_requests mpr WHERE mpr.mission_id = m.id)`
  };

  const sortColumn = SORTABLE_COLUMNS[sortBy] || "m.id";
  const order = sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

  // Fetch total counts
  const [[{ totalUsers }]] = await pool.query(
    "SELECT COUNT(*) AS totalUsers FROM users"
  );

  const [[{ totalOrganizations }]] = await pool.query(
    "SELECT COUNT(*) AS totalOrganizations FROM users WHERE type = 'organization'"
  );

  const [[{ totalVolunteers }]] = await pool.query(
    "SELECT COUNT(*) AS totalVolunteers FROM users WHERE type = 'volunteer'"
  );

  const [[{ newUsersLast7 }]] = await pool.query(
    "SELECT COUNT(*) AS newUsersLast7 FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
  );

  const [[{ totalMissions }]] = await pool.query(
    "SELECT COUNT(*) AS totalMissions FROM missions"
  );

  const [[{ totalFeeds }]] = await pool.query(
    "SELECT COUNT(*) AS totalFeeds FROM missions WHERE can_post = 1"
  );

  const [[{ newOrgsLast7 }]] = await pool.query(
    "SELECT COUNT(*) AS newOrgsLast7 FROM users WHERE type = 'organization' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
  );

  // Fetch paginated missions with assigned/applied counts and organization info
  const [missions] = await pool.query(
    `
    SELECT 
      m.*, 
      o.company_name AS company_name,
      o.type AS company_type,
      (
        SELECT COUNT(*) 
        FROM mission_assigned_volunteers mav 
        WHERE mav.mission_id = m.id
      ) AS assigned_count,
      (
        SELECT COUNT(*) 
        FROM mission_pending_requests mpr 
        WHERE mpr.mission_id = m.id
      ) AS applied_count
    FROM missions AS m
    LEFT JOIN organizations AS o ON o.id = m.organization_id
    ORDER BY ${sortColumn} ${order}
    LIMIT ? OFFSET ?
    `,
    [limit, offset]
  );

  // Add assigned and applied volunteer details
  const missionsWithVolunteers = await Promise.all(
    missions.map(async (mission) => {
      const [assignedVolunteers] = await pool.query(
        `
        SELECT v.id, v.name, v.email, v.image, v.points
        FROM mission_assigned_volunteers mav
        JOIN users v ON v.id = mav.volunteer_id
        WHERE mav.mission_id = ?
        `,
        [mission.id]
      );

      const [appliedVolunteers] = await pool.query(
        `
        SELECT v.id, v.name, v.email, v.image, v.points
        FROM mission_pending_requests mpr
        JOIN users v ON v.id = mpr.volunteer_id
        WHERE mpr.mission_id = ?
        `,
        [mission.id]
      );

      return {
        ...mission,
        assigned_count: mission.assigned_count || 0,
        applied_count: mission.applied_count || 0,
        assigned_volunteers: assignedVolunteers || [],
        applied_volunteers: appliedVolunteers || [],
      };
    })
  );

  return {
    totalUsers,
    totalOrganizations,
    totalVolunteers,
    newUsersLast7,
    totalMissions,
    totalFeeds,
    newOrgsLast7,
    missions: missionsWithVolunteers,
    pagination: {
      page,
      limit,
      total: totalMissions,
      totalPages: Math.ceil(totalMissions / limit),
    },
  };
}


// async function getDashboardStats(page = 1, limit = 10) {
//   const pool = await connectDB();

//   const offset = (page - 1) * limit;

//   const [[{ totalUsers }]] = await pool.query(
//     "SELECT COUNT(*) AS totalUsers FROM users"
//   );

//   const [[{ totalOrganizations }]] = await pool.query(
//     "SELECT COUNT(*) AS totalOrganizations FROM users WHERE type = 'organization'"
//   );

//   const [[{ totalVolunteers }]] = await pool.query(
//     "SELECT COUNT(*) AS totalVolunteers FROM users WHERE type = 'volunteer'"
//   );

//   const [[{ newUsersLast7 }]] = await pool.query(
//     "SELECT COUNT(*) AS newUsersLast7 FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
//   );

//   const [[{ totalMissions }]] = await pool.query(
//     "SELECT COUNT(*) AS totalMissions FROM missions"
//   );

//   const [[{ totalFeeds }]] = await pool.query(
//     "SELECT COUNT(*) AS totalFeeds FROM missions WHERE can_post = 1"
//   );

//   const [[{ newOrgsLast7 }]] = await pool.query(
//     "SELECT COUNT(*) AS newOrgsLast7 FROM users WHERE type = 'organization' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
//   );

//   const [[{ missionsCount }]] = await pool.query(
//     "SELECT COUNT(*) AS missionsCount FROM missions"
//   );

//   const [allMissions] = await pool.query(
//     "SELECT * FROM missions ORDER BY created_at DESC LIMIT ? OFFSET ?",
//     [limit, offset]
//   );

//   return {
//     totalUsers,
//     totalOrganizations,
//     totalVolunteers,
//     newUsersLast7,
//     totalMissions,
//     totalFeeds,
//     newOrgsLast7,
//     missions: allMissions,
//     pagination: {
//       page,
//       limit,
//       total: missionsCount,
//       totalPages: Math.ceil(missionsCount / limit)
//     }
//   };
// }

async function listUsers({ page = 1, limit = 10, skip = 0, search, sortBy = 'created_at', sortOrder = 'desc', type, status, currentUserId }) {
  const pool = await connectDB();

  // Allowed sort columns (to avoid SQL injection)
  const allowedSort = ['id', 'name', 'email', 'created_at', 'status', 'type'];
  if (!allowedSort.includes(sortBy)) sortBy = 'created_at';
  const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Base filter
  let where = "WHERE type != 'admin' AND id != ?";
  const params = [currentUserId];

  // Status filter (e.g. pending/active/inactive)
  if (status) {
    where += " AND status = ?";
    params.push(status);
  }

  // Type filter (organization/volunteer)
  if (type) {
    where += " AND type = ?";
    params.push(type);
  }

  // Search by name/email
  if (search) {
    where += " AND (name LIKE ? OR email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  // Count total
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM users ${where}`,
    params
  );

  // Fetch paginated users
  const [users] = await pool.query(
    `SELECT id, name, email, type, status, created_at 
     FROM users 
     ${where}
     ORDER BY ${sortBy} ${order}
     LIMIT ? OFFSET ?`,
    [...params, limit, skip]
  );

  const totalPages = Math.ceil(total / limit) || 1;

  return { total, totalPages, page, limit, users };
}


async function approvedUsers({
  page = 1,
  limit = 10,
  skip = 0,
  search,
  sortBy = 'created_at',
  sortOrder = 'desc',
  type = 'organization',
  status,
  currentUserId
}) {
  const pool = await connectDB();

  // Base filter: approved users only, exclude admins
  let filter = `WHERE type != 'admin' AND isApproved = 'approved'`;
  const values = [];

  // Exclude current user if provided
  if (currentUserId) {
    filter += ` AND id != ?`;
    values.push(currentUserId);
  }

  // Search by name/email
  if (search) {
    filter += ` AND (name LIKE ? OR email LIKE ?)`;
    const likeSearch = `%${search}%`;
    values.push(likeSearch, likeSearch);
  }

  // Filter by type (defaults to organization)
  if (type) {
    filter += ` AND type = ?`;
    values.push(type);
  }

  // Filter by status if provided
  if (status) {
    filter += ` AND status = ?`;
    values.push(status);
  }

  // Sorting
  const allowedSort = ['id', 'name', 'email', 'created_at', 'updated_at', 'status', 'type'];
  const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Count
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total FROM users ${filter}`,
    values
  );

  const offset = skip || (page - 1) * limit;

  // Fetch users
  const [users] = await pool.query(
    `SELECT id, name,last_name, email,contact_no, type, status, created_at, updated_at
     FROM users
     ${filter}
     ORDER BY ${sortColumn} ${order}
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  const totalPages = Math.ceil(total / limit) || 1;

  return { total, totalPages, page, limit, users };
}



async function listOrganizations({
  page = 1,
  limit = 10,
  search,
  sortBy = "created_at",
  sortOrder = "desc",
  status
}) {
  const pool = await connectDB();

  const offset = (page - 1) * limit;

  // Allowed sortable columns (security)
  const allowedSortFields = ["created_at", "company_name", "status", "id"];
  if (!allowedSortFields.includes(sortBy)) {
    sortBy = "created_at";
  }

  const order = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

  // ----- Base Query -----
  let baseQuery = `
    FROM organizations o
    JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;

  const values = [];

  // ----- Filters -----
  if (search) {
    baseQuery += ` AND (o.company_name LIKE ? OR u.email LIKE ?)`;
    values.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    baseQuery += ` AND o.status = ?`;
    values.push(status);
  }

  // ----- Paginated Query -----
  const dataQuery = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.type,
      u.image,
      o.company_name,
      o.description AS company_description,
      o.type AS company_type,
      o.services,
      o.status,
      o.created_at
    ${baseQuery}
    ORDER BY ${sortBy} ${order}
    LIMIT ? OFFSET ?
  `;

  const paginatedValues = [...values, limit, offset];
  const [organizations] = await pool.query(dataQuery, paginatedValues);

  // ----- Count Query -----
  const countQuery = `
    SELECT COUNT(*) AS total
    ${baseQuery}
  `;

  const [[{ total }]] = await pool.query(countQuery, values);

  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    organizations
  };
}

function formatDateTime(date) {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 19);
  } catch (e) {
    return String(date);
  }
}

let hasMissionAssignedByCol = null;
async function checkMissionAssignedBy(pool) {
  if (hasMissionAssignedByCol !== null) return hasMissionAssignedByCol;
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM missions LIKE 'assigned_by'");
    if (cols.length > 0) {
      hasMissionAssignedByCol = true;
    } else {
      try {
        await pool.query("ALTER TABLE missions ADD COLUMN assigned_by INT NULL DEFAULT NULL COMMENT 'user or volunteer group id who assigned this mission'");
        hasMissionAssignedByCol = true;
      } catch (alterErr) {
        hasMissionAssignedByCol = false;
      }
    }
  } catch (e) {
    hasMissionAssignedByCol = false;
  }
  return hasMissionAssignedByCol;
}

let hasVgaTable = null;
async function checkVgaTable(pool) {
  if (hasVgaTable !== null) return hasVgaTable;
  try {
    const [tables] = await pool.query("SHOW TABLES LIKE 'volunteer_group_applications'");
    if (tables.length > 0) {
      hasVgaTable = true;
    } else {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS volunteer_group_applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            group_id INT NOT NULL,
            mission_id INT NOT NULL,
            status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_group_mission (group_id, mission_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        hasVgaTable = true;
      } catch (createErr) {
        hasVgaTable = false;
      }
    }
  } catch (e) {
    hasVgaTable = false;
  }
  return hasVgaTable;
}

async function listVolunteerGroups({
  page = 1,
  limit = 10,
  skip,
  search,
  sortBy = 'created_at',
  sortOrder = 'desc',
  status,
  city,
  state,
  country
}) {
  const pool = await connectDB();

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = skip !== undefined ? skip : (p - 1) * l;

  // Sorting
  const sortMap = {
    id: 'g.id',
    name: 'g.name',
    email: 'g.email',
    created_at: 'g.created_at',
    createdAt: 'g.created_at',
    status: 'g.status',
    points: 'points',
    members_count: 'members_count'
  };
  const sortCol = sortMap[sortBy] || 'g.created_at';
  const order = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Base filter
  let where = "WHERE g.type = 'volunteer_group'";
  const values = [];

  if (status) {
    where += " AND g.status = ?";
    values.push(status);
  }

  if (city) {
    where += " AND g.city = ?";
    values.push(city);
  }

  if (state) {
    where += " AND g.state = ?";
    values.push(state);
  }

  if (country) {
    where += " AND g.country = ?";
    values.push(country);
  }

  if (search) {
    where += " AND (g.name LIKE ? OR g.email LIKE ? OR g.contact_no LIKE ? OR g.city LIKE ?)";
    const like = `%${search}%`;
    values.push(like, like, like, like);
  }

  // 1. Total count query
  const countQuery = `SELECT COUNT(DISTINCT g.id) AS total FROM users g ${where}`;
  const [[{ total }]] = await pool.query(countQuery, values);

  if (total === 0) {
    return {
      page: p,
      limit: l,
      total: 0,
      totalPages: 1,
      volunteer_groups: []
    };
  }

  // 2. Paginated groups query
  const groupsQuery = `
    SELECT 
      g.id,
      g.name,
      g.email,
      g.type,
      g.role,
      g.contact_no,
      g.description,
      g.city,
      g.state,
      g.country,
      g.status,
      g.image,
      g.created_at,
      g.updated_at,
      COALESCE(SUM(v.points), 0) AS points,
      COUNT(DISTINCT v.id) AS members_count
    FROM users g
    LEFT JOIN users v ON v.invitedBy = g.id AND v.type = 'volunteer'
    ${where}
    GROUP BY g.id
    ORDER BY ${sortCol} ${order}
    LIMIT ? OFFSET ?
  `;

  const [groups] = await pool.query(groupsQuery, [...values, l, offset]);

  if (groups.length === 0) {
    return {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l) || 1,
      volunteer_groups: []
    };
  }

  const groupIds = groups.map(g => g.id);

  const hasAssignedBy = await checkMissionAssignedBy(pool);
  const hasVga = await checkVgaTable(pool);

  const subqueries = [];
  const subqueryParams = [];

  if (hasAssignedBy) {
    subqueries.push("SELECT assigned_by AS group_id, id AS mission_id, assigned_by FROM missions WHERE assigned_by IS NOT NULL AND assigned_by IN (?)");
    subqueryParams.push(groupIds);
  }

  if (hasVga) {
    subqueries.push("SELECT group_id, mission_id, group_id AS assigned_by FROM volunteer_group_applications WHERE group_id IN (?)");
    subqueryParams.push(groupIds);
  }

  subqueries.push("SELECT assigned_by AS group_id, mission_id, assigned_by FROM mission_assigned_volunteers WHERE assigned_by IN (?)");
  subqueryParams.push(groupIds);

  subqueries.push("SELECT u.invitedBy AS group_id, mav.mission_id, mav.assigned_by FROM mission_assigned_volunteers mav JOIN users u ON u.id = mav.volunteer_id WHERE u.invitedBy IN (?)");
  subqueryParams.push(groupIds);

  const unionSql = subqueries.join("\n      UNION\n      ");
  const missionAssignedByExpr = hasAssignedBy ? "COALESCE(m.assigned_by, link.assigned_by)" : "link.assigned_by";

  // 3. Batch fetch all linked missions for these groups (NO N+1 query!)
  const [missionLinks] = await pool.query(
    `
    SELECT DISTINCT
      link.group_id,
      m.id,
      m.name,
      m.description,
      m.lat,
      m.lng,
      m.start_time,
      m.end_time,
      m.file,
      m.relevant_distance,
      m.work_type,
      m.organization_id,
      m.can_post,
      m.posted_by,
      m.mission_type,
      m.volunteer_required,
      m.prefered_volunteer,
      m.points,
      m.allow_interaction,
      m.images,
      m.status,
      ${missionAssignedByExpr} AS assigned_by,
      m.created_at,
      m.updated_at,
      o.company_name,
      o.type AS company_type
    FROM (
    ${unionSql}
    ) AS link
    JOIN missions m ON m.id = link.mission_id
    LEFT JOIN organizations o ON (o.id = m.organization_id OR o.user_id = m.organization_id)
    ORDER BY m.created_at DESC
    `,
    subqueryParams
  );

  // 4. Batch fetch assigned_by user details for any missions that have assigned_by set (NO N+1 query!)
  const assignedByIds = [...new Set(missionLinks.map(m => m.assigned_by).filter(id => id !== null && id !== undefined && id !== ''))];
  const userMap = new Map();

  if (assignedByIds.length > 0) {
    const [assignedUsers] = await pool.query(
      `
      SELECT id, name, email, type, role, contact_no, description, city, state, country, status, image
      FROM users
      WHERE id IN (?)
      `,
      [assignedByIds]
    );
    for (const u of assignedUsers) {
      userMap.set(u.id, u);
    }
  }

  // 5. Format mission data and group by group_id
  const missionsByGroupId = new Map();
  for (const row of missionLinks) {
    const { group_id, ...missionData } = row;

    let assignedUserDetails = null;
    if (missionData.assigned_by && userMap.has(Number(missionData.assigned_by))) {
      const u = userMap.get(Number(missionData.assigned_by));
      assignedUserDetails = {
        id: u.id,
        name: u.name,
        email: u.email,
        type: u.type,
        role: u.role,
        image: u.image || null,
        contact_no: u.contact_no || null,
        city: u.city || null,
        state: u.state || null,
        country: u.country || null,
        status: u.status
      };
    }

    const formattedMission = {
      ...missionData,
      start_time: formatDateTime(missionData.start_time),
      end_time: formatDateTime(missionData.end_time),
      assigned_by: missionData.assigned_by !== null && missionData.assigned_by !== undefined ? Number(missionData.assigned_by) : null,
      assigned_by_details: assignedUserDetails,
      assigned_by_user: assignedUserDetails
    };

    if (!missionsByGroupId.has(group_id)) {
      missionsByGroupId.set(group_id, []);
    }
    const existingMissions = missionsByGroupId.get(group_id);
    if (!existingMissions.some(m => m.id === formattedMission.id)) {
      existingMissions.push(formattedMission);
    }
  }

  // 6. Attach missions array and count to each group
  const volunteerGroups = groups.map(g => {
    const linkedMissions = missionsByGroupId.get(g.id) || [];
    return {
      ...g,
      missions: linkedMissions,
      missions_count: linkedMissions.length
    };
  });

  return {
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l) || 1,
    volunteer_groups: volunteerGroups
  };
}

async function getVolunteerGroupDetails(groupId) {
  const pool = await connectDB();

  const [groups] = await pool.query(
    `
    SELECT 
      g.id,
      g.name,
      g.email,
      g.type,
      g.role,
      g.contact_no,
      g.description,
      g.city,
      g.state,
      g.country,
      g.status,
      g.image,
      g.created_at,
      g.updated_at,
      COALESCE(SUM(v.points), 0) AS points,
      COUNT(DISTINCT v.id) AS members_count
    FROM users g
    LEFT JOIN users v ON v.invitedBy = g.id AND v.type = 'volunteer'
    WHERE g.id = ? AND g.type = 'volunteer_group'
    GROUP BY g.id
    `,
    [groupId]
  );

  if (groups.length === 0) return null;
  const group = groups[0];

  // Check schema capabilities dynamically
  const hasAssignedBy = await checkMissionAssignedBy(pool);
  const hasVga = await checkVgaTable(pool);

  const whereConditions = [];
  const whereParams = [];

  if (hasAssignedBy) {
    whereConditions.push("m.assigned_by = ?");
    whereParams.push(groupId);
  }

  if (hasVga) {
    whereConditions.push("m.id IN (SELECT mission_id FROM volunteer_group_applications WHERE group_id = ?)");
    whereParams.push(groupId);
  }

  whereConditions.push("m.id IN (SELECT mission_id FROM mission_assigned_volunteers WHERE assigned_by = ?)");
  whereParams.push(groupId);

  whereConditions.push("m.id IN (SELECT mav.mission_id FROM mission_assigned_volunteers mav JOIN users u ON u.id = mav.volunteer_id WHERE u.invitedBy = ?)");
  whereParams.push(groupId);

  const whereClause = whereConditions.join(" OR ");
  const missionAssignedByExpr = hasAssignedBy ? "m.assigned_by" : "(SELECT mav.assigned_by FROM mission_assigned_volunteers mav WHERE mav.mission_id = m.id AND mav.assigned_by = ? LIMIT 1)";
  const selectParams = hasAssignedBy ? [] : [groupId];

  // Fetch linked missions
  const [missionLinks] = await pool.query(
    `
    SELECT DISTINCT
      m.id,
      m.name,
      m.description,
      m.lat,
      m.lng,
      m.start_time,
      m.end_time,
      m.file,
      m.relevant_distance,
      m.work_type,
      m.organization_id,
      m.can_post,
      m.posted_by,
      m.mission_type,
      m.volunteer_required,
      m.prefered_volunteer,
      m.points,
      m.allow_interaction,
      m.images,
      m.status,
    ${missionAssignedByExpr} AS assigned_by,
      m.created_at,
      m.updated_at,
      o.company_name,
      o.type AS company_type
    FROM missions m
    LEFT JOIN organizations o ON (o.id = m.organization_id OR o.user_id = m.organization_id)
    WHERE ${whereClause}
    ORDER BY m.created_at DESC
    `,
    // [groupId, groupId, groupId, groupId]
    [...selectParams, ...whereParams]
  );

  const assignedByIds = [...new Set(missionLinks.map(m => m.assigned_by).filter(id => id !== null && id !== undefined && id !== ''))];
  const userMap = new Map();

  if (assignedByIds.length > 0) {
    const [assignedUsers] = await pool.query(
      `
      SELECT id, name, email, type, role, contact_no, description, city, state, country, status, image
      FROM users
      WHERE id IN (?)
      `,
      [assignedByIds]
    );
    for (const u of assignedUsers) {
      userMap.set(u.id, u);
    }
  }

  const linkedMissions = missionLinks.map(missionData => {
    let assignedUserDetails = null;
    if (missionData.assigned_by && userMap.has(Number(missionData.assigned_by))) {
      const u = userMap.get(Number(missionData.assigned_by));
      assignedUserDetails = {
        id: u.id,
        name: u.name,
        email: u.email,
        type: u.type,
        role: u.role,
        image: u.image || null,
        contact_no: u.contact_no || null,
        city: u.city || null,
        state: u.state || null,
        country: u.country || null,
        status: u.status
      };
    }

    return {
      ...missionData,
      start_time: formatDateTime(missionData.start_time),
      end_time: formatDateTime(missionData.end_time),
      assigned_by: missionData.assigned_by !== null && missionData.assigned_by !== undefined ? Number(missionData.assigned_by) : null,
      assigned_by_details: assignedUserDetails,
      assigned_by_user: assignedUserDetails
    };
  });

  return {
    ...group,
    missions: linkedMissions,
    missions_count: linkedMissions.length
  };
}


module.exports = { getDashboardStats, listUsers, approvedUsers, listOrganizations,getDashboardSummary,listVolunteerGroups,getVolunteerGroupDetails };