const connectDB = require("../config/db");

exports.sendNotification = async ({ sender_id, receiver_id, type, message, meta }, connection = null) => {
  const pool = await connectDB();
  const db = connection || pool;
  const [result] = await db.query(
    "INSERT INTO notifications (sender_id, receiver_id, type, message, meta) VALUES (?, ?, ?, ?, ?)",
    [sender_id, receiver_id, type, message, JSON.stringify(meta)]
  );
  return { id: result.insertId, sender_id, receiver_id, type, message, meta };
};

// exports.sendNotification = async ({ sender_id, receiver_id, type, message, meta }) => {
//   const pool = await connectDB();
//   const [result] = await pool.query(
//     "INSERT INTO notifications (sender_id, receiver_id, type, message, meta) VALUES (?, ?, ?, ?, ?)",
//     [sender_id, receiver_id, type, message, JSON.stringify(meta)]
//   );
//   return { id: result.insertId, sender_id, receiver_id, type, message, meta };
// };

// exports.getUserNotifications = async (user_id) => {
//   const pool = await connectDB();
//   const [rows] = await pool.query(
//     "SELECT * FROM notifications WHERE receiver_id = ? ORDER BY created_at DESC",
//     [user_id]
//   );
//   return rows;
// };


// Fetch notifications with pagination

exports.getUserNotifications = async (user_id) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `
    SELECT n.*,
    m.status AS mission_status,
    m.notify,
    mav.status AS volunteer_mission_status,
    CASE WHEN n2.id IS NOT NULL THEN 1 ELSE 0 END AS group_requested_completion,
    vga.status AS group_application_status
    FROM notifications n
    LEFT JOIN missions m 
      ON CAST(
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.mission_id')),
          JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.missionId'))
        ) AS UNSIGNED
      ) = m.id
    LEFT JOIN mission_assigned_volunteers mav
      ON mav.mission_id = m.id 
      AND mav.volunteer_id = CASE 
        WHEN JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteer_id')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteer_id')) != 'null'
        THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteer_id')) AS UNSIGNED)
        WHEN JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteerId')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteerId')) != 'null'
        THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteerId')) AS UNSIGNED)
        ELSE n.receiver_id
      END
    LEFT JOIN notifications n2
      ON n2.type = 'mission_completion_request'
      AND n2.sender_id = n.receiver_id
      AND CAST(
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(n2.meta, '$.mission_id')),
          JSON_UNQUOTE(JSON_EXTRACT(n2.meta, '$.missionId'))
        ) AS UNSIGNED
      ) = m.id
    LEFT JOIN volunteer_group_applications vga
      ON vga.mission_id = m.id 
      AND vga.group_id = n.sender_id
    WHERE n.receiver_id = ?
      AND (
        COALESCE(
          JSON_EXTRACT(n.meta, '$.mission_id'),
          JSON_EXTRACT(n.meta, '$.missionId')
        ) IS NULL
        OR (m.id IS NOT NULL AND m.status != 'expired')
      )
    ORDER BY n.created_at DESC
    `,
    [user_id]
  );

  return rows;
};

// Before grp work above is new
// exports.getUserNotifications = async (user_id) => {
//   const pool = await connectDB();
//   const [rows] = await pool.query(
//     `
//     SELECT n.*,
//     m.status AS mission_status,
//     m.notify,
//     mav.status AS volunteer_mission_status
//     FROM notifications n
//     LEFT JOIN missions m 
//       ON CAST(
//         COALESCE(
//           JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.mission_id')),
//           JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.missionId'))
//         ) AS UNSIGNED
//       ) = m.id
//     LEFT JOIN mission_assigned_volunteers mav
//       ON mav.mission_id = m.id 
//       AND mav.volunteer_id = CASE 
//         WHEN JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteer_id')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteer_id')) != 'null'
//         THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteer_id')) AS UNSIGNED)
//         WHEN JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteerId')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteerId')) != 'null'
//         THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteerId')) AS UNSIGNED)
//         ELSE n.receiver_id
//       END
//     WHERE n.receiver_id = ?
//       AND (
//         COALESCE(
//           JSON_EXTRACT(n.meta, '$.mission_id'),
//           JSON_EXTRACT(n.meta, '$.missionId')
//         ) IS NULL
//         OR (m.id IS NOT NULL AND m.status != 'expired')
//       )
//     ORDER BY n.created_at DESC
//     `,
//     [user_id]
//   );

//   return rows;
// };

