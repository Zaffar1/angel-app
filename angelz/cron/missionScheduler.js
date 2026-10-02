const cron = require("node-cron");
const connectDB = require("../config/db");
const notificationModel = require("../models/notificationModel");
const { notifyUser } = require("../services/socket");
const { getCurrentLocalTimeString } = require("../utils/datetime");

module.exports.start = () => {
  console.log("Mission scheduler started...");

  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const pool = await connectDB();
      const currentLocalTime = getCurrentLocalTimeString();

      // Find missions that should start now (scheduled start_time has arrived)
      const [missions] = await pool.query(`
        SELECT id, name 
        FROM missions 
        WHERE status = 'scheduled' 
          AND start_time <= ?
      `, [currentLocalTime]);

      if (!missions.length) {
        console.log("No missions ready to start.");
        return;
      }

      for (const mission of missions) {
        // Update status
        await pool.query(
          `UPDATE missions SET status = 'process', notify = 1, notify_status = 1 WHERE id = ?`,
          [mission.id]
        );
        // await pool.query(
        //   `UPDATE missions SET status = 'inprogress' WHERE id = ?`,
        //   [mission.id]
        // );

        // Get assigned volunteer
        const [[volunteer]] = await pool.query(
          `SELECT volunteer_id FROM mission_assigned_volunteers WHERE mission_id = ?`,
          [mission.id]
        );
        if (!volunteer) continue;

        // Get volunteer's name
        const [[user]] = await pool.query(
          `SELECT name FROM users WHERE id = ?`,
          [volunteer.volunteer_id]
        );

        // Get organization user_id
        const [[orgData]] = await pool.query(
          `SELECT o.user_id 
           FROM missions m
           JOIN organizations o ON o.id = m.organization_id
           WHERE m.id = ?`,
          [mission.id]
        );
        if (!orgData) continue;

        // Send notifications
        const notiVolunteer = await notificationModel.sendNotification({
          sender_id: orgData.user_id,
          receiver_id: volunteer.volunteer_id,
          type: "mission_scheduled",
          message: `You can start your mission '${mission.name}' now!`,
          meta: { missionId: mission.id },
        });

        // const notiOrg = await notificationModel.sendNotification({
        //   sender_id: volunteer.volunteer_id,
        //   receiver_id: orgData.user_id,
        //   type: "mission_started",
        //   message: `"${user.name}" has started mission '${mission.name}'.`,
        //   meta: { missionId: mission.id },
        // });

        // Emit real-time socket events
        notifyUser(volunteer.volunteer_id, notiVolunteer);
        // notifyUser(orgData.user_id, notiOrg);

        console.log(`🚀 Mission '${mission.name}' started & notifications sent.`);
      }
    } catch (err) {
      console.error("❌ Error in mission scheduler:", err);
    }
  });
};



// const cron = require("node-cron");
// const connectDB = require("../config/db");
// const notificationModel = require("../models/notificationModel");
// const { notifyUser } = require("../services/socket");

// module.exports.start = () => {
//   console.log("Mission scheduler started...");

//   // Run every minute — adjust if needed
//   cron.schedule("* * * * *", async () => {
//     console.log("Checking for missions to start...");

//     try {
//       const pool = await connectDB();

//       // Find missions that should start now
//       const [missions] = await pool.query(`
//         SELECT id, name 
//         FROM missions 
//         WHERE status = 'scheduled' 
//         AND start_time <= NOW()
//       `);

//       for (const mission of missions) {
//         // Update status
//         await pool.query(
//           `UPDATE missions SET status = 'inprogress' WHERE id = ?`,
//           [mission.id]
//         );

//         // Get volunteer and org
//         const [[volunteer]] = await pool.query(
//           `SELECT volunteer_id FROM mission_assigned_volunteers WHERE mission_id = ?`,
//           [mission.id]
//         );

//         const [[user]] = await pool.query(
//           `SELECT name FROM users WHERE id = ?`,
//           [volunteer.id]
//         );

//         const [[organization]] = await pool.query(
//           `SELECT organization_id FROM missions WHERE id = ?`,
//           [mission.id]
//         );

//         const [[organizationId]] = await pool.query(
//           `SELECT user_id FROM organizations WHERE id = ?`,
//           [organization.organization_id]
//         );
//         // Send notifications
//         const notiVolunteer = await notificationModel.sendNotification({
//           sender_id: organizationId.user_id,
//           receiver_id: volunteer.volunteer_id,
//           type: "mission_started",
//           message: `Your mission '${mission.name}' has started!`,
//           meta: { missionId: mission.id },
//         });

//         const notiOrg = await notificationModel.sendNotification({
//           sender_id: volunteer.volunteer_id,
//           receiver_id: organizationId.user_id,
//           type: "mission_started",
//           message: `"${user.name}" has started mission '${mission.name}'.`,
//           meta: { missionId: mission.id },
//         });

//         // Emit real-time socket events
//         notifyUser(volunteer.volunteer_id, notiVolunteer);
//         notifyUser(organization.user_id, notiOrg);
//       }
//     } catch (err) {
//       console.error("Error in mission scheduler:", err);
//     }
//   });
// };
