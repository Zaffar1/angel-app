const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const connectDB = require('../config/db');
const { sendInvitationEmail } = require('./emailService');
const notificationModel = require('../models/notificationModel');
const { notifyUser } = require('./socket');
const missionModel = require('../models/Mission');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Sign a JWT token for a user.
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, type: user.type, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Generate a random temporary password (12 chars, URL-safe).
 */
function generateTempPassword() {
  return crypto.randomBytes(9).toString('base64url');
}

// ─── Register Volunteer Group ────────────────────────────────────────────────

exports.registerGroup = async (data) => {
  const pool = await connectDB();

  // Check email uniqueness
  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ?',
    [data.email]
  );
  if (existing.length > 0) {
    const err = new Error('Email is already registered');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const [result] = await pool.query(
    `INSERT INTO users (name, email, password, type, role, contact_no, description, city, state, country, status)
     VALUES (?, ?, ?, 'volunteer_group', 'VOLUNTEER_GROUP', ?, ?, ?, ?, ?, 'ACTIVE')`,
    [
      data.name,
      data.email,
      hashedPassword,
      data.contact_no || null,
      data.description || null,
      data.city || null,
      data.state || null,
      data.country || null,
    ]
  );

  const [rows] = await pool.query(
    'SELECT id, name, email, type, role, contact_no, description, city, state, country, status FROM users WHERE id = ?',
    [result.insertId]
  );

  const user = rows[0];
  const token = signToken(user);

  return { user, token };
};

// ─── Login Volunteer Group ────────────────────────────────────────────────────

exports.loginGroup = async (email, password) => {
  const pool = await connectDB();

  const [rows] = await pool.query(
    'SELECT id, name, email, password, type, role, status FROM users WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    const err = new Error('Email not found');
    err.statusCode = 404;
    throw err;
  }

  const user = rows[0];

  if (user.type !== 'volunteer_group') {
    const err = new Error('This account is not a Volunteer Group');
    err.statusCode = 403;
    throw err;
  }

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) {
    const err = new Error('Invalid password');
    err.statusCode = 401;
    throw err;
  }

  const { password: _, ...userSafe } = user;
  const token = signToken(userSafe);

  return { token, user: userSafe };
};

// ─── Invite Volunteer ─────────────────────────────────────────────────────────