//  Previous 22 July
// exports.getUserNotifications = async (user_id) => {
//   const pool = await connectDB();

//   const [rows] = await pool.query(
//     `
//     SELECT n.*,
//     m.status AS mission_status,
//     m.notify
//     FROM notifications n
//     LEFT JOIN missions m 
//       ON CAST(
//         COALESCE(
//           JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.mission_id')),
//           JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.missionId'))
//         ) AS UNSIGNED
//       ) = m.id
//     WHERE n.receiver_id = ?
//       AND (
//         COALESCE(
//           JSON_EXTRACT(n.meta, '$.mission_id'),
//           JSON_EXTRACT(n.meta, '$.missionId')
//         ) IS NULL
//         OR (m.id IS NOT NULL AND m.status != 'expired')
//       )
//     ORDER BY n.created_at DESC
//     `,
//     [user_id]
//   );

//   return rows;
// };

exports.countUnreadNotifications = async (user_id) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS unread_count FROM notifications WHERE receiver_id = ? AND status = 'unread'`,
    [user_id]
  );
  return rows[0].unread_count;
};



// exports.getUserNotifications = async (user_id, limit, offset) => {
//   const pool = await connectDB();
// const [rows] = await pool.query(
//   `
//   SELECT n.*
//   FROM notifications n
//   LEFT JOIN missions m 
//     ON JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.mission_id')) = m.id
//   WHERE n.receiver_id = ?
//     AND (m.id IS NULL OR m.end_time > NOW())
//   ORDER BY n.created_at DESC
//   LIMIT ? OFFSET ?
//   `,
//   [user_id, limit, offset]
// );

//   return rows;
// };


exports.getUnReadNotifications = async (user_id) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `
    SELECT 
      n.*, 
      m.status AS mission_status,
      mav.status AS volunteer_mission_status,
      CASE WHEN n2.id IS NOT NULL THEN 1 ELSE 0 END AS group_requested_completion,
      vga.status AS group_application_status
    FROM notifications n
    LEFT JOIN missions m 
      ON CAST(
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.mission_id')),
          JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.missionId'))
        ) AS UNSIGNED
      ) = m.id
    LEFT JOIN mission_assigned_volunteers mav
      ON mav.mission_id = m.id 
      AND mav.volunteer_id = CASE 
        WHEN JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteer_id')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteer_id')) != 'null'
        THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteer_id')) AS UNSIGNED)
        WHEN JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteerId')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteerId')) != 'null'
        THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteerId')) AS UNSIGNED)
        ELSE n.receiver_id
      END
    LEFT JOIN notifications n2
      ON n2.type = 'mission_completion_request'
      AND n2.sender_id = n.receiver_id
      AND CAST(
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(n2.meta, '$.mission_id')),
          JSON_UNQUOTE(JSON_EXTRACT(n2.meta, '$.missionId'))
        ) AS UNSIGNED
      ) = m.id
    LEFT JOIN volunteer_group_applications vga
      ON vga.mission_id = m.id 
      AND vga.group_id = n.sender_id
    WHERE 
      n.receiver_id = ?
      AND n.status = 'unread'
      AND (
        COALESCE(
          JSON_EXTRACT(n.meta, '$.mission_id'),
          JSON_EXTRACT(n.meta, '$.missionId')
        ) IS NULL
        OR (m.id IS NOT NULL AND m.status != 'expired')
      )
    ORDER BY n.created_at DESC
    `,
    [user_id]
  );

  return rows;
};

// Before grp work above is new 
// exports.getUnReadNotifications = async (user_id) => {
//   const pool = await connectDB();
//   const [rows] = await pool.query(
//     `
//     SELECT 
//       n.*, 
//       m.status AS mission_status,
//       mav.status AS volunteer_mission_status
//     FROM notifications n
//     LEFT JOIN missions m 
//       ON CAST(
//         COALESCE(
//           JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.mission_id')),
//           JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.missionId'))
//         ) AS UNSIGNED
//       ) = m.id
//     LEFT JOIN mission_assigned_volunteers mav
//       ON mav.mission_id = m.id 
//       AND mav.volunteer_id = CASE 
//         WHEN JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteer_id')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteer_id')) != 'null'
//         THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteer_id')) AS UNSIGNED)
//         WHEN JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteerId')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteerId')) != 'null'
//         THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.volunteerId')) AS UNSIGNED)
//         ELSE n.receiver_id
//       END
//     WHERE 
//       n.receiver_id = ?
//       AND n.status = 'unread'
//       AND (
//         COALESCE(
//           JSON_EXTRACT(n.meta, '$.mission_id'),
//           JSON_EXTRACT(n.meta, '$.missionId')
//         ) IS NULL
//         OR (m.id IS NOT NULL AND m.status != 'expired')
//       )
//     ORDER BY n.created_at DESC
//     `,
//     [user_id]
//   );

