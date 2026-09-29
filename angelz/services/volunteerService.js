const AppError = require("../utils/AppError");
const connectDB = require('../config/db');
const missionRequestModel = require("../models/Mission");
const notificationModel = require("../models/notificationModel");
const { notifyUser } = require("../services/socket");
const Leaderboard = require("../models/volunteerModel");
const userModel = require('../models/userModel');
// const crypto = require('crypto');
const model = require('../models/VolunteerInviteModel');
// const sendInviteEmail = require('../config/mailer');
const volunteerModel = require('../models/volunteerModel');

exports.getAllVolunteers = async (
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "desc"
) => {
  const offset = (page - 1) * limit;

  const [volunteers, totalVolunteers] = await Promise.all([
    Leaderboard.getVolunteers(limit, offset, sortBy, sortOrder),
    Leaderboard.countVolunteers(),
  ]);

  const totalPages = Math.ceil(totalVolunteers / limit);

  return {
    volunteers,
    totalVolunteers,
    totalPages,
    currentPage: page,
  };
};

// exports.getAllVolunteers = async (page = 1, limit = 10) => {
//   const offset = (page - 1) * limit;

//   const [volunteers, totalVolunteers] = await Promise.all([
//     Leaderboard.getVolunteers(limit, offset),
//     Leaderboard.countVolunteers(),
//   ]);

//   const totalPages = Math.ceil(totalVolunteers / limit);

//   return {
//     volunteers,
//     totalVolunteers,
//     totalPages,
//     currentPage: page,
//   };
// };

exports.requestMission = async ({ mission_id, volunteer_id }) => {
  const mission = await missionRequestModel.findById(mission_id);
  if (!mission) throw new AppError("Mission not found", 404);

  const pending = await missionRequestModel.findPendingRequest(mission_id, volunteer_id);
  if (pending) throw new AppError("You already requested this mission", 409);

  const assigned = await missionRequestModel.findAssignedVolunteer(mission_id, volunteer_id);
  if (assigned) throw new AppError("You are already assigned to this mission", 409);

  await missionRequestModel.addPendingRequest(mission_id, volunteer_id);
  const volunteer = await missionRequestModel.findVolunteer(volunteer_id);
  const organizationUser = await missionRequestModel.findMissionCreatorUser(mission_id);
  await missionRequestModel.updateStatus(mission_id, "pending");
  // await missionRequestModel.updateStatus(mission_id, "requested");

  const notification = await notificationModel.sendNotification({
    sender_id: volunteer_id,
    receiver_id: organizationUser.id,
    type: "mission_request",
    message: `${volunteer.name} has requested to join your mission.`,
    // message: "A volunteer has requested to join your mission.",
    meta: { mission_id }
  });

  // Real-time push
  notifyUser(organizationUser.id, notification);

  return { mission_id, volunteer_id, status: "requested" };
};

exports.getVolunteerData = async (volunteerId) => {
  const user = await userModel.getProfileById(volunteerId);
  if (!user || user.type !== "volunteer") throw new Error("Volunteer not found");

  const { password, ...userSafe } = user;

  const volDetails = await Leaderboard.volDetails(user.id);
  if (volDetails) {
    Object.assign(userSafe, volDetails);
  }

  return userSafe;
};


