const connectDB = require('../config/db');
const { toLocalISOString, isFutureTime, getCurrentLocalTimeString, formatForMySQL } = require("../utils/datetime");

exports.findByNameAndOrg = async (name, organizationId) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    "SELECT * FROM missions WHERE name = ? AND organization_id = ?",
    [name, organizationId]
  );
  return rows;
};

exports.insertMission = async (missionData) => {
  const pool = await connectDB();
  const startTime = formatForMySQL(missionData.start_time);
  const endTime = formatForMySQL(missionData.end_time);
  const currentLocalTime = getCurrentLocalTimeString();

  const [result] = await pool.query(
    `INSERT INTO missions 
     (name, description, lat, lng, start_time, end_time, file, relevant_distance, work_type, organization_id, status,
     mission_type, volunteer_required, prefered_volunteer, points, allow_interaction, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      missionData.name,
      missionData.description || null,
      missionData.lat,
      missionData.lng,
      startTime,
      endTime,
      missionData.file || null,
      missionData.relevant_distance || null,
      missionData.work_type || null,
      missionData.organization_id,
      "open",
      missionData.mission_type || null,
      missionData.volunteer_required || null,
      JSON.stringify(missionData.prefered_volunteer || []),
      missionData.points || 0,
      JSON.stringify(missionData.allow_interaction || { comments: false, likes: false, share: false }),
      currentLocalTime
    ]
  );
  return result.insertId;
};

exports.findByNameAndOrg = async (name, organizationId) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    "SELECT * FROM missions WHERE name = ? AND organization_id = ?",
    [name, organizationId]
  );
  return rows;
};

exports.findById = async (missionId) => {
  try {
    const pool = await connectDB();

    // Fetch mission with organization info
    const [[mission]] = await pool.query(
      `
      SELECT 
        m.*,
        o.company_name AS company_name,
        o.type AS company_type,
        o.services AS services,
        (
          SELECT COUNT(*) 
          FROM mission_assigned_volunteers mav 
          LEFT JOIN volunteer_group_applications vga 
            ON vga.mission_id = mav.mission_id 
            AND vga.group_id = mav.assigned_by
          WHERE mav.mission_id = m.id 
            AND (mav.assigned_by IS NULL OR vga.status = 'accepted')
        ) AS assigned_count,
        (
          SELECT COUNT(*) 
          FROM mission_pending_requests mpr 
          WHERE mpr.mission_id = m.id
        ) AS applied_count
      FROM missions m
      LEFT JOIN organizations o ON o.user_id = m.organization_id
      WHERE m.id = ?
      `,
      [missionId]
    );

    if (!mission) return null;

    // Preserve raw database date/time values for accurate comparisons
    mission.raw_start_time = mission.start_time;
    mission.raw_end_time = mission.end_time;

    // Format date/time fields safely
    mission.start_time = mission.start_time ? toLocalISOString(mission.start_time) : null;
    mission.end_time = mission.end_time ? toLocalISOString(mission.end_time) : null;

    // Auto-transition scheduled mission to 'process' if scheduled start time has arrived
    if (mission.status === 'scheduled' && !isFutureTime(mission.start_time || mission.raw_start_time)) {
      mission.status = 'process';
      await pool.query("UPDATE missions SET status = 'process', notify = 1, notify_status = 1 WHERE id = ?", [mission.id]);
    }

    // Auto-expire mission if end time has passed
    if (['open', 'scheduled', 'process'].includes(mission.status) && mission.end_time && !isFutureTime(mission.end_time || mission.raw_end_time)) {
      mission.status = 'expired';
      await pool.query("UPDATE missions SET status = 'expired' WHERE id = ?", [mission.id]);
    }

    // Fetch assigned volunteers
    const [assignedVolunteers] = await pool.query(
      `
      SELECT 
        v.id, v.name, v.email, v.image, v.points,
        mav.status AS assigned_status, mav.assigned_by
      FROM mission_assigned_volunteers mav
      JOIN users v ON v.id = mav.volunteer_id
      LEFT JOIN volunteer_group_applications vga 
        ON vga.mission_id = mav.mission_id 
        AND vga.group_id = mav.assigned_by
      WHERE mav.mission_id = ? 
        AND (mav.assigned_by IS NULL OR vga.status = 'accepted')
      `,
      [missionId]
    );

    // Fetch applied (pending) volunteers
    const [appliedVolunteers] = await pool.query(
      `
      SELECT 
        v.id, v.name, v.email, v.image, v.points
      FROM mission_pending_requests mpr
      JOIN users v ON v.id = mpr.volunteer_id
      WHERE mpr.mission_id = ?
      `,
      [missionId]
    );

    // Attach volunteer lists
    mission.assigned_volunteers = assignedVolunteers || [];
    mission.applied_volunteers = appliedVolunteers || [];

    // Fetch group applications
    const [groupApplications] = await pool.query(
      `
      SELECT group_id, status FROM volunteer_group_applications WHERE mission_id = ?
      `,
      [missionId]
    );
    mission.group_applications = groupApplications || [];

    return mission;
  } catch (error) {
    console.error("Error in findById:", error.message);
    throw new Error("Server error while fetching mission by ID");
  }
};

// exports.findById = async (missionId) => {
//   try {
//     const pool = await connectDB();

//     // Fetch mission with organization info
//     const [[mission]] = await pool.query(
//       `
//       SELECT 
//         m.*,
//         o.company_name AS company_name,
//         o.type AS company_type,
//         o.services AS services,
//         (
//           SELECT COUNT(*) 
//           FROM mission_assigned_volunteers mav 
//           WHERE mav.mission_id = m.id AND mav.status != 'group_pending'
//         ) AS assigned_count,
//         (
//           SELECT COUNT(*) 
//           FROM mission_pending_requests mpr 
//           WHERE mpr.mission_id = m.id
//         ) AS applied_count
//       FROM missions m
//       LEFT JOIN organizations o ON o.id = m.organization_id
//       WHERE m.id = ?
//       `,
//       [missionId]
//     );

//     if (!mission) return null;

//     // Format date/time fields safely
//     mission.start_time = mission.start_time ? toLocalISOString(mission.start_time) : null;
//     mission.end_time = mission.end_time ? toLocalISOString(mission.end_time) : null;

//     // Fetch assigned volunteers
//     const [assignedVolunteers] = await pool.query(
//       `
//       SELECT 
//         v.id, v.name, v.email, v.image, v.points,
//         mav.status AS assigned_status, mav.assigned_by
//       FROM mission_assigned_volunteers mav
//       JOIN users v ON v.id = mav.volunteer_id
//       WHERE mav.mission_id = ? AND mav.status != 'group_pending'
//       `,
//       [missionId]
//     );

//     // Fetch applied (pending) volunteers
//     const [appliedVolunteers] = await pool.query(
//       `
//       SELECT 
//         v.id, v.name, v.email, v.image, v.points
//       FROM mission_pending_requests mpr
//       JOIN users v ON v.id = mpr.volunteer_id
//       WHERE mpr.mission_id = ?
//       `,
//       [missionId]
//     );

//     // Attach volunteer lists
//     mission.assigned_volunteers = assignedVolunteers || [];
//     mission.applied_volunteers = appliedVolunteers || [];

//     return mission;
//   } catch (error) {
//     console.error("Error in findById:", error.message);
//     throw new Error("Server error while fetching mission by ID");
//   }
// };

exports.fetchAllFeeds = async (limit, offset, currentUserId) => {
  const pool = await connectDB();

  // Get total count of missions
  const [[{ total }]] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM missions AS m
      LEFT JOIN organizations AS o ON o.id = m.organization_id
      WHERE m.status = 'completed'
        AND m.can_post = true
    `
  );

  // Get mission data with organization, likes info, comments count
  const [feeds] = await pool.query(
    `
      SELECT 
        m.*,
        o.company_name,
        u.name AS author_name,
        CASE WHEN ml.id IS NOT NULL THEN TRUE ELSE FALSE END AS liked,
        IFNULL(lc.total_likes, 0) AS total_likes,
        IFNULL(cc.total_comments, 0) AS total_comments,
        cc.latest_comment_at
      FROM missions AS m
      LEFT JOIN organizations AS o ON o.id = m.organization_id
      LEFT JOIN users AS u ON u.id = m.posted_by
      LEFT JOIN mission_likes AS ml 
        ON ml.mission_id = m.id AND ml.user_id = ?
      LEFT JOIN (
        SELECT mission_id, COUNT(*) AS total_likes
        FROM mission_likes
        GROUP BY mission_id
      ) AS lc
        ON lc.mission_id = m.id
      LEFT JOIN (
        SELECT mission_id, COUNT(*) AS total_comments,MAX(created_at) AS latest_comment_at
        FROM mission_comments
        GROUP BY mission_id
      ) AS cc ON cc.mission_id = m.id        
      WHERE m.status = 'completed'
        AND m.can_post = true
      ORDER BY m.id DESC
      LIMIT ? OFFSET ?
    `,
    [currentUserId, limit, offset]
  );

  // Get all comments for these missions
  const missionIds = feeds.map(f => f.id);
  let commentsMap = {};
  if (missionIds.length > 0) {
    const [comments] = await pool.query(
      `
        SELECT 
          mc.id, 
          mc.mission_id, 
          mc.user_id, 
          mc.comment, 
          mc.is_disabled,
          mc.created_at, 
          u.name AS user_name,
          m.posted_by AS posted_by
        FROM mission_comments AS mc
        JOIN users AS u ON mc.user_id = u.id
        JOIN missions AS m ON m.id = mc.mission_id
        WHERE mc.mission_id IN (?)
        ORDER BY mc.created_at DESC
      `,
      [missionIds]
    );

    // Group comments by mission_id
    commentsMap = comments.reduce((acc, c) => {

      if (c.is_disabled === 1 && c.posted_by !== currentUserId) {
        return acc;
      }

      if (!acc[c.mission_id]) acc[c.mission_id] = [];
      acc[c.mission_id].push({
        id: c.id,
        user_id: c.user_id,
        user_name: c.user_name,
        comment: c.comment,
        is_disabled: c.is_disabled,
        created_at: toLocalISOString(c.created_at)
      });
      return acc;
    }, {});
  }

  // Attach comments to each mission
  // const feedsWithComments = feeds.map(f => ({
  //   ...f,
  //   comments: commentsMap[f.id] || []
  // }));

  // Attach comments to each mission AND format latest_comment_at
  const feedsWithComments = feeds.map(f => ({
    ...f,
    comments: commentsMap[f.id] || [],
    latest_comment_at: f.latest_comment_at
      ? toLocalISOString(f.latest_comment_at)
      : null
  }));


  return { feeds: feedsWithComments, total };
};



// exports.fetchAllFeeds = async (limit, offset, currentUserId) => {
//   const pool = await connectDB();

//   // Get total count of missions
//   const [[{ total }]] = await pool.query(
//     `
//       SELECT COUNT(*) AS total
//       FROM missions AS m
//       LEFT JOIN organizations AS o ON o.id = m.organization_id
//       WHERE m.status = 'completed'
//         AND m.can_post = true
//     `
//   );

//   // Get mission data with organization, likes info, comments count
//   const [feeds] = await pool.query(
//     `
//       SELECT 
//         m.*,
//         o.company_name,
//         u.name AS author_name,
//         CASE WHEN ml.id IS NOT NULL THEN TRUE ELSE FALSE END AS liked,
//         IFNULL(lc.total_likes, 0) AS total_likes,
//         IFNULL(cc.total_comments, 0) AS total_comments
//       FROM missions AS m
//       LEFT JOIN organizations AS o ON o.id = m.organization_id
//       LEFT JOIN users AS u ON u.id = m.posted_by
//       LEFT JOIN mission_likes AS ml 
//         ON ml.mission_id = m.id AND ml.user_id = ?
//       LEFT JOIN (
//         SELECT mission_id, COUNT(*) AS total_likes
//         FROM mission_likes
//         GROUP BY mission_id
//       ) AS lc
//         ON lc.mission_id = m.id
//       LEFT JOIN (
//         SELECT mission_id, COUNT(*) AS total_comments
//         FROM mission_comments
//         GROUP BY mission_id
//       ) AS cc ON cc.mission_id = m.id        
//       WHERE m.status = 'completed'
//         AND m.can_post = true
//       ORDER BY m.id DESC
//       LIMIT ? OFFSET ?
//     `,
//     [currentUserId, limit, offset]
//   );

//   // Get all comments for these missions
//   const missionIds = feeds.map(f => f.id);
//   let commentsMap = {};
//   if (missionIds.length > 0) {
//     const [comments] = await pool.query(
//       `
//         SELECT mc.id, mc.mission_id, mc.user_id, mc.comment, mc.created_at, u.name AS user_name
//         FROM mission_comments AS mc
//         JOIN users AS u ON mc.user_id = u.id
//         WHERE mc.mission_id IN (?)
//         ORDER BY mc.created_at DESC
//       `,
//       [missionIds]
//     );

//     // Group comments by mission_id
//     commentsMap = comments.reduce((acc, c) => {
//       if (!acc[c.mission_id]) acc[c.mission_id] = [];
//       acc[c.mission_id].push({
//         id: c.id,
//         user_id: c.user_id,
//         user_name: c.user_name,
//         comment: c.comment,
//         created_at: c.created_at
//       });
//       return acc;
//     }, {});
//   }

//   // Attach comments to each mission
//   const feedsWithComments = feeds.map(f => ({
//     ...f,
//     comments: commentsMap[f.id] || []
//   }));

//   return { feeds: feedsWithComments, total };
// };


exports.updateComment = async (commentId, userId, newComment) => {
  const pool = await connectDB();
  const [result] = await pool.query(
    "UPDATE mission_comments SET comment = ? WHERE id = ? AND user_id = ?",
    [newComment, commentId, userId]
  );
  return result.affectedRows > 0;
};

exports.toggleCommentStatus = async (commentId, userId) => {
  const pool = await connectDB();

  const [[comment]] = await pool.query(
    "SELECT id, user_id, is_disabled FROM mission_comments WHERE id = ?",
    [commentId]
  );

  if (!comment) {
    return { success: false, message: "Comment not found" };
  }

  const newStatus = comment.is_disabled ? 0 : 1;

  await pool.query(
    "UPDATE mission_comments SET is_disabled = ? WHERE id = ?",
    [newStatus, commentId]
  );

  return {
    success: true,
    isDisabled: newStatus === 1
  };
};

exports.deleteComment = async (commentId, userId) => {
  const pool = await connectDB();

  // Check if the user is the comment author
  const [commentRows] = await pool.query("SELECT mission_id, user_id FROM mission_comments WHERE id = ?", [commentId]);
  if (commentRows.length === 0) return false;

  const comment = commentRows[0];
  if (comment.user_id == userId) {
    const [result] = await pool.query("DELETE FROM mission_comments WHERE id = ?", [commentId]);
    return result.affectedRows > 0;
  }

  // Check if the user is the mission owner (posted_by)
  const [missionRows] = await pool.query("SELECT posted_by FROM missions WHERE id = ?", [comment.mission_id]);
  if (missionRows.length > 0 && missionRows[0].posted_by == userId) {
    const [result] = await pool.query("DELETE FROM mission_comments WHERE id = ?", [commentId]);
    return result.affectedRows > 0;
  }

  return false;
};


// exports.deleteComment = async (commentId, userId) => {
//   const pool = await connectDB();
//   const [result] = await pool.query(
//     "DELETE FROM mission_comments WHERE id = ? AND user_id = ?",
//     [commentId, userId]
//   );
//   return result.affectedRows > 0;
// };

// exports.fetchAllFeeds = async (limit, offset, currentUserId) => {
//   const pool = await connectDB();

//   // Get total count of missions
//   const [[{ total }]] = await pool.query(
//     `
//       SELECT COUNT(*) AS total
//       FROM missions AS m
//       LEFT JOIN organizations AS o ON o.id = m.organization_id
//       WHERE m.status = 'completed'
//         AND m.can_post = true
//     `
//   );

//   // Get mission data with organization, likes info
//   const [feeds] = await pool.query(
//     `
//       SELECT 
//         m.*,
//         o.company_name,
//         u.name AS author_name,
//         CASE WHEN ml.id IS NOT NULL THEN TRUE ELSE FALSE END AS liked,
//         IFNULL(lc.total_likes, 0) AS total_likes,
//         IFNULL(cc.total_comments, 0) AS total_comments
//       FROM missions AS m
//       LEFT JOIN organizations AS o ON o.id = m.organization_id
//       LEFT JOIN users AS u ON u.id = m.posted_by
//       LEFT JOIN mission_likes AS ml 
//         ON ml.mission_id = m.id AND ml.user_id = ?
//       LEFT JOIN (
//         SELECT mission_id, COUNT(*) AS total_likes
//         FROM mission_likes
//         GROUP BY mission_id
//       ) AS lc
//         ON lc.mission_id = m.id
//       LEFT JOIN (
//         SELECT mission_id, COUNT(*) AS total_comments
//         FROM mission_comments
//         GROUP BY mission_id
//       ) AS cc ON cc.mission_id = m.id        
//       WHERE m.status = 'completed'
//         AND m.can_post = true
//       ORDER BY m.id DESC
//       LIMIT ? OFFSET ?
//     `,
//     [currentUserId, limit, offset]
//   );

//   return { feeds, total };
// };


// exports.fetchAllFeeds = async (limit, offset, currentUserId) => {
//   const pool = await connectDB();

//   // Get total count of missions
//   const [[{ total }]] = await pool.query(
//     `
//       SELECT COUNT(*) AS total
//       FROM missions AS m
//       LEFT JOIN organizations AS o ON o.id = m.organization_id
//       WHERE m.status = 'completed'
//         AND m.can_post = true
//     `
//   );

//   // Get mission data with organization, likes info
//   const [feeds] = await pool.query(
//     `
//       SELECT 
//         m.*,
//         o.company_name,
//         u.name AS author_name,
//         CASE WHEN ml.id IS NOT NULL THEN TRUE ELSE FALSE END AS liked,
//         IFNULL(lc.total_likes, 0) AS total_likes
//       FROM missions AS m
//       LEFT JOIN organizations AS o ON o.id = m.organization_id
//       LEFT JOIN users AS u ON u.id = m.posted_by
//       LEFT JOIN mission_likes AS ml 
//         ON ml.mission_id = m.id AND ml.user_id = ?
//       LEFT JOIN (
//         SELECT mission_id, COUNT(*) AS total_likes
//         FROM mission_likes
//         GROUP BY mission_id
//       ) AS lc
//         ON lc.mission_id = m.id
//       WHERE m.status = 'completed'
//         AND m.can_post = true
//       ORDER BY m.id DESC
//       LIMIT ? OFFSET ?
//     `,
//     [currentUserId, limit, offset]
//   );

//   return { feeds, total };
// };


// exports.fetchAllFeeds = async (limit, offset) => {
//   const pool = await connectDB();

//   // Get total count
//   const [[{ total }]] = await pool.query(
//     `
//       SELECT COUNT(*) AS total
//       FROM missions AS m
//       LEFT JOIN organizations AS o ON o.id = m.organization_id
//       WHERE m.status = 'completed'
//         AND m.can_post = true
//     `
//   );

//   // Get mission data with organization company_name
//   const [feeds] = await pool.query(
//     `
//       SELECT 
//         m.*, 
//         o.company_name
//       FROM missions AS m
//       LEFT JOIN organizations AS o ON o.id = m.organization_id
//       WHERE m.status = 'completed'
//         AND m.can_post = true
//       ORDER BY m.id DESC
//       LIMIT ? OFFSET ?
//     `,
//     [limit, offset]
//   );

//   return { feeds, total };
// };


// exports.fetchAllFeeds = async (limit, offset) => {
//   const pool = await connectDB();

//   const [[{ total }]] = await pool.query(
//     `
//       SELECT COUNT(*) AS total 
//       FROM missions
//       WHERE status = 'completed'
//         AND can_post = true
//     `
//   );

//   const [missions] = await pool.query(
//     `
//     SELECT *
//     FROM missions
//     WHERE LOWER(status) = 'completed'
//       AND LOWER(can_post) = true
//     LIMIT ? OFFSET ?
//     `,
//     [limit, offset]
//   );

//   return { missions, total };
// };

// exports.findById = async (missionId) => {
//   try {
//     const pool = await connectDB();

//     // Get mission
//     const [[mission]] = await pool.query(
//       `
//       SELECT 
//         m.*,
//         (
//           SELECT COUNT(*) 
//           FROM mission_assigned_volunteers mav 
//           WHERE mav.mission_id = m.id
//         ) AS assigned_count,
//         (
//           SELECT COUNT(*) 
//           FROM mission_pending_requests mpr 
//           WHERE mpr.mission_id = m.id
//         ) AS applied_count
//       FROM missions m
//       WHERE m.id = ?
//       `,
//       [missionId]
//     );

//     if (!mission) return null;

//     // Format time fields
//     mission.start_time = toLocalISOString(mission.start_time);
//     mission.end_time = toLocalISOString(mission.end_time);

//     // Fetch assigned volunteers
//     const [assignedVolunteers] = await pool.query(
//       `
//       SELECT 
//         v.id, v.name, v.email, v.image, v.points
//       FROM mission_assigned_volunteers mav
//       JOIN users v ON v.id = mav.volunteer_id
//       WHERE mav.mission_id = ?
//       `,
//       [missionId]
//     );

//     // Fetch applied (pending) volunteers
//     const [appliedVolunteers] = await pool.query(
//       `
//       SELECT 
//         v.id, v.name, v.email, v.image, v.points
//       FROM mission_pending_requests mpr
//       JOIN users v ON v.id = mpr.volunteer_id
//       WHERE mpr.mission_id = ?
//       `,
//       [missionId]
//     );

//     // Attach to mission
//     mission.assigned_volunteers = assignedVolunteers;
//     mission.applied_volunteers = appliedVolunteers;

//     return mission;
//   } catch (error) {
//     console.error("Error in findById:", error.message);
//     throw new Error("Server error while fetching mission by ID");
//   }
// };


// exports.findById = async (missionId) => {
//   try {
//     const pool = await connectDB();

//     const [[mission]] = await pool.query(
//       "SELECT * FROM missions WHERE id = ?",
//       [missionId]
//     );

//     if (!mission) return null;

//     mission.start_time = toLocalISOString(mission.start_time);
//     mission.end_time = toLocalISOString(mission.end_time);

//     return mission;
//   } catch (error) {
//     console.error("Error in findById:", error.message);
//     throw new Error("Server error while fetching mission by ID");
//   }
// };

///// before format
// exports.findById = async (missionId) => {
//   // console.log("Mission ID passed to findById:", missionId);

//   const pool = await connectDB();
//   const [[mission]] = await pool.query(
//     "SELECT * FROM missions WHERE id = ?",
//     [missionId]
//   );
//   // console.log("Found mission:", mission);
//   return mission;
// };


exports.missionStart = async (missionId) => {
  const pool = await connectDB();

  const [[mission]] = await pool.query(
    `
    SELECT id, name, start_time, status 
    FROM missions 
    WHERE id = ?
    `,
    [missionId]
  );

  return mission || null;
};

exports.missionCompleted = async (missionId) => {

  const pool = await connectDB();
  const [[mission]] = await pool.query(
    "SELECT * FROM missions WHERE id = ? AND status = 'completed' ",
    [missionId]
  );

  return mission;
};

// Assign volunteer


exports.assignVolunteer = async (missionId, volunteerId, assignedBy = null, status = 'pending') => {
  const pool = await connectDB();

  // Fallback assignedBy to volunteer's invitedBy group ID if not provided
  if (!assignedBy) {
    const [[userRow]] = await pool.query("SELECT invitedBy, invitedby FROM users WHERE id = ?", [volunteerId]);
    if (userRow) {
      assignedBy = userRow.invitedBy || userRow.invitedby || null;
    }
  }

  const [[{ count }]] = await pool.query(
    "SELECT COUNT(*) AS count FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?",
    [missionId, volunteerId]
  );

  if (count > 0) {
    await pool.query(
      `UPDATE mission_assigned_volunteers 
       SET assigned_by = COALESCE(?, assigned_by), status = ? 
       WHERE mission_id = ? AND volunteer_id = ?`,
      [assignedBy, status, missionId, volunteerId]
    );
  } else {
    await pool.query(
      `INSERT INTO mission_assigned_volunteers (mission_id, volunteer_id, assigned_by, status) 
       VALUES (?, ?, ?, ?)`,
      [missionId, volunteerId, assignedBy, status]
    );
  }
};

// Previous 22 july
// exports.assignVolunteer = async (missionId, volunteerId, assignedBy = null, status = 'pending') => {
//   const pool = await connectDB();
//   await pool.query(
//     `INSERT INTO mission_assigned_volunteers (mission_id, volunteer_id, assigned_by, status) 
//      VALUES (?, ?, ?, ?) 
//      ON DUPLICATE KEY UPDATE assigned_by = VALUES(assigned_by), status = VALUES(status)`,
//     [missionId, volunteerId, assignedBy, status]
//   );
// };


exports.addComment = async (missionId, userId, comment) => {
  const pool = await connectDB();
  const [result] = await pool.query('INSERT INTO mission_comments (mission_id, user_id, comment) VALUES (?, ?, ?) ', [missionId, userId, comment]);
  return result.insertId;
}


exports.getComments = async (missionId, loggedInUserId) => {
  const pool = await connectDB();

  // Check mission owner
  const [[mission]] = await pool.query(
    "SELECT posted_by FROM missions WHERE id = ?",
    [missionId]
  );

  if (!mission) return [];

  const isOwner = mission.posted_by === loggedInUserId;

  let query = `
    SELECT 
      c.id,
      c.comment,
      c.is_disabled,
      c.created_at,
      u.id AS user_id,
      u.name,
      u.image
    FROM mission_comments c
    LEFT JOIN users u ON u.id = c.user_id
    WHERE c.mission_id = ?
  `;

  const params = [missionId];

  // If NOT owner, hide disabled comments
  if (!isOwner) {
    query += " AND c.is_disabled = 0";
  }

  query += " ORDER BY c.id DESC";

  const [comments] = await pool.query(query, params);
  return comments;
};


exports.getMissionsByUser = async (
  user,
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "DESC"
) => {
  const pool = await connectDB();

  const currentLocalTime = getCurrentLocalTimeString();

  // ✅ Auto-start scheduled missions whose start time has arrived
  await pool.query(`
    UPDATE missions
    SET status = 'process', notify = 1, notify_status = 1
    WHERE status = 'scheduled'
      AND start_time <= ?
  `, [currentLocalTime]);

  // ✅ Expire old missions
  await pool.query(`
    UPDATE missions
    SET status = 'expired'
    WHERE end_time <= ?
      AND status IN ('open', 'scheduled', 'process')
  `, [currentLocalTime]);

  // ✅ SAFE user type handling
  const userType = user?.type || null;
  const userId = user?.id || null;

  /* ===============================
   * Organization filter
   * =============================== */
  let orgQuery = `SELECT id FROM organizations`;
  const orgParams = [];

  if (userType === "organization" && userId) {
    orgQuery += ` WHERE user_id = ?`;
    orgParams.push(userId);
  }

  const [organizations] = await pool.query(orgQuery, orgParams);

  if (!organizations.length) {
    return {
      page,
      totalPages: 0,
      totalMissions: 0,
      missions: [],
    };
  }

  /* ===============================
   * Safe sortable columns
   * =============================== */
  const SORTABLE_COLUMNS = {
    id: "m.id",
    name: "m.name",
    created_at: "m.created_at",
    status: "m.status",
    mission_type: "m.mission_type",
  };

  const sortColumn = SORTABLE_COLUMNS[sortBy] || "m.created_at";
  const direction = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const allMissions = [];

  for (const org of organizations) {
    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM missions
      WHERE organization_id = ?
        AND status != 'expired'
      `,
      [org.id]
    );

    const offset = (page - 1) * limit;

    const [missions] = await pool.query(
      `
      SELECT 
        m.*,
        o.company_name,
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
      FROM missions m
      JOIN organizations o ON o.id = m.organization_id
      WHERE m.organization_id = ?
        AND m.status != 'expired'
      ORDER BY ${sortColumn} ${direction}
      LIMIT ? OFFSET ?
      `,
      [org.id, limit, offset]
    );

    const missionData = await Promise.all(
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
          id: mission.id,
          name: mission.name,
          description: mission.description,
          start_time: toLocalISOString(mission.start_time),
          end_time: toLocalISOString(mission.end_time),
          file: mission.file,
          mission_type: mission.mission_type,
          volunteer_required: mission.volunteer_required,
          prefered_volunteer: mission.prefered_volunteer,
          points: mission.points,
          allow_interaction: mission.allow_interaction,
          status: mission.status,
          organization: {
            id: org.id,
            company_name: mission.company_name,
          },
          applied_count: mission.applied_count || 0,
          assigned_count: mission.assigned_count || 0,
          assigned_volunteers: assignedVolunteers,
          applied_volunteers: appliedVolunteers,
        };
      })
    );

    allMissions.push({
      organizationId: org.id,
      totalMissions: total,
      missions: missionData,
    });
  }

  const missionsFlat = allMissions.flatMap((o) => o.missions);
  const totalMissions = allMissions.reduce(
    (sum, o) => sum + o.totalMissions,
    0
  );

  return {
    page,
    totalPages: Math.ceil(totalMissions / limit),
    totalMissions,
    missions: missionsFlat,
  };
};




// exports.getMissionsByUser = async (user, page = 1, limit = 10) => {
//   const pool = await connectDB();

//   // Expire old missions
//   await pool.query(`
//     UPDATE missions
//     SET status = 'expired'
//     WHERE end_time <= NOW()
//       AND status = 'pending'
//   `);

//   // Organization filter
//   let orgQuery = 'SELECT * FROM organizations';
//   const orgParams = [];

//   if (user.type === 'organization') {
//     orgQuery += ' WHERE user_id = ?';
//     orgParams.push(user.id);
//   }

//   const [organizations] = await pool.query(orgQuery, orgParams);

//   const allMissions = [];

//   for (const org of organizations) {
//     const [[{ total }]] = await pool.query(
//       `SELECT COUNT(*) AS total FROM missions WHERE organization_id = ? AND status != 'expired'`,
//       [org.id]
//     );

//     const totalMissions = total;
//     const totalPages = Math.ceil(totalMissions / limit);
//     const offset = (page - 1) * limit;

//     const [missions] = await pool.query(
//       `
//       SELECT 
//         m.*,
//         o.company_name,
//         (
//           SELECT COUNT(*) 
//           FROM mission_assigned_volunteers mav 
//           WHERE mav.mission_id = m.id
//         ) AS assigned_count,
//         (
//           SELECT COUNT(*) 
//           FROM mission_pending_requests mpr 
//           WHERE mpr.mission_id = m.id
//         ) AS applied_count
//       FROM missions m
//       JOIN organizations o ON m.organization_id = o.id
//       WHERE m.organization_id = ?
//         AND m.status != 'expired'
//       ORDER BY m.created_at DESC
//       LIMIT ? OFFSET ?
//       `,
//       [org.id, limit, offset]
//     );

//     const missionData = await Promise.all(
//       missions.map(async (mission) => {
//         const [assignedVolunteers] = await pool.query(
//           `
//           SELECT v.id, v.name, v.email, v.image, v.points
//           FROM mission_assigned_volunteers mav
//           JOIN users v ON v.id = mav.volunteer_id
//           WHERE mav.mission_id = ?
//           `,
//           [mission.id]
//         );

//         const [appliedVolunteers] = await pool.query(
//           `
//           SELECT v.id, v.name, v.email, v.image, v.points
//           FROM mission_pending_requests mpr
//           JOIN users v ON v.id = mpr.volunteer_id
//           WHERE mpr.mission_id = ?
//           `,
//           [mission.id]
//         );

//         return {
//           id: mission.id,
//           name: mission.name,
//           description: mission.description,
//           start_time: toLocalISOString(mission.start_time),
//           end_time: toLocalISOString(mission.end_time),
//           file: mission.file,
//           mission_type: mission.mission_type,
//           volunteer_required: mission.volunteer_required,
//           prefered_volunteer: mission.prefered_volunteer,
//           points: mission.points,
//           allow_interaction: mission.allow_interaction,
//           status: mission.status,
//           organization: {
//             id: org.id,
//             company_name: mission.company_name,
//           },
//           applied_count: mission.applied_count || 0,
//           assigned_count: mission.assigned_count || 0,
//           assigned_volunteers: assignedVolunteers || [],
//           applied_volunteers: appliedVolunteers || [],
//         };
//       })
//     );

//     allMissions.push({
//       organizationId: org.id,
//       totalMissions,
//       totalPages,
//       page,
//       missions: missionData,
//     });
//   }

//   const missionsFlat = allMissions.flatMap((org) => org.missions);
//   const totalMissions = allMissions.reduce((acc, org) => acc + org.totalMissions, 0);
//   const totalPages = Math.ceil(totalMissions / limit);

//   return {
//     page,
//     totalPages,
//     totalMissions,
//     missions: missionsFlat,
//   };
// };


///////// Before pagination work

// exports.getMissionsByUser = async (user) => {
//   const pool = await connectDB();

//   // Expire old missions
//   await pool.query(`
//     UPDATE missions
//     SET status = 'expired'
//     WHERE end_time <= NOW()
//       AND status = 'pending'
//   `);

//   // Organization filter
//   let orgQuery = 'SELECT * FROM organizations';
//   const orgParams = [];

//   if (user.type === 'organization') {
//     orgQuery += ' WHERE user_id = ?';
//     orgParams.push(user.id);
//   }

//   const [organizations] = await pool.query(orgQuery, orgParams);

//   const results = await Promise.all(
//     organizations.map(async (org) => {
//       const [missions] = await pool.query(
//         `
//         SELECT 
//           m.*,
//           o.company_name,
//           (
//             SELECT COUNT(*) 
//             FROM mission_assigned_volunteers mav 
//             WHERE mav.mission_id = m.id
//           ) AS assigned_count,
//           (
//             SELECT COUNT(*) 
//             FROM mission_pending_requests mpr 
//             WHERE mpr.mission_id = m.id
//           ) AS applied_count
//         FROM missions m
//         JOIN organizations o ON m.organization_id = o.id
//         WHERE m.organization_id = ?
//           AND m.status != 'expired'
//         ORDER BY m.created_at DESC
//         `,
//         [org.id]
//       );

//       // Fetch assigned + applied volunteers for each mission
//       const missionData = await Promise.all(
//         missions.map(async (mission) => {
//           // Assigned volunteers
//           const [assignedVolunteers] = await pool.query(
//             `
//             SELECT 
//               v.id, v.name, v.email, v.image, v.points
//             FROM mission_assigned_volunteers mav
//             JOIN users v ON v.id = mav.volunteer_id
//             WHERE mav.mission_id = ?
//             `,
//             [mission.id]
//           );

//           // Applied volunteers
//           const [appliedVolunteers] = await pool.query(
//             `
//             SELECT 
//               v.id, v.name, v.email, v.image, v.points
//             FROM mission_pending_requests mpr
//             JOIN users v ON v.id = mpr.volunteer_id
//             WHERE mpr.mission_id = ?
//             `,
//             [mission.id]
//           );

//           return {
//             id: mission.id,
//             name: mission.name,
//             description: mission.description,
//             start_time: toLocalISOString(mission.start_time),
//             end_time: toLocalISOString(mission.end_time),
//             file: mission.file,
//             mission_type: mission.mission_type,
//             volunteer_required: mission.volunteer_required,
//             prefered_volunteer: mission.prefered_volunteer,
//             points: mission.points,
//             allow_interaction: mission.allow_interaction,
//             status: mission.status,
//             organization: {
//               id: org.id,
//               company_name: mission.company_name,
//             },
//             applied_count: mission.applied_count || 0,
//             assigned_count: mission.assigned_count || 0,
//             assigned_volunteers: assignedVolunteers || [],
//             applied_volunteers: appliedVolunteers || [],
//           };
//         })
//       );

//       return missionData;
//     })
//   );

//   return results.flat();
// };


// exports.getMissionsByUser = async (user) => {
//   const pool = await connectDB();

//   // Expire old missions
//   await pool.query(`
//     UPDATE missions
//     SET status = 'expired'
//     WHERE end_time <= NOW()
//       AND status = 'pending'
//   `);

//   // Filter organizations
//   let orgQuery = "SELECT * FROM organizations";
//   const orgParams = [];

//   if (user.type === "organization") {
//     orgQuery += " WHERE user_id = ?";
//     orgParams.push(user.id);
//   }

//   const [organizations] = await pool.query(orgQuery, orgParams);

//   // Get missions for each organization
//   const results = await Promise.all(
//     organizations.map(async (org) => {
//       const [missions] = await pool.query(
//         `
//         SELECT 
//           m.*, o.company_name,
//           u.id AS volunteer_id, 
//           u.name AS volunteer_name, 
//           u.email AS volunteer_email
//         FROM missions m
//         JOIN organizations o ON m.organization_id = o.id
//         LEFT JOIN mission_assigned_volunteers mv ON mv.mission_id = m.id
//         LEFT JOIN users u ON u.id = mv.volunteer_id AND u.type = 'volunteer'
//         WHERE m.organization_id = ?
//           AND m.status != 'expired'
//         ORDER BY m.id DESC
//         `,
//         [org.id]
//       );

//       const missionMap = {};

//       missions.forEach((row) => {
//         const missionId = row.id;

//         if (!missionMap[missionId]) {
//           missionMap[missionId] = {
//             id: row.id,
//             name: row.name,
//             description: row.description,
//             start_time: toLocalISOString(row.start_time),
//             end_time: toLocalISOString(row.end_time),
//             file: row.file,
//             mission_type: row.mission_type,
//             volunteer_required: row.volunteer_required,
//             prefered_volunteer: row.prefered_volunteer,
//             points: row.points,
//             allow_interaction: row.allow_interaction,
//             status: row.status,
//             created_at: toLocalISOString(row.created_at),
//             organization: {
//               id: org.id,
//               company_name: row.company_name,
//             },
//             assignedvolunteers: [],
//           };
//         }

//         if (row.volunteer_id) {
//           missionMap[missionId].assignedvolunteers.push({
//             id: row.volunteer_id,
//             name: row.volunteer_name,
//             email: row.volunteer_email,
//           });
//         }
//       });

//       return Object.values(missionMap);
//     })
//   );

//   // Flatten and sort globally by ID DESC (or created_at if you prefer)
//   const allMissions = results.flat().sort((a, b) => b.id - a.id);

//   return allMissions;
// };

// exports.getMissionsByUser = async (user) => {
//   const pool = await connectDB();

//   // Expire old missions
//   await pool.query(`
//     UPDATE missions
//     SET status = 'expired'
//     WHERE end_time <= NOW()
//       AND status = 'pending'
//   `);

//   // Organization filter
//   let orgQuery = 'SELECT * FROM organizations';
//   const orgParams = [];

//   if (user.type === 'organization') {
//     orgQuery += ' WHERE user_id = ?';
//     orgParams.push(user.id);
//   }

//   const [organizations] = await pool.query(orgQuery, orgParams);

//   // Fetch missions for each organization
//   const results = await Promise.all(
//     organizations.map(async (org) => {
//       const [missions] = await pool.query(
//         `
//         SELECT 
//           m.*, o.company_name,
//           u.id AS volunteer_id, u.name AS volunteer_name, u.email AS volunteer_email
//         FROM missions m
//         JOIN organizations o ON m.organization_id = o.id
//         LEFT JOIN mission_assigned_volunteers mv ON mv.mission_id = m.id
//         LEFT JOIN users u ON u.id = mv.volunteer_id AND u.type = 'volunteer'
//         WHERE m.organization_id = ?
//         AND m.status != 'expired'
//         ORDER BY m.id DESC
//         `,
//         [org.id]
//       );

//       const missionMap = {};

//       missions.forEach((row) => {
//         const missionId = row.id;
//         if (!missionMap[missionId]) {
//           missionMap[missionId] = {
//             id: row.id,
//             name: row.name,
//             description: row.description,
//             start_time: toLocalISOString(row.start_time),
//             end_time: toLocalISOString(row.end_time),
//             file: row.file,
//             mission_type: row.mission_type,
//             volunteer_required: row.volunteer_required,
//             prefered_volunteer: row.prefered_volunteer,
//             points: row.points,
//             allow_interaction: row.allow_interaction,
//             status: row.status,
//             organization: {
//               id: org.id,
//               company_name: row.company_name,
//             },
//             assignedvolunteers: [],
//           };
//         }

//         if (row.volunteer_id) {
//           missionMap[missionId].assignedvolunteers.push({
//             id: row.volunteer_id,
//             name: row.volunteer_name,
//             email: row.volunteer_email,
//           });
//         }
//       });

//       return Object.values(missionMap);
//     })
//   );

//   return results.flat();
// };

// exports.getMissionsByUser = async (user) => {
//   const pool = await connectDB();

//     await pool.query(`
//       UPDATE missions
//       SET status = 'expired'
//       WHERE end_time <= NOW()
//         AND status = 'pending'
//     `);

//   let orgQuery = 'SELECT * FROM organizations';
//   const orgParams = [];

//   if (user.type === 'organization') {
//     orgQuery += ' WHERE user_id = ?';
//     orgParams.push(user.id);
//   }

//   const [organizations] = await pool.query(orgQuery, orgParams);
//   // o.company_name, o.email AS org_email, o.description AS org_description,
//   const results = await Promise.all(
//     organizations.map(async (org) => {
//       const [missions] = await pool.query(
//         `
//         SELECT 
//           m.*,o.company_name, 
//           u.id AS volunteer_id, u.name AS volunteer_name, u.email AS volunteer_email
//         FROM missions m
//         JOIN organizations o ON m.organization_id = o.id
//         LEFT JOIN mission_assigned_volunteers mv ON mv.mission_id = m.id
//         LEFT JOIN users u ON u.id = mv.volunteer_id AND u.type = 'volunteer'
//         WHERE m.organization_id = ?
//         AND m.status != 'expired'
//         ORDER BY m.created_at ASC
//         `,
//         [org.id]
//       );

//       const missionMap = {};

//       missions.forEach((row) => {
//         const missionId = row.id;
//         if (!missionMap[missionId]) {
//           missionMap[missionId] = {
//             id: row.id,
//             name: row.name,
//             description: row.description,
//             start_time: toLocalISOString(row.start_time),
//             end_time: toLocalISOString(row.end_time),
//             file: row.file,
//             mission_type: row.mission_type,
//             volunteer_required: row.volunteer_required,
//             prefered_volunteer: row.prefered_volunteer,
//             points: row.points,
//             allow_interaction: row.allow_interaction,
//             status: row.status,
//             organization: {
//               id:row.id,
//               company_name: row.company_name,
//               // email: row.org_email,
//               // description: row.org_description,
//             },
//             assignedvolunteers: [],
//           };
//         }

//         if (row.volunteer_id) {
//           missionMap[missionId].assignedvolunteers.push({
//             id: row.volunteer_id,
//             name: row.volunteer_name,
//             email: row.volunteer_email,
//           });
//         }
//       });

//       return Object.values(missionMap);
//     })
//   );

//   return results.flat();
// };


// exports.getAllMissions = async () => {
//   try {
//     const pool = await connectDB();

//     // Mark expired missions
//     await pool.query(`
//       UPDATE missions
//       SET status = 'expired'
//       WHERE end_time <= NOW()
//         AND status = 'pending'
//     `);

//     const [rows] = await pool.query(`
//       SELECT 
//         m.*, 
//         u.name AS organization_name,
//         o.company_name
//       FROM missions AS m
//       LEFT JOIN users AS u ON m.organization_id = u.id
//       LEFT JOIN organizations AS o ON o.user_id = u.id
//       WHERE m.status != 'expired'
//       ORDER BY m.id DESC
//     `);

//     const formattedRows = rows.map((mission) => ({
//       ...mission,
//       start_time: toLocalISOString(mission.start_time),
//       end_time: toLocalISOString(mission.end_time),
//     }));

//     return formattedRows;
//   } catch (error) {
//     console.error("Error in getAllMissions:", error.message);
//     throw new Error("Server error while fetching missions");
//   }
// };


exports.getAllMissions = async (
  page = 1,
  limit = 10,
  sortBy = "id",
  sortOrder = "desc"
) => {
  try {
    const pool = await connectDB();

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
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const currentLocalTime = getCurrentLocalTimeString();

    // Auto-start scheduled missions whose start time has arrived
    await pool.query(`
      UPDATE missions
      SET status = 'process', notify = 1, notify_status = 1
      WHERE status = 'scheduled'
        AND start_time <= ?
    `, [currentLocalTime]);

    // Expire old missions
    await pool.query(`
      UPDATE missions
      SET status = 'expired'
      WHERE end_time <= ?
        AND status IN ('open', 'scheduled', 'process')
    `, [currentLocalTime]);

    // Total count
    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM missions
      WHERE status != 'expired'
    `);

    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const [missions] = await pool.query(
      `
      SELECT 
        m.*,
        o.company_name,
        o.type AS company_type,
        u.name AS user_name,
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
      FROM missions m
      LEFT JOIN organizations o ON o.id = m.organization_id
      LEFT JOIN users u ON u.id = o.user_id
      WHERE m.status != 'expired'
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

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
          start_time: toLocalISOString(mission.start_time),
          end_time: toLocalISOString(mission.end_time),
          assigned_count: mission.assigned_count || 0,
          applied_count: mission.applied_count || 0,
          assigned_volunteers: assignedVolunteers,
          applied_volunteers: appliedVolunteers,
        };
      })
    );

    return {
      page,
      totalPages,
      totalMissions: total,
      missions: missionsWithVolunteers,
    };
  } catch (error) {
    console.error("Error in getAllMissions:", error);
    throw new Error("Server error while fetching missions");
  }
};


////////// Before pagination work
// exports.getAllMissions = async () => {
//   try {
//     const pool = await connectDB();

//     // Mark expired missions
//     await pool.query(`
//       UPDATE missions
//       SET status = 'expired'
//       WHERE end_time <= NOW()
//         AND status = 'pending'
//     `);

//     // Fetch all missions with organization info and volunteer summary counts
//     const [missions] = await pool.query(`
//       SELECT 
//         m.*, 
//         o.company_name AS company_name,
//         o.type AS company_type,
//         u.name AS user_name,
//         (
//           SELECT COUNT(*) 
//           FROM mission_assigned_volunteers mav 
//           WHERE mav.mission_id = m.id
//         ) AS assigned_count,
//         (
//           SELECT COUNT(*) 
//           FROM mission_pending_requests mpr 
//           WHERE mpr.mission_id = m.id
//         ) AS applied_count
//       FROM missions AS m
//       LEFT JOIN organizations AS o ON o.id = m.organization_id
//       LEFT JOIN users AS u ON u.id = o.user_id
//       WHERE m.status != 'expired'
//       ORDER BY m.id DESC
//     `);

//     // For each mission, fetch assigned & applied volunteers
//     const missionsWithVolunteers = await Promise.all(
//       missions.map(async (mission) => {
//         const [assignedVolunteers] = await pool.query(
//           `
//           SELECT 
//             v.id, v.name, v.email, v.image, v.points
//           FROM mission_assigned_volunteers mav
//           JOIN users v ON v.id = mav.volunteer_id
//           WHERE mav.mission_id = ?
//           `,
//           [mission.id]
//         );

//         const [appliedVolunteers] = await pool.query(
//           `
//           SELECT 
//             v.id, v.name, v.email, v.image, v.points
//           FROM mission_pending_requests mpr
//           JOIN users v ON v.id = mpr.volunteer_id
//           WHERE mpr.mission_id = ?
//           `,
//           [mission.id]
//         );

//         return {
//           ...mission,
//           start_time: toLocalISOString(mission.start_time),
//           end_time: toLocalISOString(mission.end_time),
//           assigned_count: mission.assigned_count || 0,
//           applied_count: mission.applied_count || 0,
//           assigned_volunteers: assignedVolunteers || [],
//           applied_volunteers: appliedVolunteers || [],
//         };
//       })
//     );

//     return missionsWithVolunteers;
//   } catch (error) {
//     console.error("Error in getAllMissions:", error.message);
//     throw new Error("Server error while fetching missions");
//   }
// };



// exports.getAllMissions = async () => {
//   try {
//     const pool = await connectDB();

//     const [rows] = await pool.query(`
//       SELECT 
//         m.*, 
//         u.name AS organization_name
//       FROM missions AS m
//       LEFT JOIN users AS u 
//         ON m.organization_id = u.id
//       ORDER BY m.id DESC
//     `);

//     return rows;
//   } catch (error) {
//     console.error("Error in getAllMissions:", error.message);
//     throw new Error("Server error while fetching missions");
//   }
// };

exports.findNearbyMissions = async (userId, radiusMiles = 50) => {
  const pool = await connectDB();

  await pool.query(`
      UPDATE missions
      SET status = 'expired'
      WHERE end_time <= NOW()
        AND status = 'pending'
    `);

  const [rows] = await pool.query(`
    SELECT m.*,
           (3959 * ACOS(
               COS(RADIANS(u.lat)) *
               COS(RADIANS(m.lat)) *
               COS(RADIANS(m.lng) - RADIANS(u.lng)) +
               SIN(RADIANS(u.lat)) *
               SIN(RADIANS(m.lat))
           )) AS distance
    FROM missions m
    JOIN users u ON u.id = ?
    WHERE m.status != 'expired'
    HAVING distance <= ?
    ORDER BY distance
  `, [userId, radiusMiles]);

  return rows;
};

// Check if volunteer is already assigned
exports.isVolunteerAssigned = async (missionId, volunteerId) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    "SELECT id FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?",
    [missionId, volunteerId]
  );
  return rows.length > 0;
};