exports.inviteVolunteer = async (groupUserId, data) => {
  const pool = await connectDB();

  // Check email uniqueness
  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ?',
    [data.email]
  );
  if (existing.length > 0) {
    const err = new Error('A user with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const [result] = await pool.query(
    `INSERT INTO users (name, email, password, type, role, contact_no, description, invitedBy, status)
     VALUES (?, ?, ?, 'volunteer', 'VOLUNTEER', ?, ?, ?, 'ACTIVE')`,
    [
      data.name,
      data.email,
      hashedPassword,
      data.contact_no || null,
      data.description || null,
      groupUserId,
    ]
  );

  const volunteerId = result.insertId;

  // Send invitation email
  const loginUrl = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/login`
    : 'http://localhost:5173/login';

  let emailStatus = 'sent';
  let emailError = null;
  try {
    await sendInvitationEmail(data.email, data.name, tempPassword, loginUrl);
  } catch (emailErr) {
    console.error('⚠️  Invitation email failed:', emailErr);
    emailStatus = 'failed';
    emailError = emailErr.message;
  }

  return {
    id: volunteerId,
    name: data.name,
    email: data.email,
    type: 'volunteer',
    role: 'VOLUNTEER',
    invitedBy: groupUserId,
    emailStatus,
    emailError,
  };
};

// ─── Get Volunteers (for a group, or all if admin) ────────────────────────────

exports.getVolunteers = async (requesterId, requesterType) => {
  const pool = await connectDB();

  let rows;
  if (requesterType === 'admin' || requesterType === 'ADMIN') {
    // Admins see all volunteers
    [rows] = await pool.query(
      `SELECT id, name, email, type, role, contact_no, description, city, state, country, status, invitedBy, created_at
       FROM users
       WHERE type = 'volunteer'
       ORDER BY created_at DESC`
    );
  } else {
    // Volunteer groups see only their own invited volunteers
    [rows] = await pool.query(
      `SELECT id, name, email, type, role, contact_no, description, city, state, country, status, invitedBy, created_at
       FROM users
       WHERE type = 'volunteer' AND invitedBy = ?
       ORDER BY created_at DESC`,
      [requesterId]
    );
  }

  for (let row of rows) {
    const [missions] = await pool.query(
      `SELECT m.id, m.name, m.status
       FROM mission_assigned_volunteers mav
       JOIN missions m ON m.id = mav.mission_id
       WHERE mav.volunteer_id = ?`,
      [row.id]
    );
    row.missions = missions;
  }


  return rows;
};

// ─── Get Volunteer By ID ──────────────────────────────────────────────────────


exports.getVolunteerById = async (volunteerId, requesterId, requesterType) => {
  const pool = await connectDB();

  const [rows] = await pool.query(
    `SELECT id, name, email, type, role, contact_no, description, city, state, country, status, invitedBy, points, image, created_at
     FROM users
     WHERE id = ? AND type = 'volunteer'`,
    [volunteerId]
  );

  if (rows.length === 0) {
    const err = new Error('Volunteer not found');
    err.statusCode = 404;
    throw err;
  }

  const volunteer = rows[0];

  // Fetch assigned missions for this volunteer
  const [missions] = await pool.query(
    `SELECT m.id, m.name, m.status, mav.status AS assigned_status, m.points
     FROM mission_assigned_volunteers mav
     JOIN missions m ON m.id = mav.mission_id
     WHERE mav.volunteer_id = ?`,
    [volunteer.id]
  );
  volunteer.missions = missions;

  // Access check: admin always allowed; group allowed only if they invited this volunteer
  const isAdmin = requesterType === 'admin' || requesterType === 'ADMIN';
  const invitedBy = volunteer.invitedBy !== undefined ? volunteer.invitedBy : volunteer.invitedby;
  if (!isAdmin && invitedBy !== requesterId) {
    const err = new Error('Access denied. This volunteer was not invited by your group.');
    err.statusCode = 403;
    throw err;
  }

  return volunteer;
};

// Previous 22 July 

// exports.getVolunteerById = async (volunteerId, requesterId, requesterType) => {
//   const pool = await connectDB();

//   const [rows] = await pool.query(
//     `SELECT id, name, email, type, role, contact_no, description, city, state, country, status, invitedBy, created_at
//      FROM users
//      WHERE id = ? AND type = 'volunteer'`,
//     [volunteerId]
//   );

//   if (rows.length === 0) {
//     const err = new Error('Volunteer not found');
//     err.statusCode = 404;
//     throw err;
//   }

//   const volunteer = rows[0];

//   // Access check: admin always allowed; group allowed only if they invited this volunteer
//   const isAdmin = requesterType === 'admin' || requesterType === 'ADMIN';
//   if (!isAdmin && volunteer.invitedBy !== requesterId) {
//     const err = new Error('Access denied. This volunteer was not invited by your group.');
//     err.statusCode = 403;
//     throw err;
//   }

//   return volunteer;
// };

// ─── Update Volunteer ─────────────────────────────────────────────────────────

exports.updateVolunteer = async (volunteerId, requesterId, requesterType, data) => {
  const pool = await connectDB();

  // Verify existence and ownership first
  await exports.getVolunteerById(volunteerId, requesterId, requesterType);

  const allowedFields = ['name', 'contact_no', 'description', 'city', 'state', 'country'];
  const updates = [];
  const values = [];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (updates.length === 0) {
    return { message: 'No fields to update' };
  }

  values.push(volunteerId);
  await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  return { message: 'Volunteer updated successfully' };
};

// ─── Delete Volunteer ─────────────────────────────────────────────────────────

exports.deleteVolunteer = async (volunteerId, requesterId, requesterType) => {
  const pool = await connectDB();

  // Verify existence and ownership first
  await exports.getVolunteerById(volunteerId, requesterId, requesterType);

  await pool.query('DELETE FROM users WHERE id = ?', [volunteerId]);

  return { message: 'Volunteer deleted successfully' };
};

// ─── Assign Volunteers to a Mission ──────────────────────────────────────────

exports.assignVolunteersToMission = async (groupUserId, missionId, volunteerIds) => {
  const pool = await connectDB();

  // Fetch the volunteer group's name
  const [[group]] = await pool.query(
    'SELECT id, name FROM users WHERE id = ?',
    [groupUserId]
  );
  const groupName = group ? group.name : 'Volunteer Group';

  // 1. Verify mission exists
  const [[mission]] = await pool.query(
    `SELECT m.id, m.name, m.organization_id, m.status, m.volunteer_required,
            u.id AS org_user_id, u.name AS org_name
     FROM missions m
     JOIN organizations o ON o.id = m.organization_id
     JOIN users u ON u.id = o.user_id
     WHERE m.id = ?`,
    [missionId]
  );
  if (!mission) {
    const err = new Error('Mission not found');
    err.statusCode = 404;
    throw err;
  }

  // Check volunteer limit (volunteer_required in missions table)
  const [[{ current_assigned_count }]] = await pool.query(
    `SELECT COUNT(*) AS current_assigned_count 
     FROM mission_assigned_volunteers mav
     LEFT JOIN volunteer_group_applications vga 
       ON vga.mission_id = mav.mission_id 
       AND vga.group_id = mav.assigned_by
     WHERE mav.mission_id = ? 
       AND (mav.assigned_by IS NULL OR vga.status = 'accepted')`,
    [missionId]
  );

  const max_allowed_to_assign = Math.max(0, Number(mission.volunteer_required || 0) - Number(current_assigned_count || 0));

  if (volunteerIds.length !== max_allowed_to_assign) {
    const err = new Error(
      `You must select exactly ${max_allowed_to_assign} volunteer(s) to fulfill this mission's requirements (Currently Assigned: ${current_assigned_count}, Required: ${mission.volunteer_required}).`
    );
    err.statusCode = 400;
    throw err;
  }

  // 2. Only allow assignment when mission is 'open'
  if (mission.status !== 'open') {
    const statusMessages = {
      process: 'This mission is already in progress and cannot accept new assignments.',
      scheduled: 'This mission is scheduled to start and cannot accept new assignments.',
      completed: 'This mission has already been completed.',
      expired: 'This mission has expired and is no longer accepting assignments.',
      cancelled: 'This mission has been cancelled.',
    };
    const msg = statusMessages[mission.status]
      || `This mission cannot be assigned to (current status: "${mission.status}").`;
    const err = new Error(msg);
    err.statusCode = 400;
    throw err;
  }

  const assigned = [];
  const skipped = [];

  for (const volunteerId of volunteerIds) {
    // 2. Verify volunteer belongs to this group
    const [[volunteer]] = await pool.query(
      'SELECT id, name, email, invitedBy AS invitedBy, invitedBy AS invitedby FROM users WHERE id = ? AND type = \'volunteer\'',
      [volunteerId]
    );

    if (!volunteer) {
      skipped.push({ volunteerId, reason: 'Volunteer not found' });
      continue;
    }

    const invitedBy = volunteer.invitedBy !== undefined ? volunteer.invitedBy : volunteer.invitedby;
    if (Number(invitedBy) !== Number(groupUserId)) {
      skipped.push({ volunteerId, reason: 'This volunteer is not a member of your group.' });
      continue;
    }

    // 3a. Skip if already fully assigned to this mission
    const [alreadyAssigned] = await pool.query(
      'SELECT id FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?',
      [missionId, volunteerId]
    );
    if (alreadyAssigned.length > 0) {
      skipped.push({
        volunteerId,
        name: volunteer.name,
        reason: `${volunteer.name} is already assigned to the mission "${mission.name}". No action was taken.`,
      });
      continue;
    }

    // 3b. Remove from pending if exists (cleanup)
    await pool.query(
      'DELETE FROM mission_pending_requests WHERE mission_id = ? AND volunteer_id = ?',
      [missionId, volunteerId]
    );

    // 4. Assign volunteer with group_pending status
    await missionModel.assignVolunteer(missionId, volunteerId, groupUserId, 'group_pending');

    assigned.push({ volunteerId, name: volunteer.name, email: volunteer.email });
  }

  // Create volunteer group application record and set mission status to pending
  if (assigned.length > 0) {
    await pool.query(
      `INSERT INTO volunteer_group_applications (group_id, mission_id, status)
       VALUES (?, ?, 'pending')
       ON DUPLICATE KEY UPDATE status = 'pending'`,
      [groupUserId, missionId]
    );

    await pool.query(
      "UPDATE missions SET status = 'open' WHERE id = ?",
      [missionId]
    );

    // Send single consolidated notification to organization / mission owner
    try {
      const orgNotif = await notificationModel.sendNotification({
        sender_id: groupUserId,
        receiver_id: mission.org_user_id,
        type: 'group_assigned_volunteer',
        message: `${groupName} has applied to join your mission '${mission.name}' with ${assigned.length} volunteers.`,
        meta: { mission_id: missionId, volunteer_id: groupUserId },
      });
      notifyUser(mission.org_user_id, orgNotif);
    } catch (notifErr) {
      console.error('⚠️  Org notification failed:', notifErr.message);
    }
  }

  return {
    mission_id: missionId,
    mission_name: mission.name,
    assigned,
    skipped,
  };
};

// before above date 25 july
// exports.assignVolunteersToMission = async (groupUserId, missionId, volunteerIds) => {
//   const pool = await connectDB();

//   // Fetch the volunteer group's name
//   const [[group]] = await pool.query(
//     'SELECT id, name FROM users WHERE id = ?',
//     [groupUserId]
//   );
//   const groupName = group ? group.name : 'Volunteer Group';

//   // 1. Verify mission exists
//   const [[mission]] = await pool.query(
//     `SELECT m.id, m.name, m.organization_id, m.status, m.volunteer_required,
//             u.id AS org_user_id, u.name AS org_name
//      FROM missions m
//      JOIN organizations o ON o.id = m.organization_id
//      JOIN users u ON u.id = o.user_id
//      WHERE m.id = ?`,
//     [missionId]
//   );
//   if (!mission) {
//     const err = new Error('Mission not found');
//     err.statusCode = 404;
//     throw err;
//   }

//   // Check volunteer limit (volunteer_required in missions table)
//   const [[{ current_assigned_count }]] = await pool.query(
//     "SELECT COUNT(*) AS current_assigned_count FROM mission_assigned_volunteers WHERE mission_id = ?",
//     [missionId]
//   );

//   const max_allowed_to_assign = Math.max(0, Number(mission.volunteer_required || 0) - Number(current_assigned_count || 0));

//   if (volunteerIds.length !== max_allowed_to_assign) {
//     const err = new Error(
//       `You must select exactly ${max_allowed_to_assign} volunteer(s) to fulfill this mission's requirements (Currently Assigned: ${current_assigned_count}, Required: ${mission.volunteer_required}).`
//     );
//     err.statusCode = 400;
//     throw err;
//   }

//   // 2. Only allow assignment when mission is 'open'
//   if (mission.status !== 'open') {
//     const statusMessages = {
//       process: 'This mission is already in progress and cannot accept new assignments.',
//       scheduled: 'This mission is scheduled to start and cannot accept new assignments.',
//       completed: 'This mission has already been completed.',
//       expired: 'This mission has expired and is no longer accepting assignments.',
//       cancelled: 'This mission has been cancelled.',
//     };
//     const msg = statusMessages[mission.status]
//       || `This mission cannot be assigned to (current status: "${mission.status}").`;
//     const err = new Error(msg);
//     err.statusCode = 400;
//     throw err;
//   }

//   const assigned = [];
//   const skipped = [];

//   for (const volunteerId of volunteerIds) {
//     // 2. Verify volunteer belongs to this group
//     const [[volunteer]] = await pool.query(
//       'SELECT id, name, email, invitedBy AS invitedBy, invitedBy AS invitedby FROM users WHERE id = ? AND type = \'volunteer\'',
//       [volunteerId]
//     );

//     if (!volunteer) {
//       skipped.push({ volunteerId, reason: 'Volunteer not found' });
//       continue;
//     }

//     const invitedBy = volunteer.invitedBy !== undefined ? volunteer.invitedBy : volunteer.invitedby;
//     if (Number(invitedBy) !== Number(groupUserId)) {
//       skipped.push({ volunteerId, reason: 'This volunteer is not a member of your group.' });
//       continue;
//     }

//     // 3a. Skip if already fully assigned to this mission
//     const [alreadyAssigned] = await pool.query(
//       'SELECT id FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?',
//       [missionId, volunteerId]
//     );
//     if (alreadyAssigned.length > 0) {
//       skipped.push({
//         volunteerId,
//         name: volunteer.name,
//         reason: `${volunteer.name} is already assigned to the mission "${mission.name}". No action was taken.`,
//       });
//       continue;
//     }

//     // 3b. Remove from pending if exists (cleanup)
//     await pool.query(
//       'DELETE FROM mission_pending_requests WHERE mission_id = ? AND volunteer_id = ?',
//       [missionId, volunteerId]
//     );

//     // 4. Assign volunteer with group_pending status
//     await missionModel.assignVolunteer(missionId, volunteerId, groupUserId, 'group_pending');

//     assigned.push({ volunteerId, name: volunteer.name, email: volunteer.email });
//   }

//   // Create volunteer group application record and set mission status to pending
//   if (assigned.length > 0) {
//     await pool.query(
//       `INSERT INTO volunteer_group_applications (group_id, mission_id, status)
//        VALUES (?, ?, 'pending')
//        ON DUPLICATE KEY UPDATE status = 'pending'`,
//       [groupUserId, missionId]
//     );

//     await pool.query(
//       "UPDATE missions SET status = 'open' WHERE id = ?",
//       [missionId]
//     );

//     // Send single consolidated notification to organization / mission owner
//     try {
//       const orgNotif = await notificationModel.sendNotification({
//         sender_id: groupUserId,
//         receiver_id: mission.org_user_id,
//         type: 'group_assigned_volunteer',
//         message: `${groupName} has applied to join your mission '${mission.name}' with ${assigned.length} volunteers.`,
//         meta: { mission_id: missionId, volunteer_id: groupUserId },
//       });
//       notifyUser(mission.org_user_id, orgNotif);
//     } catch (notifErr) {
//       console.error('⚠️  Org notification failed:', notifErr.message);
//     }
//   }

//   return {
//     mission_id: missionId,
//     mission_name: mission.name,
//     assigned,
//     skipped,
//   };
// };
// Before above code 24 july
// exports.assignVolunteersToMission = async (groupUserId, missionId, volunteerIds) => {
//   const pool = await connectDB();

//   // Fetch the volunteer group's name
//   const [[group]] = await pool.query(
//     'SELECT id, name FROM users WHERE id = ?',
//     [groupUserId]
//   );
//   const groupName = group ? group.name : 'Volunteer Group';

//   // 1. Verify mission exists
//   const [[mission]] = await pool.query(
//     `SELECT m.id, m.name, m.organization_id, m.status, m.volunteer_required,
//             u.id AS org_user_id, u.name AS org_name
//      FROM missions m
//      JOIN organizations o ON o.id = m.organization_id
//      JOIN users u ON u.id = o.user_id
//      WHERE m.id = ?`,
//     [missionId]
//   );
//   if (!mission) {
//     const err = new Error('Mission not found');
//     err.statusCode = 404;
//     throw err;
//   }

//   // Check volunteer limit (volunteer_required in missions table)
//   const [[{ current_assigned_count }]] = await pool.query(
//     "SELECT COUNT(*) AS current_assigned_count FROM mission_assigned_volunteers WHERE mission_id = ?",
//     [missionId]
//   );

//   const max_allowed_to_assign = Math.max(0, Number(mission.volunteer_required || 0) - Number(current_assigned_count || 0));

//   if (volunteerIds.length !== max_allowed_to_assign) {
//     const err = new Error(
//       `You must select exactly ${max_allowed_to_assign} volunteer(s) to fulfill this mission's requirements (Currently Assigned: ${current_assigned_count}, Required: ${mission.volunteer_required}).`
//     );
//     err.statusCode = 400;
//     throw err;
//   }

//   // 2. Only allow assignment when mission is 'open'
//   if (mission.status !== 'open') {
//     const statusMessages = {
//       process: 'This mission is already in progress and cannot accept new assignments.',
//       scheduled: 'This mission is scheduled to start and cannot accept new assignments.',
//       completed: 'This mission has already been completed.',
//       expired: 'This mission has expired and is no longer accepting assignments.',
//       cancelled: 'This mission has been cancelled.',
//     };
//     const msg = statusMessages[mission.status]
//       || `This mission cannot be assigned to (current status: "${mission.status}").`;
//     const err = new Error(msg);
//     err.statusCode = 400;
//     throw err;
//   }

//   const assigned = [];
//   const skipped = [];

//   for (const volunteerId of volunteerIds) {
//     // 2. Verify volunteer belongs to this group
//     const [[volunteer]] = await pool.query(
//       'SELECT id, name, email, invitedBy AS invitedBy, invitedBy AS invitedby FROM users WHERE id = ? AND type = \'volunteer\'',
//       [volunteerId]
//     );

//     if (!volunteer) {
//       skipped.push({ volunteerId, reason: 'Volunteer not found' });
//       continue;
//     }

//     const invitedBy = volunteer.invitedBy !== undefined ? volunteer.invitedBy : volunteer.invitedby;
//     if (Number(invitedBy) !== Number(groupUserId)) {
//       skipped.push({ volunteerId, reason: 'This volunteer is not a member of your group.' });
//       continue;
//     }

//     // 3a. Skip if already fully assigned to this mission
//     const [alreadyAssigned] = await pool.query(
//       'SELECT id FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?',
//       [missionId, volunteerId]
//     );
//     if (alreadyAssigned.length > 0) {
//       skipped.push({
//         volunteerId,
//         name: volunteer.name,
//         reason: `${volunteer.name} is already assigned to the mission "${mission.name}". No action was taken.`,
//       });
//       continue;
//     }

//     // 3b. Remove from pending if exists (cleanup)
//     await pool.query(
//       'DELETE FROM mission_pending_requests WHERE mission_id = ? AND volunteer_id = ?',
//       [missionId, volunteerId]
//     );

//     // 4. Direct assignment with groupUserId as assigned_by
//     await missionModel.assignVolunteer(missionId, volunteerId, groupUserId, 'pending');

//     // 5. Set mission status to 'process' (In Progress)
//     if (mission.status === 'open' || mission.status === 'scheduled') {
//       await pool.query(
//         "UPDATE missions SET status = 'process' WHERE id = ?",
//         [missionId]
//       );
//     }

//     // 6b. Notify the VOLUNTEER — they are assigned (same meta format as org-accept flow)
//     try {
//       const volNotif = await notificationModel.sendNotification({
//         sender_id: groupUserId,
//         receiver_id: volunteerId,
//         type: 'mission_accepted',
//         message: `You have been successfully assigned to the mission "${mission.name}" by ${groupName}. Your participation has been confirmed and the mission is now underway.`,
//         meta: { missionId },   // ← camelCase, matches existing mission_accepted notifications
//       });
//       notifyUser(volunteerId, volNotif);
//     } catch (notifErr) {
//       console.error('⚠️  Volunteer notification failed:', notifErr.message);
//     }

//     assigned.push({ volunteerId, name: volunteer.name, email: volunteer.email });
//   }

//   // Send single consolidated notification to organization / mission owner
//   if (assigned.length > 0) {
//     try {
//       const orgNotif = await notificationModel.sendNotification({
//         sender_id: groupUserId,
//         receiver_id: mission.org_user_id,
//         type: 'group_assigned_volunteer',
//         message: `${groupName} has assigned ${assigned.length} volunteers to your mission '${mission.name}'.`,
//         meta: { mission_id: missionId },
//       });
//       notifyUser(mission.org_user_id, orgNotif);
//     } catch (notifErr) {
//       console.error('⚠️  Org notification failed:', notifErr.message);
//     }
//   }

//   return {
//     mission_id: missionId,
//     mission_name: mission.name,
//     assigned,
//     skipped,
//   };
// };

// ─── Assign Volunteers to an Organization ────────────────────────────────────

exports.assignVolunteersToOrganization = async (groupUserId, organizationId, volunteerIds) => {
  const pool = await connectDB();

  // Fetch the volunteer group's name for use in notifications
  const [[group]] = await pool.query(
    'SELECT id, name FROM users WHERE id = ?',
    [groupUserId]
  );
  const groupName = group ? group.name : 'your volunteer group';

  // 1. Verify organization exists
  // organizationId may be either organizations.id or organizations.user_id
  // (the frontend uses user_id as the org identifier)
  const [[org]] = await pool.query(
    'SELECT id, user_id, company_name FROM organizations WHERE id = ? OR user_id = ? LIMIT 1',
    [organizationId, organizationId]
  );
  if (!org) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }

  const assigned = [];
  const skipped = [];

  for (const volunteerId of volunteerIds) {
    // 2. Verify volunteer belongs to this group
    const [[volunteer]] = await pool.query(
      'SELECT id, name, email, invitedBy AS invitedBy, invitedBy AS invitedby FROM users WHERE id = ? AND type = \'volunteer\'',
      [volunteerId]
    );

    if (!volunteer) {
      skipped.push({ volunteerId, reason: 'Volunteer not found' });
      continue;
    }

    const invitedBy = volunteer.invitedBy !== undefined ? volunteer.invitedBy : volunteer.invitedby;
    if (Number(invitedBy) !== Number(groupUserId)) {
      skipped.push({ volunteerId, reason: 'This volunteer is not a member of your group.' });
      continue;
    }

    // 3. Duplicate check (use org.id — the FK-referenced primary key)
    const [existing] = await pool.query(
      'SELECT id FROM organization_volunteers WHERE organization_id = ? AND user_id = ?',
      [org.id, volunteerId]
    );
    if (existing.length > 0) {
      skipped.push({
        volunteerId,
        name: volunteer.name,
        reason: `${volunteer.name} is already a member of "${org.company_name}". No action was taken.`,
      });
      continue;
    }

    // 4. Insert assignment (use org.id to satisfy FK constraint)
    await pool.query(
      'INSERT INTO organization_volunteers (organization_id, user_id, assigned_by, status) VALUES (?, ?, ?, \'accepted\')',
      [org.id, volunteerId, groupUserId]
    );

    // 5. Send notification to the volunteer
    try {
      const notif = await notificationModel.sendNotification({
        sender_id: groupUserId,
        receiver_id: volunteerId,
        type: 'org_assigned_by_group',
        message: `You have been successfully added to ${org.company_name} by ${groupName}. Welcome aboard — you can now participate in their missions and activities.`,
        meta: { organization_id: organizationId },
      });
      notifyUser(volunteerId, notif);
    } catch (notifErr) {
      console.error('⚠️  Notification failed for volunteer', volunteerId, notifErr.message);
    }

    assigned.push({ volunteerId, name: volunteer.name, email: volunteer.email });
  }

  // Send single consolidated notification to organization
  const orgUserId = org.user_id || org.userId;
  if (orgUserId && assigned.length > 0) {
    try {
      const orgNotif = await notificationModel.sendNotification({
        sender_id: groupUserId,
        receiver_id: orgUserId,
        type: 'group_assigned_organization',
        message: `${groupName} has assigned ${assigned.length} volunteers to your organization.`,
        meta: { organization_id: org.id },
      });
      notifyUser(orgUserId, orgNotif);
    } catch (notifErr) {
      console.error('⚠️  Notification failed for organization', orgUserId, notifErr.message);
    }
  }

  return {
    organization_id: organizationId,
    organization_name: org.company_name,
    assigned,
    skipped,
  };
};