exports.requestMissionComplete = async ({ mission_id, volunteer_id }) => {
  const mission = await missionRequestModel.findById(mission_id);
  if (!mission) throw { statusCode: 404, message: "Mission not found." };

  const missionAssigned = await missionRequestModel.isVolunteerAssigned(mission_id, volunteer_id);
  if (!missionAssigned) {
    throw { statusCode: 403, message: "You are not assigned to this mission." };
  }

  // Fetch volunteer details
  const volunteer = await volunteerModel.findById(volunteer_id);
  if (!volunteer) {
    throw { type: "not_found", message: "Volunteer does not exist" };
  }
  const volunteerName = (volunteer.name && volunteer.name.trim()) || 'A volunteer';

  // 1. Query assigned_by group ID from mission_assigned_volunteers and fallback to volunteer.invitedBy
  const pool = await connectDB();
  const [[assignedRecord]] = await pool.query(
    "SELECT assigned_by FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?",
    [mission_id, volunteer_id]
  );
  const groupUserId = (assignedRecord && assignedRecord.assigned_by) || volunteer.invitedBy || volunteer.invitedby;

  // If assigned_by is NULL in DB, backfill it using groupUserId so DB is updated
  if (groupUserId && (!assignedRecord || !assignedRecord.assigned_by)) {
    await pool.query(
      "UPDATE mission_assigned_volunteers SET assigned_by = ? WHERE mission_id = ? AND volunteer_id = ?",
      [groupUserId, mission_id, volunteer_id]
    );
  }

  // 2. Update volunteer status in mission_assigned_volunteers to 'completed'
  await missionRequestModel.updateAssignedVolunteerStatus(mission_id, volunteer_id, 'completed');

  if (groupUserId) {
    const metaData = {
      mission_id: mission_id,
      missionId: mission_id,
      volunteer_id: volunteer_id,
      mission_name: mission.name,
      volunteer_name: volunteerName
    };
    try {
      const groupNotification = await notificationModel.sendNotification({
        sender_id: volunteer_id,
        receiver_id: groupUserId,
        type: "volunteer_mission_completed",
        message: `Your volunteer ${volunteerName} has completed the mission "${mission.name}".`,
        meta: metaData,
        mission_status: "completion_requested"
      });
      notifyUser(groupUserId, groupNotification);
    } catch (notifErr) {
      console.error("⚠️ Failed to notify Volunteer Group:", notifErr.message);
    }
  }

  return { mission_id, volunteer_id, status: 'completion_requested' };
};

// Previous 23 july
// exports.requestMissionComplete = async ({ mission_id, volunteer_id }) => {
//   const mission = await missionRequestModel.findById(mission_id);
//   if (!mission) throw { statusCode: 404, message: "Mission not found." };

//   const missionAssigned = await missionRequestModel.isVolunteerAssigned(mission_id, volunteer_id);
//   if (!missionAssigned) {
//     throw { statusCode: 403, message: "You are not assigned to this mission." };
//   }

//   // Fetch volunteer details
//   const volunteer = await volunteerModel.findById(volunteer_id);
//   if (!volunteer) {
//     throw { type: "not_found", message: "Volunteer does not exist" };
//   }
//   const volunteerName = (volunteer.name && volunteer.name.trim()) || 'A volunteer';

//   // 1. Update volunteer status in mission_assigned_volunteers to 'completed'
//   await missionRequestModel.updateAssignedVolunteerStatus(mission_id, volunteer_id, 'completed');

//   // 2. Update overall mission status to completion_requested
//   await missionRequestModel.updateStatus(mission_id, 'completion_requested');

//   // 3. Query assigned_by group ID from mission_assigned_volunteers and fallback to volunteer.invitedBy
//   const pool = await connectDB();
//   const [[assignedRecord]] = await pool.query(
//     "SELECT assigned_by FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?",
//     [mission_id, volunteer_id]
//   );
//   const groupUserId = (assignedRecord && assignedRecord.assigned_by) || volunteer.invitedBy || volunteer.invitedby;

//   // If assigned_by is NULL in DB, backfill it using groupUserId so DB is updated
//   if (groupUserId && (!assignedRecord || !assignedRecord.assigned_by)) {
//     await pool.query(
//       "UPDATE mission_assigned_volunteers SET assigned_by = ? WHERE mission_id = ? AND volunteer_id = ?",
//       [groupUserId, mission_id, volunteer_id]
//     );
//   }