// Update mission status
// exports.updateStatus = async (missionId, status) => {
//   const pool = await connectDB();
//   await pool.query("UPDATE missions SET status = ? WHERE id = ?", [
//     status,
//     missionId,
//   ]);
// };

exports.updateStatus = async (missionId, status) => {
  const pool = await connectDB();
  const [result] = await pool.query("UPDATE missions SET status = ? WHERE id = ?", [
    status,
    missionId,
  ]);
  return result;
};

exports.updateAssignedVolunteerStatus = async (missionId, volunteerId, status) => {
  const pool = await connectDB();
  await pool.query(
    "UPDATE mission_assigned_volunteers SET status = ? WHERE mission_id = ? AND volunteer_id = ?",
    [status, missionId, volunteerId]
  );
};


exports.updateNotify = async (missionId, value) => {
  const pool = await connectDB();
  await pool.query("UPDATE missions SET notify = ? WHERE id = ?", [value, missionId]);
};

// Add pending requests
exports.findPendingRequest = async (missionId, volunteerId) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    "SELECT * FROM mission_pending_requests WHERE mission_id = ? AND volunteer_id = ?",
    [missionId, volunteerId]
  );
  return rows[0] || null;
};



// Delete pending request
exports.deletePendingRequest = async (missionId, volunteerId) => {
  const pool = await connectDB();
  // console.log("Pool returned from connectDB:", pool);
  // console.log("Type of pool.query:", typeof pool?.query);

  if (!pool || typeof pool.query !== 'function') {
    // console.error("MySQL pool is not initialized properly.");
    throw new Error("Database connection failed");
  }

  const [result] = await pool.query(
    "DELETE FROM mission_pending_requests WHERE mission_id = ? AND volunteer_id = ?",
    [missionId, volunteerId]
  );

  return result.affectedRows > 0;
};