// exports.assignVolunteersToMission = async (groupUserId, missionId, volunteerIds) => {
//   const pool = await connectDB();

//   // Fetch the volunteer group's name
//   const [[group]] = await pool.query(
//     'SELECT id, name FROM users WHERE id = ?',
//     [groupUserId]
//   );
//   const groupName = group ? group.name : 'Volunteer Group';

//   // 1. Verify mission exists
//   const [[mission]] = await pool.query(
//     `SELECT m.id, m.name, m.organization_id, m.status,
//             u.id AS org_user_id, u.name AS org_name
//      FROM missions m
//      JOIN organizations o ON o.id = m.organization_id
//      JOIN users u ON u.id = o.user_id
//      WHERE m.id = ?`,
//     [missionId]
//   );
//   if (!mission) {
//     const err = new Error('Mission not found');
//     err.statusCode = 404;
//     throw err;
//   }

//   // 2. Only allow assignment when mission is 'open'
//   if (mission.status !== 'open') {
//     const statusMessages = {
//       process:   'This mission is already in progress and cannot accept new assignments.',
//       scheduled: 'This mission is scheduled to start and cannot accept new assignments.',
//       completed: 'This mission has already been completed.',
//       expired:   'This mission has expired and is no longer accepting assignments.',
//       cancelled: 'This mission has been cancelled.',
//     };
//     const msg = statusMessages[mission.status]
//       || `This mission cannot be assigned to (current status: "${mission.status}").`;
//     const err = new Error(msg);
//     err.statusCode = 400;
//     throw err;
//   }