//   if (groupUserId) {
//     const metaData = {
//       mission_id: mission_id,
//       missionId: mission_id,
//       volunteer_id: volunteer_id,
//       mission_name: mission.name,
//       volunteer_name: volunteerName
//     };
//     try {
//       const groupNotification = await notificationModel.sendNotification({
//         sender_id: volunteer_id,
//         receiver_id: groupUserId,
//         type: "volunteer_mission_completed",
//         message: `Your volunteer ${volunteerName} has completed the mission "${mission.name}".`,
//         meta: metaData,
//         mission_status: "completion_requested"
//       });
//       notifyUser(groupUserId, groupNotification);
//     } catch (notifErr) {
//       console.error("⚠️ Failed to notify Volunteer Group:", notifErr.message);
//     }
//   }

//   return { mission_id, volunteer_id, status: 'completion_requested' };
// };


// Previous 22 july
// exports.requestMissionComplete = async ({ mission_id, volunteer_id }) => {
//   const mission = await missionRequestModel.findById(mission_id);
//   if (!mission) throw { statusCode: 404, message: "Mission not found." };

//   const missionAssigned = await missionRequestModel.isVolunteerAssigned(mission_id, volunteer_id);
//   if (!missionAssigned) {
//     throw { statusCode: 403, message: "You are not assigned to this mission." };
//   }

//   // Fetch volunteer details
//   const volunteer = await volunteerModel.findById(volunteer_id);
//   if (!volunteer) {
//     throw { type: "not_found", message: "Volunteer does not exist" };
//   }
//   const volunteerName = (volunteer.name && volunteer.name.trim()) || 'A volunteer';

//   // 1. Update volunteer status in mission_assigned_volunteers to 'completed'
//   await missionRequestModel.updateAssignedVolunteerStatus(mission_id, volunteer_id, 'completed');

//   // 2. Update overall mission status to completion_requested
//   await missionRequestModel.updateStatus(mission_id, 'completion_requested');

//   // 3. Query assigned_by group ID from mission_assigned_volunteers and fallback to volunteer.invitedBy
//   const pool = await connectDB();
//   const [[assignedRecord]] = await pool.query(
//     "SELECT assigned_by FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?",
//     [mission_id, volunteer_id]
//   );
//   const groupUserId = (assignedRecord && assignedRecord.assigned_by) || volunteer.invitedBy || volunteer.invitedby;

//   // If assigned_by is NULL in DB, backfill it using groupUserId so DB is updated
//   if (groupUserId && (!assignedRecord || !assignedRecord.assigned_by)) {
//     await pool.query(
//       "UPDATE mission_assigned_volunteers SET assigned_by = ? WHERE mission_id = ? AND volunteer_id = ?",
//       [groupUserId, mission_id, volunteer_id]
//     );
//   }

//   const metaData = {
//     mission_id: mission_id,
//     missionId: mission_id,
//     volunteer_id: volunteer_id,
//     mission_name: mission.name,
//     volunteer_name: volunteerName
//   };

//   // 4. Send notification to Organization
//   const organizationUser = await missionRequestModel.findMissionCreatorUser(mission_id);
//   if (organizationUser && organizationUser.id) {
//     try {
//       const orgNotification = await notificationModel.sendNotification({
//         sender_id: volunteer_id,
//         receiver_id: organizationUser.id,
//         type: "volunteer_requested_completion",
//         message: `Volunteer ${volunteerName} has completed your mission "${mission.name}".`,
//         meta: metaData,
//         mission_status: "completion_requested"
//       });
//       notifyUser(organizationUser.id, orgNotification);
//     } catch (orgNotifErr) {
//       console.error("⚠️ Failed to notify Organization:", orgNotifErr.message);
//     }
//   }

//   // 5. Send notification to Volunteer Group (if assigned via group)
//   if (groupUserId) {
//     try {
//       const groupNotification = await notificationModel.sendNotification({
//         sender_id: volunteer_id,
//         receiver_id: groupUserId,
//         type: "volunteer_mission_completed",
//         message: `Your volunteer ${volunteerName} has completed this mission "${mission.name}".`,
//         meta: metaData,
//         mission_status: "completion_requested"
//       });
//       notifyUser(groupUserId, groupNotification);
//     } catch (notifErr) {
//       console.error("⚠️ Failed to notify Volunteer Group:", notifErr.message);
//     }
//   }