exports.deleteAssignedRequest = async (missionId, volunteerId) => {
  const pool = await connectDB();
  const [result] = await pool.query(
    "DELETE FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?",
    [missionId, volunteerId]
  );

  return result.affectedRows > 0;
};

exports.updateCanPost = async (missionId, userId) => {
  const pool = await connectDB();

  const [rows] = await pool.query(
    "SELECT id, can_post FROM missions WHERE id = ?",
    [missionId]
  );

  const mission = rows[0];

  if (!mission) {
    return null;
  }

  if (mission.can_post) {
    return { message: "Already posted", mission };
  }

  await pool.query(
    "UPDATE missions SET can_post = true, posted_by = ? WHERE id = ?",
    [userId, missionId]
  );


  mission.can_post = true;
  return { message: "Feed posted successfully", mission };
};


// exports.updateCanPost = async (missionId) => {
//   const pool = await connectDB();
//   await pool.query("UPDATE missions SET can_post = true WHERE id = ?", [
//     missionId,
//   ]);
//   const [rows] = await pool.query(
//     "SELECT id, can_post FROM missions WHERE id = ?",
//     [missionId]
//   );
//   return rows[0] || null;
// };

exports.findPendingRequest = async (missionId, volunteerId) => {
  const pool = await connectDB();
  const [[pending]] = await pool.query("SELECT * FROM mission_pending_requests WHERE mission_id = ? AND volunteer_id = ? ", [missionId, volunteerId]);
  return pending;
};