//   const assigned = [];
//   const skipped = [];

//   for (const volunteerId of volunteerIds) {
//     // 2. Verify volunteer belongs to this group
//     const [[volunteer]] = await pool.query(
//       'SELECT id, name, email, invitedBy FROM users WHERE id = ? AND type = \'volunteer\'',
//       [volunteerId]
//     );

//     if (!volunteer) {
//       skipped.push({ volunteerId, reason: 'Volunteer not found' });
//       continue;
//     }

//     if (Number(volunteer.invitedBy) !== Number(groupUserId)) {
//       skipped.push({ volunteerId, reason: 'This volunteer is not a member of your group.' });
//       continue;
//     }

//     // 3a. Skip if already fully assigned to this mission
//     const [alreadyAssigned] = await pool.query(
//       'SELECT id FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?',
//       [missionId, volunteerId]
//     );
//     if (alreadyAssigned.length > 0) {
//       skipped.push({
//         volunteerId,
//         name: volunteer.name,
//         reason: `${volunteer.name} is already assigned to the mission "${mission.name}". No action was taken.`,
//       });
//       continue;
//     }

//     // 3b. Remove from pending if exists (cleanup)
//     await pool.query(
//       'DELETE FROM mission_pending_requests WHERE mission_id = ? AND volunteer_id = ?',
//       [missionId, volunteerId]
//     );