//   return { mission_id, volunteer_id, status: 'completion_requested' };
// };


// exports.requestMissionComplete = async ({ mission_id, volunteer_id }) => {
//   const mission = await missionRequestModel.findById(mission_id);
//   if (!mission) throw { statusCode: 404, message: "Mission not found." };

//   const missionAssigned = await missionRequestModel.isVolunteerAssigned(mission_id, volunteer_id);
//   if (!missionAssigned) {
//     throw { statusCode: 403, message: "You are not assigned to this mission." };
//   }

//   // Fetch volunteer details
//   const volunteer = await volunteerModel.findById(volunteer_id);
//   if (!volunteer) {
//     throw { type: "not_found", message: "Volunteer does not exist" };
//   }
//   const volunteerName = (volunteer.name && volunteer.name.trim()) || 'A volunteer';

//   // 1. Update volunteer status in mission_assigned_volunteers to 'completed'
//   await missionRequestModel.updateAssignedVolunteerStatus(mission_id, volunteer_id, 'completed');

//   // 2. Update overall mission status to completion_requested
//   await missionRequestModel.updateStatus(mission_id, 'completion_requested');

//   // 3. Query assigned_by group ID from mission_assigned_volunteers
//   const pool = await connectDB();
//   const [[assignedRecord]] = await pool.query(
//     "SELECT assigned_by FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?",
//     [mission_id, volunteer_id]
//   );
//   const groupUserId = (assignedRecord && assignedRecord.assigned_by) || volunteer.invitedBy || volunteer.invitedby;

//   const metaData = {
//     mission_id: mission_id,
//     missionId: mission_id,
//     volunteer_id: volunteer_id,
//     mission_name: mission.name,
//     volunteer_name: volunteerName
//   };

//   // 4. Send notification to Volunteer Group (if assigned via group)
//   if (groupUserId) {
//     try {
//       const groupNotification = await notificationModel.sendNotification({
//         sender_id: volunteer_id,
//         receiver_id: groupUserId,
//         type: "volunteer_mission_completed",
//         message: `Your volunteer ${volunteerName} has completed this mission "${mission.name}".`,
//         meta: metaData,
//         mission_status: "completion_requested"
//       });
//       notifyUser(groupUserId, groupNotification);
//     } catch (notifErr) {
//       console.error("⚠️ Failed to notify Volunteer Group:", notifErr.message);
//     }
//   } else {
//     // If not assigned by a group, notify Organization directly
//     const organizationUser = await missionRequestModel.findMissionCreatorUser(mission_id);
//     if (organizationUser && organizationUser.id) {
//       const orgNotification = await notificationModel.sendNotification({
//         sender_id: volunteer_id,
//         receiver_id: organizationUser.id,
//         type: "mission_completion_request",
//         message: `Volunteer ${volunteerName} has completed your mission "${mission.name}".`,
//         meta: metaData,
//         mission_status: "completion_requested"
//       });
//       notifyUser(organizationUser.id, orgNotification);
//     }
//   }

//   return { mission_id, volunteer_id, status: 'completion_requested' };
// };


/////////// Before Above date 21 july

// exports.requestMissionComplete = async ({ mission_id, volunteer_id }) => {
//   const mission = await missionRequestModel.findById(mission_id);
//   if (!mission) throw { statusCode: 404, message: "Mission not found." };

//   const missionAssigned = await missionRequestModel.isVolunteerAssigned(mission_id, volunteer_id);
//   if (!missionAssigned) {
//     throw { statusCode: 403, message: "You are not assigned to this mission." };
//   }