exports.findAssignedVolunteer = async (missionId, volunteerId) => {
  const pool = await connectDB();
  const [[assigned]] = await pool.query(
    "SELECT * FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?",
    [missionId, volunteerId]
  );
  return assigned;
};


exports.addComment = async (missionId, userId, comment) => {
  const pool = await connectDB();
  const [result] = await pool.query('INSERT INTO mission_comments (mission_id, user_id, comment) VALUES (?, ?, ?) ', [missionId, userId, comment]);
  return result.insertId;
}


exports.findMissionCreatorUser = async (missionId) => {
  const pool = await connectDB();

  const [rows] = await pool.query(
    `
    SELECT u.id, u.name, u.email
    FROM missions m
    LEFT JOIN organizations o ON (m.organization_id = o.id OR m.organization_id = o.user_id)
    LEFT JOIN users u ON (u.id = o.user_id OR (o.user_id IS NULL AND u.id = m.posted_by))
    WHERE m.id = ?
    LIMIT 1
    `,
    [missionId]
  );

  return rows[0];
};

exports.findVolunteer = async (volunteerId) => {
  const pool = await connectDB();

  const [rows] = await pool.query(
    `
    SELECT name
    FROM users
    WHERE id = ?
    `,
    [volunteerId]
  );

  return rows[0];
};