//     // 4. Direct assignment using existing model method
//     await missionModel.assignVolunteer(missionId, volunteerId);

//     // 5. Set mission status to 'process' (In Progress)
//     if (mission.status === 'open' || mission.status === 'scheduled') {
//       await pool.query(
//         "UPDATE missions SET status = 'process' WHERE id = ?",
//         [missionId]
//       );
//     }

//     // 6a. Notify the ORGANIZATION — group assigned a volunteer
//     try {
//       const orgNotif = await notificationModel.sendNotification({
//         sender_id: groupUserId,
//         receiver_id: mission.org_user_id,
//         type: 'group_assigned_volunteer',
//         message: `${groupName} has assigned ${volunteer.name} to your mission "${mission.name}". The mission is now in process.`,
//         meta: { mission_id: missionId, volunteer_id: volunteerId },
//       });
//       notifyUser(mission.org_user_id, orgNotif);
//     } catch (notifErr) {
//       console.error('⚠️  Org notification failed:', notifErr.message);
//     }

//     // 6b. Notify the VOLUNTEER — they are assigned (same meta format as org-accept flow)
//     try {
//       const volNotif = await notificationModel.sendNotification({
//         sender_id: groupUserId,
//         receiver_id: volunteerId,
//         type: 'mission_accepted',
//         message: `You have been successfully assigned to the mission "${mission.name}" by ${groupName}. Your participation has been confirmed and the mission is now underway.`,
//         meta: { missionId },   // ← camelCase, matches existing mission_accepted notifications
//       });
//       notifyUser(volunteerId, volNotif);
//     } catch (notifErr) {
//       console.error('⚠️  Volunteer notification failed:', notifErr.message);
//     }