//   // Fetch volunteer name using existing model + fallback for null names
//   const volunteer = await volunteerModel.findById(volunteer_id);
//   if (!volunteer) {
//     throw { type: "not_found", message: "Volunteer does not exist" };
//   }
//   const volunteerName = (volunteer.name && volunteer.name.trim()) || 'A volunteer';

//   await missionRequestModel.updateStatus(mission_id, 'completion_requested');

//   const organizationUser = await missionRequestModel.findMissionCreatorUser(mission_id);
//   const notification = await notificationModel.sendNotification({
//     sender_id: volunteer_id,
//     receiver_id: organizationUser.id,
//     type: "mission_completion_request",
//     message: `${volunteerName} has requested to mark mission "${mission.name}" as completed.`,
//     meta: { mission_id },
//   });

//   // Fix: use organizationUser.id (users table ID), not mission.organization_id (organizations table FK)
//   notifyUser(organizationUser.id, notification);

//   return { mission_id, status: 'completion_requested' };
// };

//////// Previous work before above 17 july work

// exports.requestMissionComplete = async ({ mission_id, volunteer_id }) => {
//   const mission = await missionRequestModel.findById(mission_id);
//   if (!mission) throw { statusCode: 404, message: "Mission not found." };

//   const missionAssigned = await missionRequestModel.isVolunteerAssigned(mission_id, volunteer_id);

//   if (!missionAssigned) {
//     throw { statusCode: 403, message: "You are not assigned to this mission." };
//   }

//   await missionRequestModel.updateStatus(mission_id, 'completion_requested');
//   // await missionRequestModel.deleteAssignedRequest(mission_id, volunteer_id);
//   const organizationUser = await missionRequestModel.findMissionCreatorUser(mission_id);
//   const notification = await notificationModel.sendNotification({
//     sender_id: volunteer_id,
//     receiver_id: organizationUser.id,
//     type: "mission_completion_request",
//     message: `Volunteer has requested to mark mission "${mission.name}" as completed.`,
//     meta: { mission_id },
//   });

//   notifyUser(mission.organization_id, notification);

//   return { mission_id, status: 'completion_requested' };
// };

exports.getLeaderboard = async (limit, page, filters) => {
  const offset = (page - 1) * limit;

  const volunteers = await Leaderboard.getFilteredVolunteers(
    limit,
    offset,
    filters
  );

  const total = await Leaderboard.countFilteredVolunteers(filters);

  let leaderboard = [];
  let previousRank = null;

  volunteers.forEach((user, index) => {
    const rank = offset + index + 1;

    let trend = "up";
    if (previousRank !== null) {
      trend = rank < previousRank ? "up" : "down";
    }

    previousRank = rank;

    leaderboard.push({
      id: user.id,
      name: user.name,
      image: user.image,
      points: user.points,
      city: user.city,
      state: user.state,
      country: user.country,
      rank: rank,
      trend: trend,
    });
  });

  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    data: leaderboard,
  };
};

exports.getOrgLeaderboard = async (limit, page, filters) => {
  const offset = (page - 1) * limit;

  const volunteers = await Leaderboard.getVolunteersByOrg(
    limit,
    offset,
    filters
  );

  console.log(`Service found ${volunteers.length} volunteers for Org ID ${filters.organization_id}`);

  const total = await Leaderboard.countVolunteersByOrg(filters);

  let leaderboard = [];

  volunteers.forEach((user, index) => {
    const rank = offset + index + 1;

    let trend = "same";
    if (user.previous_rank !== null) {
      if (user.previous_rank > rank) trend = "up";
      else if (user.previous_rank < rank) trend = "down";
    }

    leaderboard.push({
      id: user.id,
      name: user.name,
      image: user.image,
      points: user.points,
      city: user.city,
      state: user.state,
      country: user.country,
      rank: rank,
      trend: trend,
    });
  });

  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    data: leaderboard,
  };
};