exports.updateMissionStatus = async (missionId, conn) => {
  const [result] = await conn.query(
    "UPDATE missions SET status = 'completed' WHERE id = ?",
    [missionId]
  );
  return result;
};

exports.addPendingRequest = async (missionId, volunteerId) => {
  const pool = await connectDB();
  const [result] = await pool.query(
    "INSERT INTO mission_pending_requests (mission_id, volunteer_id) VALUES (?, ?)",
    [missionId, volunteerId]
  );
  return result.insertId;
};


// for Add Points

exports.addPoints = async (missionId, volunteerId, conn) => {

  const [missionRows] = await conn.query(
    "SELECT points FROM missions WHERE id = ?",
    [missionId]
  );

  if (!missionRows.length) {
    return { success: false, message: "Mission not found" };
  }

  const missionPoints = missionRows[0].points || 0;

  const [result] = await conn.query(
    `
    UPDATE users 
    SET points = COALESCE(points, 0) + ? 
    WHERE id = ?
    `,
    [missionPoints, volunteerId]
  );

  if (result.affectedRows === 0) {
    return { success: false, message: "Volunteer user not found" };
  }

  return { success: true, volunteerId, pointsAdded: missionPoints };
};

exports.updateMission = async (missionId, missionData) => {
  const pool = await connectDB();
  const startTime = formatForMySQL(missionData.start_time);
  const endTime = formatForMySQL(missionData.end_time);

  const [result] = await pool.query(
    `UPDATE missions SET 
      name = ?, 
      description = ?, 
      lat = ?, 
      lng = ?, 
      start_time = ?, 
      end_time = ?, 
      file = ?, 
      relevant_distance = ?, 
      work_type = ?, 
      mission_type = ?,
      volunteer_required = ?,
      points = ?,
      allow_interaction = ?
    WHERE id = ? AND organization_id = ?`,
    [
      missionData.name,
      missionData.description || null,
      missionData.lat,
      missionData.lng,
      startTime,
      endTime,
      missionData.file || null,
      missionData.relevant_distance || null,
      missionData.work_type || null,
      missionData.mission_type || null,
      missionData.volunteer_required || null,
      missionData.points || null,
      missionData.allow_interaction || null,
      missionId,
      missionData.organization_id,
    ]
  );

  return result.affectedRows;
};