//     assigned.push({ volunteerId, name: volunteer.name, email: volunteer.email });
//   }

//   return {
//     mission_id: missionId,
//     mission_name: mission.name,
//     assigned,
//     skipped,
//   };
// };

// // ─── Assign Volunteers to an Organization ────────────────────────────────────

// exports.assignVolunteersToOrganization = async (groupUserId, organizationId, volunteerIds) => {
//   const pool = await connectDB();

//   // Fetch the volunteer group's name for use in notifications
//   const [[group]] = await pool.query(
//     'SELECT id, name FROM users WHERE id = ?',
//     [groupUserId]
//   );
//   const groupName = group ? group.name : 'your volunteer group';

//   // 1. Verify organization exists
//   // organizationId may be either organizations.id or organizations.user_id
//   // (the frontend uses user_id as the org identifier)
//   const [[org]] = await pool.query(
//     'SELECT id, user_id, company_name FROM organizations WHERE id = ? OR user_id = ? LIMIT 1',
//     [organizationId, organizationId]
//   );
//   if (!org) {
//     const err = new Error('Organization not found');
//     err.statusCode = 404;
//     throw err;
//   }

//   const assigned = [];
//   const skipped = [];

//   for (const volunteerId of volunteerIds) {
//     // 2. Verify volunteer belongs to this group
//     const [[volunteer]] = await pool.query(
//       'SELECT id, name, email, invitedBy AS invitedBy, invitedBy AS invitedby FROM users WHERE id = ? AND type = \'volunteer\'',
//       [volunteerId]
//     );