exports.getGroupLeaderboard = async (limit, page, filters) => {
  const offset = (page - 1) * limit;

  const groups = await Leaderboard.getGroupLeaderboard(
    limit,
    offset,
    filters
  );

  const total = await Leaderboard.countGroupLeaderboard(filters);

  let leaderboard = [];

  groups.forEach((group, index) => {
    const rank = offset + index + 1;

    let trend = "same";
    if (group.previous_rank !== null) {
      if (group.previous_rank > rank) trend = "up";
      else if (group.previous_rank < rank) trend = "down";
    }

    leaderboard.push({
      id: group.id,
      name: group.name,
      email: group.email,
      image: group.image,
      points: Number(group.points) || 0,
      city: group.city || 'N/A',
      state: group.state || 'N/A',
      country: group.country || 'N/A',
      rank: rank,
      trend: trend,
    });
  });

  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    data: leaderboard,
  };
};

exports.inviteVolunteer = async (orgUserId, userId) => {

  const organizationUser = await model.findOrganizationByUserId(orgUserId);
  if (!organizationUser) {
    throw new Error("Organization not found");
  }

  const existing = await model.findInvite(organizationUser.id, userId);
  if (existing) {
    throw new Error("Invite already sent");
  }

  const alreadyJoined = await model.findInvitation(organizationUser.id, userId);
  if (alreadyJoined) throw new Error("This Volunteer has already joined your organization");

  const notification = await notificationModel.sendNotification({
    sender_id: orgUserId,
    receiver_id: userId,
    type: "organization_invitation",
    message: `${organizationUser.company_name} has sent you an invitation to join their organization.`,
  });

  const notified = await notifyUser(userId, notification);

  // if (notified) {
    await model.createInvite(organizationUser.id, userId, null, null);
  // }

//   const organization = await model.findOrganizationByUserId(orgUserId);
//   if (!organization) throw new Error('Organization not found');

//   const existing = await model.findInvite(organization.id, userId);
//   if (existing) throw new Error('Invite already sent');

//   const token = crypto.randomBytes(32).toString('hex');
//   const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

//   await model.createInvite(organization.id, userId, token, expiresAt);

//   const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${token}`;

// const user = await model.findUserById(userId);
// console.log('Fetched user:', user);

// if (!user || !user.email) throw new Error('User email not found');

// console.log('Sending invite to:', user.email);
// await sendInviteEmail(user.email, inviteLink);


  return true;
};


exports.acceptInvite = async ({ orgId, userId }) => {
  const organization = await model.findOrganizationByUserId(orgId);
  if (!organization) throw new Error("Organization not found");

  const realOrgId = organization.id;

  const invite = await model.findInviteByOrgIdAndUser(realOrgId, userId);
  if (!invite) throw new Error('Invalid invitation');

  await model.acceptInviteRequest(realOrgId, userId);

  await model.deleteInvite(invite.id);

  const volunteer = await volunteerModel.findById(userId);
  if (!volunteer) {
    throw { type: "not_found", message: "Volunteer does not exist" };
  }

  const notification = await notificationModel.sendNotification({
    sender_id: userId,
    receiver_id: orgId,
    type: "mission_accepted",
    message: `${volunteer.name} has accepted your joining request.`,
  });

  notifyUser(orgId, notification);

  return true;
};


exports.rejectInvite = async ({ orgId, userId }) => {
  const organization = await model.findOrganizationByUserId(orgId);
  if (!organization) throw new Error("Organization not found");

  const realOrgId = organization.id;

  const invite = await model.findInviteByOrgIdAndUser(realOrgId, userId);
  if (!invite) throw new Error('Invalid invitation');

  await model.rejectInviteRequest(realOrgId, userId);
  await model.deleteInvite(invite.id);

  const volunteer = await volunteerModel.findById(userId);
  if (!volunteer) {
    throw { type: "not_found", message: "Volunteer does not exist" };
  }

  const notification = await notificationModel.sendNotification({
    sender_id: userId,
    receiver_id: orgId,
    type: "mission_accepted",
    message: `${volunteer.name} rejected the invitation.`,
  });

  notifyUser(orgId, notification);

  return true;
};