//   return rows;
// };


// Previous 22 July
// exports.getUnReadNotifications = async (user_id) => {
//   const pool = await connectDB();
//   const [rows] = await pool.query(
//     `
//     SELECT 
//       n.*, 
//       m.status AS mission_status
//     FROM notifications n
//     LEFT JOIN missions m 
//       ON CAST(
//         COALESCE(
//           JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.mission_id')),
//           JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.missionId'))
//         ) AS UNSIGNED
//       ) = m.id
//     WHERE 
//       n.receiver_id = ?
//       AND n.status = 'unread'
//       AND (
//         COALESCE(
//           JSON_EXTRACT(n.meta, '$.mission_id'),
//           JSON_EXTRACT(n.meta, '$.missionId')
//         ) IS NULL
//         OR (m.id IS NOT NULL AND m.status != 'expired')
//       )
//     ORDER BY n.created_at DESC
//     `,
//     [user_id]
//   );

//   return rows;
// };

// Get total count for pagination
exports.getUserNotificationsCount = async (user_id) => {
  const pool = await connectDB();
   const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM notifications n
    LEFT JOIN missions m 
      ON JSON_UNQUOTE(JSON_EXTRACT(n.meta, '$.mission_id')) = m.id
    WHERE n.receiver_id = ?
      AND (m.id IS NULL OR m.status != 'expired')
    `,
    [user_id]
  );
  // const [rows] = await pool.query(
  //   "SELECT COUNT(*) AS total FROM notifications WHERE receiver_id = ?",
  //   [user_id]
  // );
  return rows[0].total;
};


exports.markAllAsRead = async (user_id) => {
  const pool = await connectDB();
  await pool.query(
    `UPDATE notifications 
     SET status = 'read' 
     WHERE receiver_id = ? AND status = 'unread'`,
    [user_id]
  );
};

exports.allNotifications = async (limit, offset) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `SELECT * FROM notifications 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
};

exports.allNotificationsCount = async () => {
  const pool = await connectDB();
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM notifications");
  return rows[0].total;
};

exports.deleteNotificationByMeta = async (
  { sender_id, receiver_id, type, mission_id },
  connection = null
) => {
  try {
    const db = connection || (await connectDB());

    const mId = Number(mission_id);

    console.log("Delete Notification Params:", {
      sender_id,
      receiver_id,
      type,
      mission_id: mId,
    });

    const [result] = await db.query(
      `DELETE FROM notifications
       WHERE sender_id = ?
         AND receiver_id = ?
         AND type = ?
         AND (
           CAST(JSON_UNQUOTE(JSON_EXTRACT(meta, '$.mission_id')) AS UNSIGNED) = ?
           OR CAST(JSON_UNQUOTE(JSON_EXTRACT(meta, '$.missionId')) AS UNSIGNED) = ?
         )`,
      [sender_id, receiver_id, type, mId, mId]
    );

    return result.affectedRows;
  } catch (error) {
    console.error("deleteNotificationByMeta error:", error);
    throw error;
  }
};

// exports.deleteNotificationByMeta = async ({ sender_id, receiver_id, type, mission_id }, connection = null) => {
//   const db = connection || (await connectDB());
//   const mId = Number(mission_id);
  
//   await db.query(
//     `DELETE FROM notifications 
//      WHERE sender_id = ? 
//        AND receiver_id = ? 
//        AND type = ? 
//        AND (
//          JSON_EXTRACT(meta, '$.mission_id') = ? 
//          OR JSON_EXTRACT(meta, '$.missionId') = ?
//          OR JSON_UNQUOTE(JSON_EXTRACT(meta, '$.mission_id')) = ? 
//          OR JSON_UNQUOTE(JSON_EXTRACT(meta, '$.missionId')) = ?
//          OR meta LIKE ?
//          OR meta LIKE ?
//        )`,
//     [
//       sender_id, 
//       receiver_id, 
//       type, 
//       mId, 
//       mId, 
//       mId.toString(), 
//       mId.toString(),
//       `%"mission_id":${mId}%`,
//       `%"missionId":${mId}%`
//     ]
//   );
// };