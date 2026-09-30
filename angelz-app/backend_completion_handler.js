/**
 * Backend Controller / Route Handler for Volunteer Completion Request
 * Endpoint: POST /api/volunteer/completion-request
 * 
 * Requirements implemented:
 * 1. Updates `mission_assigned_volunteers` status column to 'completed' for the volunteer & mission.
 * 2. Fetches Volunteer Name, Mission Name, Organization ID, and Volunteer Group ID.
 * 3. Sends notification to Organization:
 *    "Volunteer [Name of Volunteer] has completed mission [Name of Mission]."
 * 4. Sends notification to Volunteer Group (if assigned by a group):
 *    "Volunteer [Name of Volunteer] has completed mission [Name of Mission]."
 */

// Example Express / Node.js Backend Implementation
export async function handleVolunteerCompletionRequest(req, res) {
  try {
    const { mission_id, volunteer_id: reqVolunteerId } = req.body;
    const volunteer_id = reqVolunteerId || req.user.id; // logged in volunteer ID

    if (!mission_id) {
      return res.status(400).json({ success: false, message: "Mission ID is required." });
    }

    // 1. Update status in mission_assigned_volunteers table to 'completed'
    await db.query(
      `UPDATE mission_assigned_volunteers 
       SET status = 'completed' 
       WHERE mission_id = ? AND volunteer_id = ?`,
      [mission_id, volunteer_id]
    );

    // 2. Fetch details for notification: Volunteer Name, Mission Name, Organization ID, Volunteer Group ID
    const [rows] = await db.query(
      `SELECT 
         m.id AS mission_id, 
         m.name AS mission_name, 
         m.organization_id, 
         v.id AS volunteer_id, 
         v.name AS volunteer_name,
         mav.volunteer_group_id
       FROM missions m
       JOIN users v ON v.id = ?
       LEFT JOIN mission_assigned_volunteers mav ON mav.mission_id = m.id AND mav.volunteer_id = v.id
       WHERE m.id = ?`,
      [volunteer_id, mission_id]
    );

    const detail = rows[0];
    if (!detail) {
      return res.status(404).json({ success: false, message: "Mission or volunteer details not found." });
    }

    const notificationMessage = `Volunteer ${detail.volunteer_name} has completed mission ${detail.mission_name}.`;

    const notificationMeta = JSON.stringify({
      mission_id: detail.mission_id,
      missionId: detail.mission_id,
      mission_name: detail.mission_name,
      volunteer_id: detail.volunteer_id,
      volunteer_name: detail.volunteer_name
    });

    // 3. Send Notification to Organization
    if (detail.organization_id) {
      await db.query(
        `INSERT INTO notifications (user_id, sender_id, type, message, meta, mission_status, status, created_at)
         VALUES (?, ?, 'mission_completion_request', ?, ?, 'completion_requested', 'unread', NOW())`,
        [detail.organization_id, volunteer_id, notificationMessage, notificationMeta]
      );
    }

    // 4. Send Notification to Volunteer Group (if assigned via group)
    if (detail.volunteer_group_id) {
      await db.query(
        `INSERT INTO notifications (user_id, sender_id, type, message, meta, mission_status, status, created_at)
         VALUES (?, ?, 'volunteer_mission_completed', ?, ?, 'completed', 'unread', NOW())`,
        [detail.volunteer_group_id, volunteer_id, notificationMessage, notificationMeta]
      );
    }

    return res.status(200).json({
      success: true,
      message: "Completion request submitted and notifications sent successfully!",
      data: {
        mission_id: detail.mission_id,
        volunteer_id: detail.volunteer_id,
        status: "completed"
      }
    });

  } catch (error) {
    console.error("Error in handleVolunteerCompletionRequest:", error);
    return res.status(500).json({ success: false, message: "Server error handling completion request." });
  }
}