//     if (!volunteer) {
//       skipped.push({ volunteerId, reason: 'Volunteer not found' });
//       continue;
//     }

//     const invitedBy = volunteer.invitedBy !== undefined ? volunteer.invitedBy : volunteer.invitedby;
//     if (Number(invitedBy) !== Number(groupUserId)) {
//       skipped.push({ volunteerId, reason: 'This volunteer is not a member of your group.' });
//       continue;
//     }

//     // 3. Duplicate check (use org.id — the FK-referenced primary key)
//     const [existing] = await pool.query(
//       'SELECT id FROM organization_volunteers WHERE organization_id = ? AND user_id = ?',
//       [org.id, volunteerId]
//     );
//     if (existing.length > 0) {
//       skipped.push({
//         volunteerId,
//         name: volunteer.name,
//         reason: `${volunteer.name} is already a member of "${org.company_name}". No action was taken.`,
//       });
//       continue;
//     }

//     // 4. Insert assignment (use org.id to satisfy FK constraint)
//     await pool.query(
//       'INSERT INTO organization_volunteers (organization_id, user_id, assigned_by, status) VALUES (?, ?, ?, \'accepted\')',
//       [org.id, volunteerId, groupUserId]
//     );

//     // 5. Send notification to the volunteer
//     try {
//       const notif = await notificationModel.sendNotification({
//         sender_id: groupUserId,
//         receiver_id: volunteerId,
//         type: 'org_assigned_by_group',
//         message: `You have been successfully added to ${org.company_name} by ${groupName}. Welcome aboard — you can now participate in their missions and activities.`,
//         meta: { organization_id: organizationId },
//       });
//       notifyUser(volunteerId, notif);
//     } catch (notifErr) {
//       console.error('⚠️  Notification failed for volunteer', volunteerId, notifErr.message);
//     }