exports.deleteMission = async (missionId, organizationId) => {
  const pool = await connectDB();

  const [result] = await pool.query(
    "DELETE FROM missions WHERE id = ? AND organization_id = ?",
    [missionId, organizationId]
  );

  return result.affectedRows;
};


// exports.deletePendingRequest = async (missionId, volunteerId, conn) => {
//   const [result] = await conn.query(
//     "DELETE FROM mission_pending_requests WHERE mission_id = ? AND volunteer_id = ?",
//     [missionId, volunteerId]
//   );
//   return result;
// };

exports.deleteAssignedVolunteer = async (missionId, volunteerId, conn) => {
  const [result] = await conn.query(
    "DELETE FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?",
    [missionId, volunteerId]
  );
  return result;
};


// const mongoose = require('mongoose');

// const checkInSchema = new mongoose.Schema({
//   volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   checkInTime: { type: Date, required: true },
//   checkOutTime: { type: Date },
//   pointsEarned: { type: Number, default: 0 }
// }, { _id: false });

// const missionSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   description: { type: String },
//   location: {
//     lat: { type: Number },
//     lng: { type: Number },
//   },
//   start_time: { type: Date, required: true },
//   end_time: { type: Date, required: true },
//   file: { type: String },
//   relevant_distance: { type: String, enum: ['local','city wide', 'country wide global'] },
//   work_type: { type: String, enum: ['tutor','staff','cleaning','watchman'] },
//   organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
//   assignedvolunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//   checkIns: [checkInSchema],
//   status: { type: String, enum: ['pending','completed','rejected'] },
//   pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Mission', missionSchema);