exports.getAllVolunteerGroups = async () => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `SELECT g.id, g.name, g.email, g.type, g.role, g.contact_no, g.description, g.city, g.state, g.country, g.status, g.image, g.created_at,
            COALESCE(SUM(v.points), 0) AS points,
            COUNT(v.id) AS members_count
     FROM users g
     LEFT JOIN users v ON v.invitedBy = g.id AND v.type = 'volunteer'
     WHERE g.type = 'volunteer_group'
     GROUP BY g.id
     ORDER BY g.name ASC`
  );
  return rows;
};

exports.getVolunteerGroupById = async (groupId) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `SELECT g.id, g.name, g.email, g.type, g.role, g.contact_no, g.description, g.city, g.state, g.country, g.status, g.image, g.created_at,
            COALESCE(SUM(v.points), 0) AS points,
            COUNT(v.id) AS members_count
     FROM users g
     LEFT JOIN users v ON v.invitedBy = g.id AND v.type = 'volunteer'
     WHERE g.id = ? AND g.type = 'volunteer_group'
     GROUP BY g.id`,
    [groupId]
  );
  if (rows.length === 0) {
    const err = new Error('Volunteer Group not found');
    err.statusCode = 404;
    throw err;
  }
  return rows[0];
};

exports.getVolunteersOfGroup = async (groupId) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `SELECT id, name, email, type, role, contact_no, description, city, state, country, status, points, image, created_at
     FROM users
     WHERE type = 'volunteer' AND invitedBy = ?
     ORDER BY name ASC`,
    [groupId]
  );
  
  for (let row of rows) {
    const [missions] = await pool.query(
      `SELECT m.id, m.name, m.status, mav.status AS assigned_status, m.points
       FROM mission_assigned_volunteers mav
       JOIN missions m ON m.id = mav.mission_id
       WHERE mav.volunteer_id = ?`,
      [row.id]
    );
    row.missions = missions;
  }
  return rows;
};


// exports.acceptInvite = async (orgId, userId) => {
//   const invite = await model.findInviteByOrgId(orgId);
//   if (!invite) throw new Error('Invalid Organization');

//   await model.addVolunteer(invite.organization_id, userId);
//   await model.deleteInvite(invite.id);

//   return true;
// };

// Previous before notification work
// exports.requestMission = async ({ mission_id, volunteer_id }) => {
//   const mission = await missionRequestModel.findById(mission_id);
//   if (!mission) throw new AppError("Mission not found", 404);

//   const pending = await missionRequestModel.findPendingRequest(
//     mission_id,
//     volunteer_id
//   );
//   if (pending) throw new AppError("You already requested this mission", 409);

//   const assigned = await missionRequestModel.findAssignedVolunteer(
//     mission_id,
//     volunteer_id
//   );
//   if (assigned) throw new AppError("You are already assigned to this mission", 409);

//   await missionRequestModel.addPendingRequest(mission_id, volunteer_id);

//   return { mission_id, volunteer_id, status: "pending" };
// };


// async function requestMissionService({ mission_id, volunteer_id }) {
//     const pool = await connectDB();
    
//     const [[mission]] = await pool.query('SELECT id FROM missions WHERE id = ?', [mission_id]);
//     if(!mission) throw new AppError('Mission not found');

//     const [[pending]] = await pool.query('SELECT * FROM mission_pending_requests WHERE mission_id = ? AND volunteer_id = ?',[mission_id,volunteer_id]);
//     if(pending) throw new AppError("You already requested this mission");

//     const [[assigned]] = await pool.query('SELECT * FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?',[mission_id,volunteer_id]);
//     if(assigned) throw new AppError("You are already assigned to this mission");

//     await pool.query('INSERT INTO mission_pending_requests (mission_id,volunteer_id) VALUES (?,?)',[mission_id,volunteer_id]);

//     return { mission_id,volunteer_id, 'status':'pending' };
// }


// module.exports = { requestMissionService };