//     // 5b. Send notification to the organization
//     const orgUserId = org.user_id || org.userId;
//     if (orgUserId) {
//       try {
//         const orgNotif = await notificationModel.sendNotification({
//           sender_id: groupUserId,
//           receiver_id: orgUserId,
//           type: 'group_assigned_organization',
//           message: `${groupName} has assigned volunteer ${volunteer.name} to your organization.`,
//           meta: { organization_id: org.id, volunteer_id: volunteerId },
//         });
//         notifyUser(orgUserId, orgNotif);
//       } catch (notifErr) {
//         console.error('⚠️  Notification failed for organization', orgUserId, notifErr.message);
//       }
//     }

//     assigned.push({ volunteerId, name: volunteer.name, email: volunteer.email });
//   }

//   return {
//     organization_id: organizationId,
//     organization_name: org.company_name,
//     assigned,
//     skipped,
//   };
// };


exports.updateMissionStatus = async (groupUserId, { mission_id, volunteer_id, status = 'completed' }) => {
  const pool = await connectDB();

  // 1. Update status in mission_assigned_volunteers
  if (volunteer_id) {
    await pool.query(
      "UPDATE mission_assigned_volunteers SET status = ? WHERE mission_id = ? AND volunteer_id = ?",
      [status, mission_id, volunteer_id]
    );
  } else {
    await pool.query(
      "UPDATE mission_assigned_volunteers SET status = ? WHERE mission_id = ? AND assigned_by = ?",
      [status, mission_id, groupUserId]
    );
  }

  // 2. Set overall mission status to completion_requested
  await missionModel.updateStatus(mission_id, 'completion_requested');

  // 3. Fetch Organization user, Volunteer Group name, and Mission details
  const organizationUser = await missionModel.findMissionCreatorUser(mission_id);
  const mission = await missionModel.findById(mission_id);
  const [[groupUser]] = await pool.query(
    "SELECT name FROM users WHERE id = ?",
    [groupUserId]
  );
  const groupName = (groupUser && groupUser.name) || 'A Volunteer Group';

  let volunteerName = 'A volunteer';
  if (volunteer_id) {
    const [[vol]] = await pool.query("SELECT name FROM users WHERE id = ?", [volunteer_id]);
    if (vol && vol.name) volunteerName = vol.name.trim();
  }

  if (organizationUser && organizationUser.id && mission) {
    const notificationMessage = `Volunteer Group ${groupName} has completed your mission "${mission.name}".`;

    try {
      const orgNotif = await notificationModel.sendNotification({
        sender_id: groupUserId,
        receiver_id: organizationUser.id,
        type: "mission_completion_request",
        message: notificationMessage,
        meta: {
          mission_id: Number(mission_id),
          missionId: Number(mission_id),
          volunteer_id: volunteer_id ? Number(volunteer_id) : undefined,
          mission_name: mission.name,
          volunteer_name: volunteerName,
          group_name: groupName
        },
        mission_status: "completion_requested"
      });
      notifyUser(organizationUser.id, orgNotif);
    } catch (notifErr) {
      console.error("⚠️ Failed to send notification to Organization:", notifErr.message);
    }
  }

  return { mission_id, volunteer_id, status: 'completion_requested' };
};

