const connectDB = require("../config/db");

const Leaderboard = {

async getVolunteers(limit, offset, sortBy, sortOrder) {
  const db = await connectDB();

    const allowedSortFields = {
    name: "name",
    email: "email",
    status: "status",
    created_at: "created_at",
    id: "id",
  };

  const sortColumn = allowedSortFields[sortBy] || "created_at";
  const direction = sortOrder === "asc" ? "ASC" : "DESC";

  const [rows] = await db.query(
    `SELECT * 
     FROM users 
     WHERE type = 'volunteer'
     ORDER BY ${sortColumn} ${direction} 
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const sanitized = rows.map(({ password, ...rest }) => rest);

  return sanitized;
},



  async countVolunteers() {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total 
       FROM users 
       WHERE type = 'volunteer'`
    );
    return rows[0].total;
  },


//  async getFilteredVolunteers(limit = 10, offset = 0, filters){
//   const db = await connectDB();

//   let query = `
//     SELECT id, name, points, image, city, state, country, previous_rank
//     FROM users
//     WHERE type = 'volunteer'
//   `;

//   let params = [];

//   if (filters.city) {
//     query += " AND city = ?";
//     params.push(filters.city);
//   }

//   if (filters.state) {
//     query += " AND state = ?";
//     params.push(filters.state);
//   }

//   if (filters.country) {
//     query += " AND country = ?";
//     params.push(filters.country);
//   }

//   query += " ORDER BY points DESC LIMIT ? OFFSET ?";
//   params.push(limit, offset);

//   const [rows] = await db.query(query, params);
//   return rows;
// },

// // Count filtered volunteers
// async countFilteredVolunteers(filters){
//   const db = await connectDB();

//   let query = `SELECT COUNT(*) AS total FROM users WHERE type='volunteer'`;
//   let params = [];

//   if (filters.city) {
//     query += " AND city = ?";
//     params.push(filters.city);
//   }

//   if (filters.state) {
//     query += " AND state = ?";
//     params.push(filters.state);
//   }

//   if (filters.country) {
//     query += " AND country = ?";
//     params.push(filters.country);
//   }

//   const [rows] = await db.query(query, params);
//   return rows[0].total;
// },

// // Update previous ranks
// async updatePreviousRanks(){
//   const db = await connectDB();

//   await db.query(`
//     UPDATE users
//     SET previous_rank = (
//       SELECT new_rank FROM (
//         SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC) AS new_rank
//         FROM users
//         WHERE type = 'volunteer'
//       ) ranking
//       WHERE ranking.id = users.id
//     );
//   `);
// },

  // Get top volunteers by points
  async getFilteredVolunteers(limit = 10, offset = 0, filters) {
    const db = await connectDB();

    let query = `
      SELECT id, name, points, image, city, state, country
      FROM users
      WHERE type = 'volunteer'
    `;

    let params = [];

    if (filters.city) {
      query += " AND city = ?";
      params.push(filters.city);
    }

    if (filters.state) {
      query += " AND state = ?";
      params.push(filters.state);
    }

    if (filters.country) {
    query += " AND country = ?";
    params.push(filters.country);
    }

    if (filters.volunteer_group_id) {
      query += " AND invitedBy = ?";
      params.push(filters.volunteer_group_id);
    }
    
    query += " ORDER BY points DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  },


async countFilteredVolunteers(filters = {}) {
  const db = await connectDB();

  let query = `SELECT COUNT(*) AS total FROM users WHERE type='volunteer'`;
  const params = [];

  if (filters.city) {
    query += " AND city = ?";
    params.push(filters.city);
  }

  if (filters.state) {
    query += " AND state = ?";
    params.push(filters.state);
  }

    if (filters.country) {
    query += " AND country = ?";
    params.push(filters.country);
    }

    if (filters.volunteer_group_id) {
      query += " AND invitedBy = ?";
      params.push(filters.volunteer_group_id);
    }

  const [rows] = await db.query(query, params);
  return rows[0].total;
},

  // New: Leaderboard by Organization
async getVolunteersByOrg(limit = 10, offset = 0, filters) {
  const db = await connectDB();

  let query = `
    SELECT DISTINCT u.id, u.name, u.points, u.image, u.city, u.state, u.country, u.previous_rank
    FROM users u
    JOIN organization_volunteers ov ON u.id = ov.user_id
    WHERE u.type = 'volunteer' 
      AND ov.organization_id = ? 
      AND ov.status = 'accepted'
  `;

  let params = [filters.organization_id];

  if (filters.city) {
    query += " AND u.city = ?";
    params.push(filters.city);
  }
  if (filters.state) {
    query += " AND u.state = ?";
    params.push(filters.state);
  }
  if (filters.country) {
    query += " AND u.country = ?";
    params.push(filters.country);
  }
    if (filters.volunteer_group_id) {
      query += " AND u.invitedBy = ?";
      params.push(filters.volunteer_group_id);
    }

  query += " ORDER BY u.points DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const [rows] = await db.query(query, params);
  return rows;
},

  async countVolunteersByOrg(filters) {
    const db = await connectDB();
    let query = `
       SELECT COUNT(DISTINCT u.id) AS total
       FROM users u
       JOIN organization_volunteers ov ON u.id = ov.user_id
       WHERE u.type = 'volunteer' 
         AND ov.organization_id = ? 
         AND ov.status = 'accepted'
    `;
    let params = [filters.organization_id];

    if (filters.city) {
      query += " AND u.city = ?";
      params.push(filters.city);
    }
    if (filters.state) {
      query += " AND u.state = ?";
      params.push(filters.state);
    }
    if (filters.country) {
      query += " AND u.country = ?";
      params.push(filters.country);
    }
    if (filters.volunteer_group_id) {
      query += " AND u.invitedBy = ?";
      params.push(filters.volunteer_group_id);
    }

    const [rows] = await db.query(query, params);
    return rows[0].total;
  },

//   async countVolunteersByOrg(filters) {
//     const db = await connectDB();
//     const [rows] = await db.query(
//       `SELECT COUNT(DISTINCT u.id) AS total
//        FROM users u
//        JOIN organization_volunteers ov ON u.id = ov.user_id
//        LEFT JOIN organizations o ON ov.organization_id = o.id
//        WHERE u.type = 'volunteer' 
//          AND ov.organization_id = ? 
//          AND ov.status = 'accepted'`,
//          [filters.organization_id, filters.organization_id]
//       // [filters.organization_id]
//     );
//     return rows[0].total;
//   },

  //  Get a volunteer’s rank among all volunteers
  async getVolunteerRank(userId) {
    const db = await connectDB();
    const [rows] = await db.query(`
      SELECT 
        id, 
        name, 
        points,
        RANK() OVER (ORDER BY points DESC) AS rank
      FROM users
      WHERE type = 'volunteer'
    `);

    const volunteer = rows.find((u) => u.id === parseInt(userId));
    return volunteer || null;
  },

  // Get full volunteer details with expertise, preferences, and timings

  // async getVolunteerRank(userId) {
  //   const db = await connectDB();
  //   const [rows] = await db.query(`
  //     SELECT 
  //       id, 
  //       name, 
  //       points,
  //       RANK() OVER (ORDER BY points DESC) AS rank
  //     FROM users
  //     WHERE type = 'volunteer'
  //   `);

  //   return rows.find((u) => u.id === parseInt(userId)) || null;
  // },


  // =========================
  //   Get full volunteer details
  // =========================
  async volDetails(userId) {
    const db = await connectDB();

    // Fetch volunteer base info
    const [userRows] = await db.query(
      "SELECT * FROM users WHERE id = ? AND type = 'volunteer'",
      [userId]
    );

    const user = userRows[0];
    if (!user) return null;

    // Hide password
    const { password, ...safeUser } = user;

    // Parallel queries for performance
    const [
      [expertiseRows],
      [preferenceRows],
      [timingRows],
      [assignedMissions],
      [pendingMissions],
      [completedMissions],
      [feedMissionsRows]
    ] = await Promise.all([
      db.query("SELECT expertise FROM user_expertise WHERE user_id = ?", [
        userId,
      ]),
      db.query("SELECT preference FROM user_preferences WHERE user_id = ?", [
        userId,
      ]),
      db.query(
        "SELECT day, `from` AS start_time, `to` AS end_time FROM user_timings WHERE user_id = ?",
        [userId]
      ),
      db.query(
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
          m.status,
          o.company_name
        FROM mission_assigned_volunteers mav
        JOIN missions m ON m.id = mav.mission_id
        LEFT JOIN users u ON m.organization_id = u.id
        LEFT JOIN organizations o ON o.id = m.organization_id
        WHERE mav.volunteer_id = ?
        ORDER BY m.start_time DESC
        `,
        [userId]
      ),
      db.query(
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
          m.status,
          o.company_name
        FROM mission_pending_requests mpr
        JOIN missions m ON m.id = mpr.mission_id
        LEFT JOIN users u ON m.organization_id = u.id
        LEFT JOIN organizations o ON o.id = m.organization_id
        WHERE mpr.volunteer_id = ?
        ORDER BY m.start_time DESC
        `,
        [userId]
      ),
          db.query(
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
        m.status,
        o.company_name
      FROM mission_assigned_volunteers mav
      JOIN missions m ON m.id = mav.mission_id
      LEFT JOIN users u ON m.organization_id = u.id
      LEFT JOIN organizations o ON o.id = m.organization_id
      WHERE mav.volunteer_id = ?
        AND m.status = 'completed'
      ORDER BY m.start_time DESC
      `,
      [userId]
    ),
    db.query(`
  SELECT 
    m.*, 
    o.company_name,
    au.name AS author_name,

    CASE WHEN ml.id IS NOT NULL THEN TRUE ELSE FALSE END AS liked,
    IFNULL(lc.total_likes, 0) AS total_likes,
    IFNULL(cc.total_comments, 0) AS total_comments,
    cc.latest_comment_at

  FROM mission_assigned_volunteers mav
  JOIN missions m ON mav.mission_id = m.id
  LEFT JOIN users au ON au.id = m.posted_by
  LEFT JOIN users u ON m.organization_id = u.id
  LEFT JOIN organizations o ON o.id = m.organization_id

  LEFT JOIN mission_likes ml
    ON ml.mission_id = m.id 
   AND ml.user_id = ?

  LEFT JOIN (
    SELECT mission_id, COUNT(*) AS total_likes
    FROM mission_likes
    GROUP BY mission_id
  ) AS lc ON lc.mission_id = m.id

  LEFT JOIN (
    SELECT 
      mission_id,
      COUNT(*) AS total_comments,
      MAX(created_at) AS latest_comment_at
    FROM mission_comments
    GROUP BY mission_id
  ) AS cc ON cc.mission_id = m.id

  WHERE mav.volunteer_id = ?
    AND m.status = 'completed'
    AND m.can_post = true
  
  ORDER BY 
    COALESCE(cc.latest_comment_at, '1970-01-01') DESC,
    m.id DESC
`, [userId, userId])    
  //   db.query(`
  //   SELECT m.*, o.company_name
  //   FROM mission_assigned_volunteers mav
  //   JOIN missions m ON mav.mission_id = m.id
  //   LEFT JOIN users u ON m.organization_id = u.id
  //   LEFT JOIN organizations o ON o.id = m.organization_id
  //   WHERE mav.volunteer_id = ?
  //     AND m.status = 'completed'
  //     AND m.can_post = true
  // `, [userId])
    ]);

    // Date/time formatting (safe)
      const formatDate = (d) => {
    try {
      return d ? new Date(d).toISOString() : null;
    } catch {
      return null;
    }
  };
    // const formatDate = (d) => {
    //   try {
    //     return d ? toLocalISOString(d) : null;
    //   } catch {
    //     return null;
    //   }
    // };

    const formatMission = (m) => ({
      ...m,
      start_time: formatDate(m.start_time),
      end_time: formatDate(m.end_time),
      status: m.status || "pending",
    });

    const formattedAssigned = assignedMissions.map(formatMission);
    const formattedPending = pendingMissions.map(formatMission);
    const formattedCompleted = completedMissions.map(formatMission);
    const formattedFeed = feedMissionsRows.map(formatMission);

// -----------------------------
// FETCH COMMENTS FOR FEED ITEMS
// -----------------------------
const feedMissionIds = formattedFeed.map(m => m.id);

let commentsByMission = {};

if (feedMissionIds.length > 0) {
  const [commentRows] = await db.query(`
    SELECT 
      mc.id,
      mc.mission_id,
      mc.comment,
      u.name AS user_name,
      mc.user_id,
      mc.is_disabled,
      mc.created_at
    FROM mission_comments mc
    LEFT JOIN users u ON u.id = mc.user_id
    WHERE mc.mission_id IN (?)
    ORDER BY mc.created_at DESC
  `, [feedMissionIds]);

commentsByMission = commentRows.reduce((acc, comment) => {
  if (!acc[comment.mission_id]) acc[comment.mission_id] = [];

  acc[comment.mission_id].push({
    ...comment,
    created_at: toLocalISOString(comment.created_at)
  });

  return acc;
}, {});


  // commentsByMission = commentRows.reduce((acc, comment) => {
  //   if (!acc[comment.mission_id]) acc[comment.mission_id] = [];
  //   acc[comment.mission_id].push(comment);
  //   return acc;
  // }, {});
}

// Attach comments to feed missions
const feedsWithComments = formattedFeed.map(m => ({
  ...m,
  comments: commentsByMission[m.id] || []
}));

    // Final combined response
    return {
      ...safeUser,
      expertise: expertiseRows.map((r) => r.expertise),
      preferences: preferenceRows.map((r) => r.preference),
      available_timing: timingRows.map((t) => ({
        day: t.day,
        start_time: t.start_time,
        end_time: t.end_time,
      })),
      assigned_missions: formattedAssigned,
      pending_missions: formattedPending,
      completed_missions: formattedCompleted,
      feeds: feedsWithComments
    };
  },


/////////// Start Feed Work

//   // =========================
//   //   Get full volunteer details
//   // =========================
//   async volDetails(userId) {
//     const db = await connectDB();

//     // Fetch volunteer base info
//     const [userRows] = await db.query(
//       "SELECT * FROM users WHERE id = ? AND type = 'volunteer'",
//       [userId]
//     );

//     const user = userRows[0];
//     if (!user) return null;

//     // Hide password
//     const { password, ...safeUser } = user;

//     // Parallel queries for performance
//     const [
//       [expertiseRows],
//       [preferenceRows],
//       [timingRows],
//       [assignedMissions],
//       [pendingMissions],
//       [completedMissions],
//       [feedMissions]
//     ] = await Promise.all([
//       db.query("SELECT expertise FROM user_expertise WHERE user_id = ?", [
//         userId,
//       ]),
//       db.query("SELECT preference FROM user_preferences WHERE user_id = ?", [
//         userId,
//       ]),
//       db.query(
//         "SELECT day, `from` AS start_time, `to` AS end_time FROM user_timings WHERE user_id = ?",
//         [userId]
//       ),
//       db.query(
//         `
//         SELECT 
//           m.id, 
//           m.name, 
//           m.description, 
//           m.start_time, 
//           m.end_time, 
//           m.points, 
//           m.mission_type,
//           m.file,
//           m.status,
//           o.company_name
//         FROM mission_assigned_volunteers mav
//         JOIN missions m ON m.id = mav.mission_id
//         LEFT JOIN users u ON m.organization_id = u.id
//         LEFT JOIN organizations o ON o.id = m.organization_id
//         WHERE mav.volunteer_id = ?
//         ORDER BY m.start_time DESC
//         `,
//         [userId]
//       ),
//       db.query(
//         `
//         SELECT 
//           m.id, 
//           m.name, 
//           m.description, 
//           m.start_time, 
//           m.end_time, 
//           m.points, 
//           m.mission_type,
//           m.file,
//           m.status,
//           o.company_name
//         FROM mission_pending_requests mpr
//         JOIN missions m ON m.id = mpr.mission_id
//         LEFT JOIN users u ON m.organization_id = u.id
//         LEFT JOIN organizations o ON o.id = m.organization_id
//         WHERE mpr.volunteer_id = ?
//         ORDER BY m.start_time DESC
//         `,
//         [userId]
//       ),
//           db.query(
//       `
//       SELECT 
//         m.id, 
//         m.name, 
//         m.description, 
//         m.start_time, 
//         m.end_time, 
//         m.points, 
//         m.mission_type,
//         m.file,
//         m.status,
//         o.company_name
//       FROM mission_assigned_volunteers mav
//       JOIN missions m ON m.id = mav.mission_id
//       LEFT JOIN users u ON m.organization_id = u.id
//       LEFT JOIN organizations o ON o.id = m.organization_id
//       WHERE mav.volunteer_id = ?
//         AND m.status = 'completed'
//       ORDER BY m.start_time DESC
//       `,
//       [userId]
//     ),    
//     db.query(`
//     SELECT m.*, o.company_name
//     FROM mission_assigned_volunteers mav
//     JOIN missions m ON mav.mission_id = m.id
//     LEFT JOIN users u ON m.organization_id = u.id
//     LEFT JOIN organizations o ON o.id = m.organization_id
//     WHERE mav.volunteer_id = ?
//       AND m.status = 'completed'
//       AND m.can_post = true
//   `, [userId])
//     ]);

//     // Date/time formatting (safe)
//       const formatDate = (d) => {
//     try {
//       return d ? new Date(d).toISOString() : null;
//     } catch {
//       return null;
//     }
//   };
//     // const formatDate = (d) => {
//     //   try {
//     //     return d ? toLocalISOString(d) : null;
//     //   } catch {
//     //     return null;
//     //   }
//     // };

//     const formatMission = (m) => ({
//       ...m,
//       start_time: formatDate(m.start_time),
//       end_time: formatDate(m.end_time),
//       status: m.status || "pending",
//     });

//     const formattedAssigned = assignedMissions.map(formatMission);
//     const formattedPending = pendingMissions.map(formatMission);
//     const formattedCompleted = completedMissions.map(formatMission);
//     const formattedFeed = feedMissions.map(formatMission);

//     // Final combined response
//     return {
//       ...safeUser,
//       expertise: expertiseRows.map((r) => r.expertise),
//       preferences: preferenceRows.map((r) => r.preference),
//       available_timing: timingRows.map((t) => ({
//         day: t.day,
//         start_time: t.start_time,
//         end_time: t.end_time,
//       })),
//       assigned_missions: formattedAssigned,
//       pending_missions: formattedPending,
//       completed_missions: formattedCompleted,
//       feeds: formattedFeed
//     };
//   },

// //////// End Feeds Work

// async volDetails(userId) {
//   const db = await connectDB();

//   const [userRows] = await db.query(
//     "SELECT * FROM users WHERE id = ? AND type = 'volunteer'",
//     [userId]
//   );
//   const user = userRows[0];
//   if (!user) return null;

//   const [expertiseRows] = await db.query(
//     "SELECT expertise FROM user_expertise WHERE user_id = ?",
//     [userId]
//   );

//   const [preferenceRows] = await db.query(
//     "SELECT preference FROM user_preferences WHERE user_id = ?",
//     [userId]
//   );

//   const [timingRows] = await db.query(
//     "SELECT day, `from` AS start_time, `to` AS end_time FROM user_timings WHERE user_id = ?",
//     [userId]
//   );

//   return {
//     ...user,
//     expertise: expertiseRows.map((r) => r.expertise),
//     preferences: preferenceRows.map((r) => r.preference),
//     available_timing: timingRows.map((t) => ({
//       day: t.day,
//       start_time: t.start_time,
//       end_time: t.end_time,
//     })),
//   };
// },

  // async volDetails(userId) {
  //   const db = await connectDB();

  //   // Get basic user info
  //   const [userRows] = await db.query(
  //     "SELECT * FROM users WHERE id = ? AND type = 'volunteer'",
  //     [userId]
  //   );
  //   const user = userRows[0];
  //   if (!user) return null;

  //   // Get related expertise, preferences, timings
  //   const [rows] = await db.query(
  //     `
  //     SELECT 
  //       ue.expertise AS expertise,
  //       up.preference AS preference,
  //       ut.day,
  //       ut.from AS start_time,
  //       ut.to AS end_time
  //     FROM users u
  //     LEFT JOIN user_expertise ue ON u.id = ue.user_id
  //     LEFT JOIN user_preferences up ON u.id = up.user_id
  //     LEFT JOIN user_timings ut ON u.id = ut.user_id
  //     WHERE u.id = ?
  //     `,
  //     [userId]
  //   );

  //   //  Aggregate results into arrays
  //   const expertiseSet = new Set();
  //   const preferencesSet = new Set();
  //   const available_timing = [];

  //   for (const row of rows) {
  //     if (row.expertise) expertiseSet.add(row.expertise);
  //     if (row.preference) preferencesSet.add(row.preference);
  //     if (row.day && row.start_time && row.end_time) {
  //       available_timing.push({
  //         day: row.day,
  //         start_time: row.start_time,
  //         end_time: row.end_time,
  //       });
  //     }
  //   }

  //   // Return merged, clean structure
  //   return {
  //     ...user,
  //     expertise: [...expertiseSet],
  //     preferences: [...preferencesSet],
  //     available_timing,
  //   };
  // },


  async findById(volunteerId) {
    const db = await connectDB();
    const [[volunteer]] = await db.query(
      `
      SELECT id, name, invitedBy AS invitedBy, invitedBy AS invitedby 
      FROM users 
      WHERE id = ?`,
      [volunteerId]
    );
    return volunteer || null;
  },

  async findById(volunteerId) {
    const db = await connectDB();
    const [[volunteer]] = await db.query(
      `
      SELECT id, name, invitedBy AS invitedBy, invitedBy AS invitedby 
      FROM users 
      WHERE id = ?`,
      [volunteerId]
    );
    return volunteer || null;
  }, // <--- removed the "};" here

/////////// Previous before above 17 july
//   async findById(volunteerId) {
//     const db = await connectDB();
//     const [[volunteer]] = await db.query(
//       `
//       SELECT id, name 
//       FROM users 
//       WHERE id = ?`,
//       [volunteerId]
//     );
//     return volunteer || null;
//   },
// };

  async getGroupLeaderboard(limit = 10, offset = 0, filters = {}) {
    const db = await connectDB();

    let query = `
      SELECT 
        g.id, 
        g.name, 
        g.email,
        g.image, 
        g.city, 
        g.state, 
        g.country, 
        g.previous_rank,
        COALESCE(SUM(v.points), 0) AS points
      FROM users g
      LEFT JOIN users v ON v.invitedBy = g.id AND v.type = 'volunteer'
      WHERE g.type = 'volunteer_group'
    `;
    let params = [];

    if (filters.city) {
      query += " AND g.city = ?";
      params.push(filters.city);
    }
    if (filters.state) {
      query += " AND g.state = ?";
      params.push(filters.state);
    }
    if (filters.country) {
      query += " AND g.country = ?";
      params.push(filters.country);
    }

    query += " GROUP BY g.id ORDER BY points DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  },

  async countGroupLeaderboard(filters = {}) {
    const db = await connectDB();
    let query = `
      SELECT COUNT(DISTINCT g.id) AS total
      FROM users g
      WHERE g.type = 'volunteer_group'
    `;
    let params = [];

    if (filters.city) {
      query += " AND g.city = ?";
      params.push(filters.city);
    }
    if (filters.state) {
      query += " AND g.state = ?";
      params.push(filters.state);
    }
    if (filters.country) {
      query += " AND g.country = ?";
      params.push(filters.country);
    }

    const [rows] = await db.query(query, params);
    return rows[0].total;
  },

};

/////////// Previous before above 17 july
//   async findById(volunteerId) {
//     const db = await connectDB();
//     const [[volunteer]] = await db.query(
//       `
//       SELECT id, name 
//       FROM users 
//       WHERE id = ?`,
//       [volunteerId]
//     );
//     return volunteer || null;
//   },
// };


function toLocalISOString(date) {
  if (!date) return null;

  try {
    const d = new Date(date);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d - tzOffset).toISOString().slice(0, 19);
  } catch {
    return null;
  }
}



module.exports = Leaderboard;

// const connectDB = require("../config/db");

// exports.findById = async (volunteerId) => {
//   const pool = await connectDB();
//   const [[volunteer]] = await pool.query(
//     "SELECT id, name FROM users WHERE id = ?",
//     [volunteerId]
//   );
//   return volunteer;
// };