const asyncHandler = require('../middleware/asyncHandler');
const Mission = require('../models/Mission');
const missionModel = require('../models/Mission');
const volunteerModel = require('../models/volunteerModel');
const Organization = require('../models/Organization');
const connectDB = require('../config/db');
const AppError = require('../utils/AppError');
const { notifyUser } = require("../services/socket");
const missionRequestModel = require("../models/Mission");
const notificationModel = require("../models/notificationModel");
const model = require('../models/VolunteerInviteModel');
const { isFutureTime, parseLocalDateTime } = require('../utils/datetime');

exports.createMission = async (missionData, files, organizationId) => {
  const lat = missionData.lat ? parseFloat(missionData.lat) : null;
  const lng = missionData.lng ? parseFloat(missionData.lng) : null;

  let filePath = null;
  if (files?.file?.length > 0) {
    filePath = `/uploads/missions/images/${files.file[0].filename}`;
  }

  const exists = await missionModel.findByNameAndOrg(
    missionData.name,
    organizationId
  );

  if (exists.length > 0) {
    throw { type: "conflict", message: "Mission name already exists" };
  }

  const missionId = await missionModel.insertMission({
    ...missionData,
    lat,
    lng,
    file: filePath,
    organization_id: organizationId,
  });

  const organizationUser =
    await model.findOrganizationById(organizationId);

  if (!organizationUser) {
    throw new Error("Organization not found");
  }

  const orgVols = await model.findOrgVolunteers(organizationId);

  for (const vol of orgVols) {
    const notification =
      await notificationModel.sendNotification({
        sender_id: organizationUser.user_id,
        receiver_id: vol.user_id,
        type: "mission_created",
        message: `${organizationUser.company_name} created a new mission: ${missionData.name}`,
        meta: { missionId },
      });

    notifyUser(vol.user_id, notification);
  }

  return { missionId };
};

exports.getNearbyMissions = async (userId, radius) => {
  const radiusMiles = radius || 50;
  return await missionModel.findNearbyMissions(userId, radiusMiles);
};

exports.getMissionById = async (missionId) => {
  const mission = await missionModel.findById(missionId);

  if (!mission) return null;

  return mission;
};


exports.getAllMissions = async (page, limit, sortBy, sortOrder) => {
  return await missionModel.getAllMissions(
    page,
    limit,
    sortBy,
    sortOrder
  );
};


exports.missions = async (user, page, limit, sortBy, sortOrder) => {
  const result = await missionModel.getMissionsByUser(user, page, limit, sortBy, sortOrder);
  return result;
};

// exports.getAllMissions = async () => {
//   return await missionModel.getAllMissions();
// };

// exports.createMission = async (missionData, files) => {

//   const lat = missionData.lat ? parseFloat(missionData.lat) : null;
//   const lng = missionData.lng ? parseFloat(missionData.lng) : null;

//   // Handle file path if uploaded
//   let filePath = null;
//   if (files && files.file && files.file.length > 0) {
//     filePath = `/uploads/missions/images/${files.file[0].filename}`;
//   }

//   // Check for duplicate name in same organization
//   const exists = await missionModel.findByNameAndOrg(
//     missionData.name,
//     missionData.organization_id
//   );
//   if (exists.length > 0) {
//     throw { type: "conflict", message: "Mission name already exists" };
//   }

//   // Save mission
//   const missionId = await missionModel.insertMission({
//     ...missionData,
//     lat,
//     lng,
//     file: filePath,
//   });

//   return { missionId };
// };


exports.toggleLike = async (missionId, userId) => {
  const pool = await connectDB();

  // Check if mission exists
  const [[mission]] = await pool.query(
    "SELECT id, name, posted_by FROM missions WHERE id = ?",
    [missionId]
  );
  if (!mission) throw { type: "not_found", message: "Mission does not exist" };

  // Check if already liked
  const [existing] = await pool.query(
    "SELECT id FROM mission_likes WHERE mission_id = ? AND user_id = ?",
    [missionId, userId]
  );

  // Fetch mission creator once
  const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
  const ownerId = organizationUser?.id || null;

  if (existing.length > 0) {
    // Unlike
    await pool.query(
      "DELETE FROM mission_likes WHERE mission_id = ? AND user_id = ?",
      [missionId, userId]
    );
    return { liked: false, mission, ownerId };
  }

  // Like
  await pool.query(
    "INSERT INTO mission_likes (mission_id, user_id) VALUES (?, ?)",
    [missionId, userId]
  );

  return { liked: true, mission, ownerId };
};




// exports.missions = async (user) => {
//   const missions = await missionModel.getMissionsByUser(user);
//   return missions;
// };

// exports.missions = asyncHandler(async (user) => {
//   let orgFilter = {};
//   if (user.type === 'organization') {
//     orgFilter.user = user._id;
//   }

//   // Get user's organizations
//   const organizations = await Organization.find(orgFilter);

//   // Attach missions to each org
//   const results = await Promise.all(
//     organizations.map(async (org) => {
//       const missions = await Mission.find({ organization: org._id })
//       .populate('organization', 'company_name email description')  
//       .populate('assignedvolunteers', 'name email')
//         .sort({ createdAt: -1 });

//       return {
//         ...org.toObject(),
//         missions
//       };
//     })
//   );

//   return results;
// });

exports.rejectedMissions = async (params) => {
  try {

  } catch (error) {
    console.log(error);
    throw error;
  }
}


exports.assignVolunteer = async (missionId, volunteerId) => {
  const pool = await connectDB();
  const [[user]] = await pool.query(
    "SELECT type, name FROM users WHERE id = ?",
    [volunteerId]
  );
  if (!user) {
    throw { type: "not_found", message: "User does not exist" };
  }

  const mission = await missionModel.findById(missionId);
  if (!mission) {
    throw { type: "not_found", message: "Mission does not exist" };
  }

  const alreadyComplete = await missionModel.missionCompleted(missionId);
  if (alreadyComplete) {
    throw { message: "Mission already completed you can't assign this mission" };
  }

  if (user.type === 'volunteer_group') {
    const groupUserId = volunteerId;
    const groupName = user.name;

    // Accept group application
    await pool.query(
      "UPDATE volunteer_group_applications SET status = 'accepted' WHERE group_id = ? AND mission_id = ?",
      [groupUserId, missionId]
    );

    const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

    // Get all other pending group applications for this mission before rejecting them
    const [otherGroups] = await pool.query(
      "SELECT group_id FROM volunteer_group_applications WHERE mission_id = ? AND group_id != ? AND status = 'pending'",
      [missionId, groupUserId]
    );

    // Automatically reject other pending group applications for this mission
    await pool.query(
      "UPDATE volunteer_group_applications SET status = 'rejected' WHERE mission_id = ? AND group_id != ? AND status = 'pending'",
      [missionId, groupUserId]
    );

    // Delete pending volunteers for other groups
    await pool.query(
      "DELETE FROM mission_assigned_volunteers WHERE mission_id = ? AND assigned_by != ? AND status = 'group_pending'",
      [missionId, groupUserId]
    );

    // Send rejection notifications to other groups
    for (const otherGroup of otherGroups) {
      try {
        const notification = await notificationModel.sendNotification({
          sender_id: organizationUser.id,
          receiver_id: otherGroup.group_id,
          type: "mission_rejected",
          message: `${organizationUser.name} has rejected your application for the mission '${mission.name}'.`,
          meta: { missionId },
        });
        notifyUser(otherGroup.group_id, notification);
      } catch (notifErr) {
        console.error('⚠️ Other group rejection notification failed:', notifErr.message);
      }
    }

    // Get all group pending volunteers for this group and mission
    const [assignedVolunteers] = await pool.query(
      "SELECT volunteer_id FROM mission_assigned_volunteers WHERE mission_id = ? AND assigned_by = ? AND status = 'group_pending'",
      [missionId, groupUserId]
    );

    // Update their status to 'pending'
    await pool.query(
      "UPDATE mission_assigned_volunteers SET status = 'pending' WHERE mission_id = ? AND assigned_by = ? AND status = 'group_pending'",
      [missionId, groupUserId]
    );

    // Update overall mission status
    // Only mark as "scheduled" when the start time is strictly in the future.
    // If the start time is already in the past or equal to the current time, mark as "process".
    const startTimeVal = mission.raw_start_time || mission.start_time;
    const isFuture = isFutureTime(startTimeVal);
    console.log(`[assignVolunteer Group] missionId=${missionId}, startTimeVal=${startTimeVal}, isFuture=${isFuture}, serverNow=${new Date().toISOString()}`);

    if (isFuture) {
      await missionModel.updateStatus(missionId, "scheduled");
      await missionModel.updateNotify(missionId, 1);
    } else {
      await missionModel.updateStatus(missionId, "process");
    }

    // Send volunteer notifications
    for (const row of assignedVolunteers) {
      try {
        const volNotif = await notificationModel.sendNotification({
          sender_id: groupUserId,
          receiver_id: row.volunteer_id,
          type: 'mission_accepted',
          message: isFuture
            ? `You have been successfully assigned to the mission "${mission.name}" by ${groupName}. Your participation has been confirmed and the mission is scheduled.`
            : `You have been successfully assigned to the mission "${mission.name}" by ${groupName}. Your participation has been confirmed and the mission is now underway.`,
          meta: { missionId },
        });
        notifyUser(row.volunteer_id, volNotif);
      } catch (notifErr) {
        console.error('⚠️ Volunteer notification failed:', notifErr.message);
      }
    }

    // Send confirmation notification to group user
    const groupNotif = await notificationModel.sendNotification({
      sender_id: organizationUser.id,
      receiver_id: groupUserId,
      type: "mission_accepted",
      message: `${organizationUser.name} has accepted your application for the mission '${mission.name}'.`,
      meta: { missionId }
    });
    notifyUser(groupUserId, groupNotif);

    return {
      alreadyAssigned: false,
      missionName: mission.name,
      volunteerName: groupName,
    };
  }

  const volunteer = await volunteerModel.findById(volunteerId);
  if (!volunteer) {
    throw { type: "not_found", message: "Volunteer does not exist" };
  }

  const alreadyAssigned = await missionModel.isVolunteerAssigned(
    missionId,
    volunteerId
  );
  if (alreadyAssigned) {
    return {
      alreadyAssigned: true,
      missionName: mission.name,
      volunteerName: volunteer.name,
    };
  }

  await missionModel.assignVolunteer(missionId, volunteerId);

  // Check start_time and update status accordingly
  // Only mark as "scheduled" when the start time is strictly in the future.
  // If the start time is already in the past or equal to the current time, mark as "process".
  const volStartTimeVal = mission.raw_start_time || mission.start_time;
  const isVolFuture = isFutureTime(volStartTimeVal);

  if (isVolFuture) {
    await missionModel.updateStatus(missionId, "scheduled");
    await missionModel.updateNotify(missionId, 1);
  } else {
    await missionModel.updateStatus(missionId, "process");
  }

  const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
  const notification = await notificationModel.sendNotification({
    sender_id: organizationUser.id,
    receiver_id: volunteerId,
    type: "mission_accepted",
    message: `${organizationUser.name} has accepted your mission request.`,
    meta: { missionId }
  });

  // Real-time push
  notifyUser(volunteerId, notification);

  return {
    alreadyAssigned: false,
    missionName: mission.name,
    volunteerName: volunteer.name,
  };
};

// exports.assignVolunteer = async (missionId, volunteerId) => {
//   const pool = await connectDB();
//   const [[user]] = await pool.query(
//     "SELECT type, name FROM users WHERE id = ?",
//     [volunteerId]
//   );
//   if (!user) {
//     throw { type: "not_found", message: "User does not exist" };
//   }

//   const mission = await missionModel.findById(missionId);
//   if (!mission) {
//     throw { type: "not_found", message: "Mission does not exist" };
//   }

//   const alreadyComplete = await missionModel.missionCompleted(missionId);
//   if (alreadyComplete) {
//     throw { message: "Mission already completed you can't assign this mission" };
//   }

//   if (user.type === 'volunteer_group') {
//     const groupUserId = volunteerId;
//     const groupName = user.name;

//     // Accept group application
//     await pool.query(
//       "UPDATE volunteer_group_applications SET status = 'accepted' WHERE group_id = ? AND mission_id = ?",
//       [groupUserId, missionId]
//     );

//     const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//     // Get all other pending group applications for this mission before rejecting them
//     const [otherGroups] = await pool.query(
//       "SELECT group_id FROM volunteer_group_applications WHERE mission_id = ? AND group_id != ? AND status = 'pending'",
//       [missionId, groupUserId]
//     );

//     // Automatically reject other pending group applications for this mission
//     await pool.query(
//       "UPDATE volunteer_group_applications SET status = 'rejected' WHERE mission_id = ? AND group_id != ? AND status = 'pending'",
//       [missionId, groupUserId]
//     );

//     // Delete pending volunteers for other groups
//     await pool.query(
//       "DELETE FROM mission_assigned_volunteers WHERE mission_id = ? AND assigned_by != ? AND status = 'group_pending'",
//       [missionId, groupUserId]
//     );

//     // Send rejection notifications to other groups
//     for (const otherGroup of otherGroups) {
//       try {
//         const notification = await notificationModel.sendNotification({
//           sender_id: organizationUser.id,
//           receiver_id: otherGroup.group_id,
//           type: "mission_rejected",
//           message: `${organizationUser.name} has rejected your application for the mission '${mission.name}'.`,
//           meta: { missionId },
//         });
//         notifyUser(otherGroup.group_id, notification);
//       } catch (notifErr) {
//         console.error('⚠️ Other group rejection notification failed:', notifErr.message);
//       }
//     }

//     // Get all group pending volunteers for this group and mission
//     const [assignedVolunteers] = await pool.query(
//       "SELECT volunteer_id FROM mission_assigned_volunteers WHERE mission_id = ? AND assigned_by = ? AND status = 'group_pending'",
//       [missionId, groupUserId]
//     );

//     // Update their status to 'pending'
//     await pool.query(
//       "UPDATE mission_assigned_volunteers SET status = 'pending' WHERE mission_id = ? AND assigned_by = ? AND status = 'group_pending'",
//       [missionId, groupUserId]
//     );

//     // Update overall mission status
//     const now = new Date();
//     const startTime = new Date(mission.start_time);
//     if (startTime > now) {
//       await missionModel.updateStatus(missionId, "scheduled");
//       await missionModel.updateNotify(missionId, 1);
//     } else {
//       await missionModel.updateStatus(missionId, "process");
//     }

//     // Send volunteer notifications
//     for (const row of assignedVolunteers) {
//       try {
//         const volNotif = await notificationModel.sendNotification({
//           sender_id: groupUserId,
//           receiver_id: row.volunteer_id,
//           type: 'mission_accepted',
//           message: `You have been successfully assigned to the mission "${mission.name}" by ${groupName}. Your participation has been confirmed and the mission is now underway.`,
//           meta: { missionId },
//         });
//         notifyUser(row.volunteer_id, volNotif);
//       } catch (notifErr) {
//         console.error('⚠️ Volunteer notification failed:', notifErr.message);
//       }
//     }

//     // Send confirmation notification to group user
//     const groupNotif = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: groupUserId,
//       type: "mission_accepted",
//       message: `${organizationUser.name} has accepted your application for the mission '${mission.name}'.`,
//       meta: { missionId }
//     });
//     notifyUser(groupUserId, groupNotif);

//     return {
//       alreadyAssigned: false,
//       missionName: mission.name,
//       volunteerName: groupName,
//     };
//   }

//   const volunteer = await volunteerModel.findById(volunteerId);
//   if (!volunteer) {
//     throw { type: "not_found", message: "Volunteer does not exist" };
//   }

//   const alreadyAssigned = await missionModel.isVolunteerAssigned(
//     missionId,
//     volunteerId
//   );
//   if (alreadyAssigned) {
//     return {
//       alreadyAssigned: true,
//       missionName: mission.name,
//       volunteerName: volunteer.name,
//     };
//   }

//   await missionModel.assignVolunteer(missionId, volunteerId);

//   // Check start_time and update status accordingly
//   const now = new Date();
//   const startTime = new Date(mission.start_time);
//   if (startTime > now) {
//     await missionModel.updateStatus(missionId, "scheduled");
//     await missionModel.updateNotify(missionId, 1);
//   } else {
//     await missionModel.updateStatus(missionId, "process");
//   }

//   const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
//   const notification = await notificationModel.sendNotification({
//     sender_id: organizationUser.id,
//     receiver_id: volunteerId,
//     type: "mission_accepted",
//     message: `${organizationUser.name} has accepted your mission request.`,
//     meta: { missionId }
//   });

//   // Real-time push
//   notifyUser(volunteerId, notification);

//   return {
//     alreadyAssigned: false,
//     missionName: mission.name,
//     volunteerName: volunteer.name,
//   };
// };



// Before condition of multiple group work [before above] 
// exports.assignVolunteer = async (missionId, volunteerId) => {
//   const pool = await connectDB();
//   const [[user]] = await pool.query(
//     "SELECT type, name FROM users WHERE id = ?",
//     [volunteerId]
//   );
//   if (!user) {
//     throw { type: "not_found", message: "User does not exist" };
//   }

//   const mission = await missionModel.findById(missionId);
//   if (!mission) {
//     throw { type: "not_found", message: "Mission does not exist" };
//   }

//   const alreadyComplete = await missionModel.missionCompleted(missionId);
//   if (alreadyComplete) {
//     throw { message: "Mission already completed you can't assign this mission" };
//   }

//   if (user.type === 'volunteer_group') {
//     const groupUserId = volunteerId;
//     const groupName = user.name;

//     // Accept group application
//     await pool.query(
//       "UPDATE volunteer_group_applications SET status = 'accepted' WHERE group_id = ? AND mission_id = ?",
//       [groupUserId, missionId]
//     );

//     // Get all group pending volunteers for this group and mission
//     const [assignedVolunteers] = await pool.query(
//       "SELECT volunteer_id FROM mission_assigned_volunteers WHERE mission_id = ? AND assigned_by = ? AND status = 'group_pending'",
//       [missionId, groupUserId]
//     );

//     // Update their status to 'pending'
//     await pool.query(
//       "UPDATE mission_assigned_volunteers SET status = 'pending' WHERE mission_id = ? AND assigned_by = ? AND status = 'group_pending'",
//       [missionId, groupUserId]
//     );

//     // Update overall mission status
//     const now = new Date();
//     const startTime = new Date(mission.start_time);
//     if (startTime > now) {
//       await missionModel.updateStatus(missionId, "scheduled");
//       await missionModel.updateNotify(missionId, 1);
//     } else {
//       await missionModel.updateStatus(missionId, "process");
//     }

//     const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//     // Send volunteer notifications
//     for (const row of assignedVolunteers) {
//       try {
//         const volNotif = await notificationModel.sendNotification({
//           sender_id: groupUserId,
//           receiver_id: row.volunteer_id,
//           type: 'mission_accepted',
//           message: `You have been successfully assigned to the mission "${mission.name}" by ${groupName}. Your participation has been confirmed and the mission is now underway.`,
//           meta: { missionId },
//         });
//         notifyUser(row.volunteer_id, volNotif);
//       } catch (notifErr) {
//         console.error('⚠️ Volunteer notification failed:', notifErr.message);
//       }
//     }

//     // Send confirmation notification to group user
//     const groupNotif = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: groupUserId,
//       type: "mission_accepted",
//       message: `${organizationUser.name} has accepted your application for the mission '${mission.name}'.`,
//       meta: { missionId }
//     });
//     notifyUser(groupUserId, groupNotif);

//     return {
//       alreadyAssigned: false,
//       missionName: mission.name,
//       volunteerName: groupName,
//     };
//   }

//   const volunteer = await volunteerModel.findById(volunteerId);
//   if (!volunteer) {
//     throw { type: "not_found", message: "Volunteer does not exist" };
//   }

//   const alreadyAssigned = await missionModel.isVolunteerAssigned(
//     missionId,
//     volunteerId
//   );
//   if (alreadyAssigned) {
//     return {
//       alreadyAssigned: true,
//       missionName: mission.name,
//       volunteerName: volunteer.name,
//     };
//   }

//   await missionModel.assignVolunteer(missionId, volunteerId);

//   // Check start_time and update status accordingly
//   const now = new Date();
//   const startTime = new Date(mission.start_time);
//   if (startTime > now) {
//     await missionModel.updateStatus(missionId, "scheduled");
//     await missionModel.updateNotify(missionId, 1);
//   } else {
//     await missionModel.updateStatus(missionId, "process");
//   }

//   const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
//   const notification = await notificationModel.sendNotification({
//     sender_id: organizationUser.id,
//     receiver_id: volunteerId,
//     type: "mission_accepted",
//     message: `${organizationUser.name} has accepted your mission request.`,
//     meta: { missionId }
//   });

//   // Real-time push
//   notifyUser(volunteerId, notification);

//   return {
//     alreadyAssigned: false,
//     missionName: mission.name,
//     volunteerName: volunteer.name,
//   };
// };


// Before 24 July work above newly
// exports.assignVolunteer = async (missionId, volunteerId) => {
//   const mission = await missionModel.findById(missionId);
//   if (!mission) {
//     throw { type: "not_found", message: "Mission does not exist" };
//   }

//   const alreadyComplete = await missionModel.missionCompleted(missionId);
//   if (alreadyComplete) {
//     throw { message: "Mission already completed you can't assign this mission" };
//   }

//   const volunteer = await volunteerModel.findById(volunteerId);
//   if (!volunteer) {
//     throw { type: "not_found", message: "Volunteer does not exist" };
//   }

//   const alreadyAssigned = await missionModel.isVolunteerAssigned(
//     missionId,
//     volunteerId
//   );
//   if (alreadyAssigned) {
//     return {
//       alreadyAssigned: true,
//       missionName: mission.name,
//       volunteerName: volunteer.name,
//     };
//   }

//   await missionModel.assignVolunteer(missionId, volunteerId);

//   // Check start_time and update status accordingly
//   const now = new Date();
//   const startTime = new Date(mission.start_time);
//   if (startTime > now) {
//     await missionModel.updateStatus(missionId, "scheduled");
//     await missionModel.updateNotify(missionId, 1);
//   } else {
//     await missionModel.updateStatus(missionId, "process");
//   }

//   const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
//   const notification = await notificationModel.sendNotification({
//     sender_id: organizationUser.id,
//     receiver_id: volunteerId,
//     type: "mission_accepted",
//     message: `${organizationUser.name} has accepted your mission request.`,
//     meta: { missionId }
//   });

//   // Real-time push
//   notifyUser(volunteerId, notification);

//   return {
//     alreadyAssigned: false,
//     missionName: mission.name,
//     volunteerName: volunteer.name,
//   };
// };


// exports.assignVolunteer = async (missionId, volunteerId) => {
//   const mission = await missionModel.findById(missionId);
//   if (!mission) {
//     throw { type: "not_found", message: "Mission does not exist" };
//   }

//   // const missionStart = await missionModel.missionStart(missionId);
//   // if (!missionStart || !missionStart.start_time) {
//   //   throw { type: "not_found", message: "Mission start time not found" };
//   // }

//   // const now = new Date();
//   // const startTime = new Date(missionStart.start_time);

//   // if (now < startTime) {
//   //   throw {
//   //     type: "not_started",
//   //     message: `This mission will start at ${missionStart.start_time}`,
//   //   };
//   // }

//   const alreadyComplete = await missionModel.missionCompleted(missionId);
//   if (alreadyComplete) {
//     throw { message: "Mission already completed you can't assign this mission" };
//   }

//   const volunteer = await volunteerModel.findById(volunteerId);
//   if (!volunteer) {
//     throw { type: "not_found", message: "Volunteer does not exist" };
//   }

//   const alreadyAssigned = await missionModel.isVolunteerAssigned(
//     missionId,
//     volunteerId
//   );
//   if (alreadyAssigned) {
//     return {
//       alreadyAssigned: true,
//       missionName: mission.name,
//       volunteerName: volunteer.name,
//     };
//   }

//   await missionModel.assignVolunteer(missionId, volunteerId);
//   await missionModel.updateStatus(missionId, "process");

//   const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
//   const notification = await notificationModel.sendNotification({
//     sender_id: organizationUser.id,
//     receiver_id: volunteerId,
//     type: "mission_accepted",
//     message: `${organizationUser.name} has accepted your mission request.`,
//     // message: "A Organization has accepted your mission request.",
//     meta: { missionId }
//   });

//   // Real-time push
//   notifyUser(volunteerId, notification);

//   return {
//     alreadyAssigned: false,
//     missionName: mission.name,
//     volunteerName: volunteer.name,
//   };
// };


exports.getAllFeeds = async (page, limit, currentUserId) => {
  const offset = (page - 1) * limit;

  const { feeds, total } = await missionModel.fetchAllFeeds(
    limit,
    offset,
    currentUserId
  );

  return {
    page,
    totalPages: Math.ceil(total / limit),
    totalFeeds: total,
    feeds
  };
};

// exports.startMission = async (missionId, volunteerId) => {
//   const mission = await missionModel.findById(missionId);
//   if (!mission) {
//     throw { type: "not_found", message: "Mission does not exist" };
//   }

//   const volunteer = await volunteerModel.findById(volunteerId);
//   if (!volunteer) {
//     throw { type: "not_found", message: "Volunteer does not exist" };
//   }

//   const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
//   if (!organizationUser) {
//     throw { type: "not_found", message: "Organization user not found" };
//   }

//   const currentTime = new Date();
//   const missionStartTime = new Date(mission.start_time);

//   // If mission is scheduled for future
//   if (missionStartTime > currentTime) {
//     // Set mission status = scheduled
//     await missionModel.updateStatus(missionId, "scheduled");
//     await missionModel.assignVolunteer(missionId, volunteerId);

//     // Notify volunteer
//     const volunteerNotification = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: volunteerId,
//       type: "mission_scheduled",
//       message: `Your mission "${mission.name}" is scheduled to start at ${missionStartTime.toLocaleString()}.`,
//       meta: { mission_id: missionId, start_time: mission.start_time, status: "scheduled" },
//     });

//     // Notify organization
//     const orgNotification = await notificationModel.sendNotification({
//       sender_id: volunteerId,
//       receiver_id: organizationUser.id,
//       type: "mission_scheduled",
//       message: `${volunteer.name} has confirmed participation. Mission "${mission.name}" will start at ${missionStartTime.toLocaleString()}.`,
//       meta: { mission_id: missionId, start_time: mission.start_time, status: "scheduled" },
//     });

//     notifyUser(volunteerId, volunteerNotification);
//     notifyUser(organizationUser.id, orgNotification);

//     return {
//       message: `Mission scheduled. It will start automatically at ${missionStartTime.toLocaleString()}.`,
//       status: "scheduled",
//     };
//   }

//   // If mission can start now
//   if (missionStartTime <= currentTime) {
//     await missionModel.updateStatus(missionId, "inprogress");
//     await missionModel.assignVolunteer(missionId, volunteerId);

//     // Notify organization that mission has started
//     const orgNotification = await notificationModel.sendNotification({
//       sender_id: volunteerId,
//       receiver_id: organizationUser.id,
//       type: "mission_started",
//       message: `${volunteer.name} has started your mission "${mission.name}".`,
//       meta: { mission_id: missionId, start_time: mission.start_time, status: "inprogress" },
//     });

//     // Notify volunteer that mission has started
//     const volunteerNotification = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: volunteerId,
//       type: "mission_started",
//       message: `You have started the mission "${mission.name}".`,
//       meta: { mission_id: missionId, start_time: mission.start_time, status: "inprogress" },
//     });

//     notifyUser(volunteerId, volunteerNotification);
//     notifyUser(organizationUser.id, orgNotification);

//     return {
//       missionName: mission.name,
//       volunteerName: volunteer.name,
//       status: "inprogress",
//       message: "Mission started successfully.",
//     };
//   }
// };


// vol start

// exports.startMission = async (missionId, volunteerId) => {
//   // Fetch mission and volunteer details
//   const mission = await missionModel.findById(missionId);
//   if (!mission) throw { type: "not_found", message: "Mission does not exist" };

//   const volunteer = await volunteerModel.findById(volunteerId);
//   if (!volunteer) throw { type: "not_found", message: "Volunteer does not exist" };

//   const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
//   if (!organizationUser) throw { type: "not_found", message: "Organization not found for this mission" };

//   // Compare times
//   const now = new Date();
//   const missionStartTime = new Date(mission.start_time);

//   // If mission is in the future (scheduled)
//   if (missionStartTime > now) {
//     await missionModel.updateStatus(missionId, "scheduled");
//     await missionModel.assignVolunteer(missionId, volunteerId);

//     // Notify volunteer
//     const volunteerNotification = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: volunteerId,
//       type: "mission_scheduled",
//       message: `Your mission "${mission.name}" will start at ${missionStartTime.toLocaleString()}. Please be ready.`,
//       meta: { mission_id: missionId, start_time: mission.start_time, status: "scheduled" },
//     });

//     // Notify organization
//     const orgNotification = await notificationModel.sendNotification({
//       sender_id: volunteerId,
//       receiver_id: organizationUser.id,
//       type: "mission_scheduled",
//       message: `${volunteer.name} confirmed participation. Mission "${mission.name}" is scheduled for ${missionStartTime.toLocaleString()}.`,
//       meta: { mission_id: missionId, start_time: mission.start_time, status: "scheduled" },
//     });

//     notifyUser(volunteerId, volunteerNotification);
//     notifyUser(organizationUser.id, orgNotification);

//     return {
//       status: "scheduled",
//       message: `Mission scheduled. It will start at ${missionStartTime.toLocaleString()}.`,
//     };
//   }

//   // If mission can start now
//   if (missionStartTime <= now) {
//     await missionModel.updateStatus(missionId, "inprogress");
//     await missionModel.assignVolunteer(missionId, volunteerId);

//     // Notify organization
//     const orgNotification = await notificationModel.sendNotification({
//       sender_id: volunteerId,
//       receiver_id: organizationUser.id,
//       type: "mission_started",
//       message: `${volunteer.name} has started your mission "${mission.name}".`,
//       meta: { mission_id: missionId, start_time: mission.start_time, status: "inprogress" },
//     });

//     // Notify volunteer
//     const volunteerNotification = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: volunteerId,
//       type: "mission_started",
//       message: `You have started the mission "${mission.name}". Good luck!`,
//       meta: { mission_id: missionId, start_time: mission.start_time, status: "inprogress" },
//     });

//     notifyUser(volunteerId, volunteerNotification);
//     notifyUser(organizationUser.id, orgNotification);

//     return {
//       status: "inprogress",
//       message: "Mission started successfully.",
//       missionName: mission.name,
//       volunteerName: volunteer.name,
//     };
//   }
// };

// exports.startMission = async (missionId, volunteerId) => {
// const mission = await missionModel.findById(missionId);
//   if (!mission) {
//     throw { type: "not_found", message: "Mission does not exist" };
//   }
//   const volunteer = await volunteerModel.findById(volunteerId);
//   if (!volunteer) {
//     throw { type: "not_found", message: "Volunteer does not exist" };
//   }

//   await missionModel.updateStatus(missionId, "inprogress");

//   await missionModel.assignVolunteer(missionId, volunteerId);
//   const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
//   const notification = await notificationModel.sendNotification({
//     sender_id: volunteerId,
//     receiver_id: organizationUser.id,
//     type: "mission_started",
//     message: `${volunteer.name} has started your mission.`,
//     meta: { missionId }
//   });

//   notifyUser(volunteerId, notification);

//   return {
//     missionName: mission.name,
//     volunteerName: volunteer.name,
//   };
// }

//////// Before set return message for scheduling
// exports.startMission = async (missionId, volunteerId) => {
//   const mission = await missionModel.findById(missionId);
//   if (!mission) throw { type: "not_found", message: "Mission does not exist" };

//   const volunteer = await volunteerModel.findById(volunteerId);
//   if (!volunteer) throw { type: "not_found", message: "Volunteer does not exist" };

//   const organizationUserId = await missionRequestModel.findMissionCreatorUser(missionId);

//   const currentTime = new Date();
//   const startTime = new Date(mission.start_time);

//   // Case 1: volunteer tries to start before actual time
//   if (currentTime < startTime) {
//     await missionModel.updateStatus(missionId, "scheduled");

//     await notificationModel.sendNotification({
//       sender_id: organizationUserId.id,
//       receiver_id: volunteer.id,
//       type: "mission_scheduled",
//       message: `Your mission "${mission.name}" will start at ${mission.start_time}.`,
//       meta: { missionId },
//     });

//     return {
//       message: `Mission will start at ${mission.start_time}.`,
//       data: { missionName: mission.name, volunteerName: volunteer.name },
//     };
//   }

//   // Case 2: start now
//   await missionModel.updateStatus(missionId, "inprogress");
//   await missionModel.assignVolunteer(missionId, volunteerId);

//   const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//   // Notify volunteer
//   const vNotif = await notificationModel.sendNotification({
//     sender_id: organizationUser?.id || null,
//     receiver_id: volunteerId,
//     type: "mission_started",
//     message: `Your mission "${mission.name}" has started.`,
//     meta: { missionId },
//   });
//   notifyUser(volunteerId, vNotif);

//   // Notify organization
//   const oNotif = await notificationModel.sendNotification({
//     sender_id: volunteerId,
//     receiver_id: organizationUser?.id || null,
//     type: "mission_started",
//     message: `${volunteer.name} has started your mission "${mission.name}".`,
//     meta: { missionId },
//   });
//   if (organizationUser) notifyUser(organizationUser.id, oNotif);

//   return {
//     message: "Mission started successfully",
//     data: { missionName: mission.name, volunteerName: volunteer.name },
//   };
// };


exports.startMission = async (missionId, volunteerId) => {
  const mission = await missionModel.findById(missionId);
  if (!mission) throw { type: "not_found", message: "Mission does not exist" };

  const volunteer = await volunteerModel.findById(volunteerId);
  if (!volunteer) throw { type: "not_found", message: "Volunteer does not exist" };

  const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
  const organizationUserId = organizationUser?.id || null;

  const startTimeVal = mission.raw_start_time || mission.start_time;
  const isFuture = isFutureTime(startTimeVal);
  const startTime = parseLocalDateTime(startTimeVal) || new Date();

  // Mission start time is in the future — schedule it
  if (isFuture) {
    if (mission.status !== 'completion_requested') {
      await missionModel.updateStatus(missionId, "scheduled");
    }

    const notif = await notificationModel.sendNotification({
      sender_id: organizationUserId,
      receiver_id: volunteer.id,
      type: "mission_scheduled",
      message: `Your mission "${mission.name}" is scheduled to start at ${startTime.toLocaleString()}.`,
      meta: { missionId },
    });
    notifyUser(volunteer.id, notif);

    return {
      message: `Mission "${mission.name}" is scheduled to start at ${startTime.toLocaleString()}.`,
      data: {
        missionName: mission.name,
        volunteerName: volunteer.name,
        startTime: startTime,
        status: mission.status === 'completion_requested' ? 'completion_requested' : 'scheduled',
      },
    };
  }

  // Mission should start now or already started
  if (mission.status !== 'completion_requested') {
    await missionModel.updateStatus(missionId, "inprogress");
  }
  await missionModel.assignVolunteer(missionId, volunteerId, null, 'in_progress');

  // Notify volunteer
  // const vNotif = await notificationModel.sendNotification({
  //   sender_id: organizationUserId,
  //   receiver_id: volunteerId,
  //   type: "mission_started",
  //   message: `Your mission "${mission.name}" has started.`,
  //   meta: { missionId },
  // });
  // notifyUser(volunteerId, vNotif);

  // Notify organization
  const oNotif = await notificationModel.sendNotification({
    sender_id: volunteerId,
    receiver_id: organizationUserId,
    type: "mission_started",
    message: `${volunteer.name} has started your mission "${mission.name}".`,
    meta: { missionId },
  });
  if (organizationUserId) notifyUser(organizationUserId, oNotif);

  // Notify volunteer's group who added him
  const invitedBy = volunteer.invitedBy !== undefined ? volunteer.invitedBy : volunteer.invitedby;
  if (invitedBy) {
    try {
      const groupNotif = await notificationModel.sendNotification({
        sender_id: volunteerId,
        receiver_id: invitedBy,
        type: "volunteer_started_mission",
        message: `${volunteer.name} has started the mission "${mission.name}".`,
        meta: { missionId, volunteerId },
      });
      notifyUser(invitedBy, groupNotif);
    } catch (notifErr) {
      console.error("⚠️  Group notification on start failed:", notifErr.message);
    }
  }

  return {
    message: `Mission "${mission.name}" has started successfully.`,
    data: {
      missionName: mission.name,
      volunteerName: volunteer.name,
      startTime: startTime,
      status: mission.status === 'completion_requested' ? 'completion_requested' : 'inprogress',
    },
  };
};

// exports.startMission = async (missionId, volunteerId) => {
//   const mission = await missionModel.findById(missionId);
//   if (!mission) throw { type: "not_found", message: "Mission does not exist" };

//   const volunteer = await volunteerModel.findById(volunteerId);
//   if (!volunteer) throw { type: "not_found", message: "Volunteer does not exist" };

//   const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
//   const organizationUserId = organizationUser?.id || null;

//   const currentTime = new Date();
//   const startTime = new Date(mission.start_time);

//   // Mission start time is in the future — schedule it
//   if (currentTime < startTime) {
//     await missionModel.updateStatus(missionId, "scheduled");

//     const notif = await notificationModel.sendNotification({
//       sender_id: organizationUserId,
//       receiver_id: volunteer.id,
//       type: "mission_scheduled",
//       message: `Your mission "${mission.name}" is scheduled to start at ${startTime.toLocaleString()}.`,
//       meta: { missionId },
//     });
//     notifyUser(volunteer.id, notif);

//     return {
//       message: `Mission "${mission.name}" is scheduled to start at ${startTime.toLocaleString()}.`,
//       data: {
//         missionName: mission.name,
//         volunteerName: volunteer.name,
//         startTime: startTime,
//         status: "scheduled",
//       },
//     };
//   }

//   // Mission should start now or already started
//   await missionModel.updateStatus(missionId, "inprogress");
//   await missionModel.assignVolunteer(missionId, volunteerId, null, 'in_progress');
// //   await missionModel.assignVolunteer(missionId, volunteerId);

//   // Notify volunteer
//   // const vNotif = await notificationModel.sendNotification({
//   //   sender_id: organizationUserId,
//   //   receiver_id: volunteerId,
//   //   type: "mission_started",
//   //   message: `Your mission "${mission.name}" has started.`,
//   //   meta: { missionId },
//   // });
//   // notifyUser(volunteerId, vNotif);

//   // Notify organization
//   const oNotif = await notificationModel.sendNotification({
//     sender_id: volunteerId,
//     receiver_id: organizationUserId,
//     type: "mission_started",
//     message: `${volunteer.name} has started your mission "${mission.name}".`,
//     meta: { missionId },
//   });
//   if (organizationUserId) notifyUser(organizationUserId, oNotif);

//   // Notify volunteer's group who added him
//   const invitedBy = volunteer.invitedBy !== undefined ? volunteer.invitedBy : volunteer.invitedby;
//   if (invitedBy) {
//     try {
//       const groupNotif = await notificationModel.sendNotification({
//         sender_id: volunteerId,
//         receiver_id: invitedBy,
//         type: "volunteer_started_mission",
//         message: `${volunteer.name} has started the mission "${mission.name}".`,
//         meta: { missionId, volunteerId },
//       });
//       notifyUser(invitedBy, groupNotif);
//     } catch (notifErr) {
//       console.error("⚠️  Group notification on start failed:", notifErr.message);
//     }
//   }

//   return {
//     message: `Mission "${mission.name}" has started successfully.`,
//     data: {
//       missionName: mission.name,
//       volunteerName: volunteer.name,
//       startTime: startTime,
//       status: "inprogress",
//     },
//   };
// };

//////////// Previous 17 july
// exports.startMission = async (missionId, volunteerId) => {
//   const mission = await missionModel.findById(missionId);
//   if (!mission) throw { type: "not_found", message: "Mission does not exist" };

//   const volunteer = await volunteerModel.findById(volunteerId);
//   if (!volunteer) throw { type: "not_found", message: "Volunteer does not exist" };

//   const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
//   const organizationUserId = organizationUser?.id || null;

//   const currentTime = new Date();
//   const startTime = new Date(mission.start_time);

//   // Mission start time is in the future — schedule it
//   if (currentTime < startTime) {
//     await missionModel.updateStatus(missionId, "scheduled");

//     const notif = await notificationModel.sendNotification({
//       sender_id: organizationUserId,
//       receiver_id: volunteer.id,
//       type: "mission_scheduled",
//       message: `Your mission "${mission.name}" is scheduled to start at ${startTime.toLocaleString()}.`,
//       meta: { missionId },
//     });
//     notifyUser(volunteer.id, notif);

//     return {
//       message: `Mission "${mission.name}" is scheduled to start at ${startTime.toLocaleString()}.`,
//       data: {
//         missionName: mission.name,
//         volunteerName: volunteer.name,
//         startTime: startTime,
//         status: "scheduled",
//       },
//     };
//   }

//   // Mission should start now or already started
//   await missionModel.updateStatus(missionId, "inprogress");
//   await missionModel.assignVolunteer(missionId, volunteerId);

//   // Notify volunteer
//   // const vNotif = await notificationModel.sendNotification({
//   //   sender_id: organizationUserId,
//   //   receiver_id: volunteerId,
//   //   type: "mission_started",
//   //   message: `Your mission "${mission.name}" has started.`,
//   //   meta: { missionId },
//   // });
//   // notifyUser(volunteerId, vNotif);

//   // Notify organization
//   const oNotif = await notificationModel.sendNotification({
//     sender_id: volunteerId,
//     receiver_id: organizationUserId,
//     type: "mission_started",
//     message: `${volunteer.name} has started your mission "${mission.name}".`,
//     meta: { missionId },
//   });
//   if (organizationUserId) notifyUser(organizationUserId, oNotif);

//   // Notify volunteer's group who added him
//   if (volunteer.invitedBy) {
//     try {
//       const groupNotif = await notificationModel.sendNotification({
//         sender_id: volunteerId,
//         receiver_id: volunteer.invitedBy,
//         type: "volunteer_started_mission",
//         message: `${volunteer.name} has started the mission "${mission.name}".`,
//         meta: { missionId, volunteerId },
//       });
//       notifyUser(volunteer.invitedBy, groupNotif);
//     } catch (notifErr) {
//       console.error("Group notification on start failed:", notifErr.message);
//     }
//   }

//   return {
//     message: `Mission "${mission.name}" has started successfully.`,
//     data: {
//       missionName: mission.name,
//       volunteerName: volunteer.name,
//       startTime: startTime,
//       status: "inprogress",
//     },
//   };
// };


// exports.startMission = async (missionId, volunteerId) => {
//   const mission = await missionModel.findById(missionId);
//   if (!mission) throw { type: "not_found", message: "Mission does not exist" };

//   const volunteer = await volunteerModel.findById(volunteerId);
//   if (!volunteer) throw { type: "not_found", message: "Volunteer does not exist" };

//   const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
//   const organizationUserId = organizationUser?.id || null;

//   const currentTime = new Date();
//   const startTime = new Date(mission.start_time);

//   // Mission start time is in the future — schedule it
//   if (currentTime < startTime) {
//     await missionModel.updateStatus(missionId, "scheduled");

//     const notif = await notificationModel.sendNotification({
//       sender_id: organizationUserId,
//       receiver_id: volunteer.id,
//       type: "mission_scheduled",
//       message: `Your mission "${mission.name}" is scheduled to start at ${startTime.toLocaleString()}.`,
//       meta: { missionId },
//     });
//     notifyUser(volunteer.id, notif);

//     return {
//       message: `Mission "${mission.name}" is scheduled to start at ${startTime.toLocaleString()}.`,
//       data: {
//         missionName: mission.name,
//         volunteerName: volunteer.name,
//         startTime: startTime,
//         status: "scheduled",
//       },
//     };
//   }

//   // Mission should start now or already started
//   await missionModel.updateStatus(missionId, "inprogress");
//   await missionModel.assignVolunteer(missionId, volunteerId);

//   // Notify volunteer
//   // const vNotif = await notificationModel.sendNotification({
//   //   sender_id: organizationUserId,
//   //   receiver_id: volunteerId,
//   //   type: "mission_started",
//   //   message: `Your mission "${mission.name}" has started.`,
//   //   meta: { missionId },
//   // });
//   // notifyUser(volunteerId, vNotif);

//   // Notify organization
//   const oNotif = await notificationModel.sendNotification({
//     sender_id: volunteerId,
//     receiver_id: organizationUserId,
//     type: "mission_started",
//     message: `${volunteer.name} has started your mission "${mission.name}".`,
//     meta: { missionId },
//   });
//   if (organizationUserId) notifyUser(organizationUserId, oNotif);

//   return {
//     message: `Mission "${mission.name}" has started successfully.`,
//     data: {
//       missionName: mission.name,
//       volunteerName: volunteer.name,
//       startTime: startTime,
//       status: "inprogress",
//     },
//   };
// };


exports.addPendingRequests = async (missionId, volunteerIds) => {
  for (let userId of volunteerIds) {
    await missionModel.addPendingRequest(missionId, userId);
  }
};

exports.rejectMissionRequest = async (missionId, volunteerId) => {
  if (!missionId || !volunteerId) {
    throw new AppError("Mission ID and Volunteer ID are required", 400);
  }

  const pool = await connectDB();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[user]] = await connection.query(
      "SELECT type, name FROM users WHERE id = ?",
      [volunteerId]
    );
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const mission = await missionModel.findById(missionId);
    if (!mission) {
      throw new AppError("Mission not found", 404);
    }

    if (user.type === 'volunteer_group') {
      const groupUserId = volunteerId;
      const groupName = user.name;

      // Update volunteer_group_applications status to rejected
      await connection.query(
        "UPDATE volunteer_group_applications SET status = 'rejected' WHERE group_id = ? AND mission_id = ?",
        [groupUserId, missionId]
      );

      // Delete group pending volunteers
      await connection.query(
        "DELETE FROM mission_assigned_volunteers WHERE mission_id = ? AND assigned_by = ? AND status = 'group_pending'",
        [missionId, groupUserId]
      );

      // Set overall mission status to open only if there are no accepted/active assigned volunteers left
      const [[{ acceptedCount }]] = await connection.query(
        `SELECT COUNT(*) AS acceptedCount 
         FROM mission_assigned_volunteers mav
         LEFT JOIN volunteer_group_applications vga 
           ON vga.mission_id = mav.mission_id 
           AND vga.group_id = mav.assigned_by
         WHERE mav.mission_id = ? 
           AND (mav.assigned_by IS NULL OR vga.status = 'accepted')`,
        [missionId]
      );
      if (acceptedCount === 0) {
        await missionModel.updateStatus(missionId, "open");
      }

      const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

      // Clean up group application notification
      await notificationModel.deleteNotificationByMeta({
        sender_id: groupUserId,
        receiver_id: organizationUser.id,
        type: "group_assigned_volunteer",
        mission_id: missionId
      }, connection);

      // Send rejection notification to group user
      const notification = await notificationModel.sendNotification({
        sender_id: organizationUser.id,
        receiver_id: groupUserId,
        type: "mission_rejected",
        message: `${organizationUser.name} has rejected your application for the mission '${mission.name}'.`,
        meta: { missionId },
      });
      notifyUser(groupUserId, notification);

      await connection.commit();
      return {
        alreadyAssigned: false,
        deleted: true,
        missionName: mission.name,
        volunteerName: groupName,
        message: "Volunteer group request successfully rejected.",
      };
    }

    const volunteer = await volunteerModel.findById(volunteerId);
    if (!volunteer) {
      throw new AppError("Volunteer not found", 404);
    }

    const alreadyAssigned = await missionModel.isVolunteerAssigned(missionId, volunteerId);
    if (alreadyAssigned) {
      await connection.rollback();
      return {
        alreadyAssigned: true,
        deleted: false,
        missionName: mission.name || "Unknown Mission",
        volunteerName: volunteer.name || "Unknown Volunteer",
        message: "Volunteer is already assigned to this mission.",
      };
    }

    const deleted = await missionModel.deletePendingRequest(missionId, volunteerId);
    if (!deleted) {
      throw new AppError("No pending mission request found", 404);
    }

    await missionModel.updateStatus(missionId, "open");

    const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

    await notificationModel.deleteNotificationByMeta({
      sender_id: volunteerId,
      receiver_id: organizationUser.id,
      type: "mission_request",
      mission_id: missionId
    }, connection);

    const notification = await notificationModel.sendNotification({
      sender_id: organizationUser.id,
      receiver_id: volunteerId,
      type: "mission_rejected",
      message: `${organizationUser.name} has rejected your mission request.`,
      meta: { missionId },
    }, connection);

    notifyUser(volunteerId, notification);

    await connection.commit();

    return {
      alreadyAssigned: false,
      deleted: true,
      missionName: mission.name || "Unknown Mission",
      volunteerName: volunteer.name || "Unknown Volunteer",
      message: "Volunteer request successfully rejected.",
    };
  } catch (err) {
    await connection.rollback();
    console.error("Error in rejectMissionRequest:", err);
    throw err instanceof AppError
      ? err
      : new AppError(err.message || "Failed to reject mission request", 500);
  } finally {
    connection.release();
  }
};

// exports.rejectMissionRequest = async (missionId, volunteerId) => {
//   if (!missionId || !volunteerId) {
//     throw new AppError("Mission ID and Volunteer ID are required", 400);
//   }

//   const pool = await connectDB();
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [[user]] = await connection.query(
//       "SELECT type, name FROM users WHERE id = ?",
//       [volunteerId]
//     );
//     if (!user) {
//       throw new AppError("User not found", 404);
//     }

//     const mission = await missionModel.findById(missionId);
//     if (!mission) {
//       throw new AppError("Mission not found", 404);
//     }

//     if (user.type === 'volunteer_group') {
//       const groupUserId = volunteerId;
//       const groupName = user.name;

//       // Update volunteer_group_applications status to rejected
//       await connection.query(
//         "UPDATE volunteer_group_applications SET status = 'rejected' WHERE group_id = ? AND mission_id = ?",
//         [groupUserId, missionId]
//       );

//       // Delete group pending volunteers
//       await connection.query(
//         "DELETE FROM mission_assigned_volunteers WHERE mission_id = ? AND assigned_by = ? AND status = 'group_pending'",
//         [missionId, groupUserId]
//       );

//       // Set overall mission status to open only if there are no accepted/active assigned volunteers left
//       const [[{ acceptedCount }]] = await connection.query(
//         "SELECT COUNT(*) AS acceptedCount FROM mission_assigned_volunteers WHERE mission_id = ? AND status != 'group_pending'",
//         [missionId]
//       );
//       if (acceptedCount === 0) {
//         await missionModel.updateStatus(missionId, "open");
//       }

//       const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//       // Clean up group application notification
//       await notificationModel.deleteNotificationByMeta({
//         sender_id: groupUserId,
//         receiver_id: organizationUser.id,
//         type: "group_assigned_volunteer",
//         mission_id: missionId
//       }, connection);

//       // Send rejection notification to group user
//       const notification = await notificationModel.sendNotification({
//         sender_id: organizationUser.id,
//         receiver_id: groupUserId,
//         type: "mission_rejected",
//         message: `${organizationUser.name} has rejected your application for the mission '${mission.name}'.`,
//         meta: { missionId },
//       });
//       notifyUser(groupUserId, notification);

//       await connection.commit();
//       return {
//         alreadyAssigned: false,
//         deleted: true,
//         missionName: mission.name,
//         volunteerName: groupName,
//         message: "Volunteer group request successfully rejected.",
//       };
//     }

//     const volunteer = await volunteerModel.findById(volunteerId);
//     if (!volunteer) {
//       throw new AppError("Volunteer not found", 404);
//     }

//     const alreadyAssigned = await missionModel.isVolunteerAssigned(missionId, volunteerId);
//     if (alreadyAssigned) {
//       await connection.rollback();
//       return {
//         alreadyAssigned: true,
//         deleted: false,
//         missionName: mission.name || "Unknown Mission",
//         volunteerName: volunteer.name || "Unknown Volunteer",
//         message: "Volunteer is already assigned to this mission.",
//       };
//     }

//     const deleted = await missionModel.deletePendingRequest(missionId, volunteerId);
//     if (!deleted) {
//       throw new AppError("No pending mission request found", 404);
//     }

//     await missionModel.updateStatus(missionId, "open");

//     const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//     await notificationModel.deleteNotificationByMeta({
//       sender_id: volunteerId,
//       receiver_id: organizationUser.id,
//       type: "mission_request",
//       mission_id: missionId
//     }, connection);

//     const notification = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: volunteerId,
//       type: "mission_rejected",
//       message: `${organizationUser.name} has rejected your mission request.`,
//       meta: { missionId },
//     }, connection);

//     notifyUser(volunteerId, notification);

//     await connection.commit();

//     return {
//       alreadyAssigned: false,
//       deleted: true,
//       missionName: mission.name || "Unknown Mission",
//       volunteerName: volunteer.name || "Unknown Volunteer",
//       message: "Volunteer request successfully rejected.",
//     };
//   } catch (err) {
//     await connection.rollback();
//     console.error("Error in rejectMissionRequest:", err);
//     throw err instanceof AppError
//       ? err
//       : new AppError(err.message || "Failed to reject mission request", 500);
//   } finally {
//     connection.release();
//   }
// };

// Before Vol grp work above code is new
// exports.rejectMissionRequest = async (missionId, volunteerId) => {
//   if (!missionId || !volunteerId) {
//     throw new AppError("Mission ID and Volunteer ID are required", 400);
//   }

//   const pool = await connectDB();
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [[user]] = await connection.query(
//       "SELECT type, name FROM users WHERE id = ?",
//       [volunteerId]
//     );
//     if (!user) {
//       throw new AppError("User not found", 404);
//     }

//     const mission = await missionModel.findById(missionId);
//     if (!mission) {
//       throw new AppError("Mission not found", 404);
//     }

//     if (user.type === 'volunteer_group') {
//       const groupUserId = volunteerId;
//       const groupName = user.name;

//       // Update volunteer_group_applications status to rejected
//       await connection.query(
//         "UPDATE volunteer_group_applications SET status = 'rejected' WHERE group_id = ? AND mission_id = ?",
//         [groupUserId, missionId]
//       );

//       // Delete group pending volunteers
//       await connection.query(
//         "DELETE FROM mission_assigned_volunteers WHERE mission_id = ? AND assigned_by = ? AND status = 'group_pending'",
//         [missionId, groupUserId]
//       );

//       // Set overall mission status to open
//       await missionModel.updateStatus(missionId, "open");

//       const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//       // Clean up group application notification
//       await notificationModel.deleteNotificationByMeta({
//         sender_id: groupUserId,
//         receiver_id: organizationUser.id,
//         type: "group_assigned_volunteer",
//         mission_id: missionId
//       }, connection);

//       // Send rejection notification to group user
//       const notification = await notificationModel.sendNotification({
//         sender_id: organizationUser.id,
//         receiver_id: groupUserId,
//         type: "mission_rejected",
//         message: `${organizationUser.name} has rejected your application for the mission '${mission.name}'.`,
//         meta: { missionId },
//       });
//       notifyUser(groupUserId, notification);

//       await connection.commit();
//       return {
//         alreadyAssigned: false,
//         deleted: true,
//         missionName: mission.name,
//         volunteerName: groupName,
//         message: "Volunteer group request successfully rejected.",
//       };
//     }

//     const volunteer = await volunteerModel.findById(volunteerId);
//     if (!volunteer) {
//       throw new AppError("Volunteer not found", 404);
//     }

//     const alreadyAssigned = await missionModel.isVolunteerAssigned(missionId, volunteerId);
//     if (alreadyAssigned) {
//       await connection.rollback();
//       return {
//         alreadyAssigned: true,
//         deleted: false,
//         missionName: mission.name || "Unknown Mission",
//         volunteerName: volunteer.name || "Unknown Volunteer",
//         message: "Volunteer is already assigned to this mission.",
//       };
//     }

//     const deleted = await missionModel.deletePendingRequest(missionId, volunteerId);
//     if (!deleted) {
//       throw new AppError("No pending mission request found", 404);
//     }

//     await missionModel.updateStatus(missionId, "open");

//     const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//     await notificationModel.deleteNotificationByMeta({
//       sender_id: volunteerId,
//       receiver_id: organizationUser.id,
//       type: "mission_request",
//       mission_id: missionId
//     }, connection);

//     const notification = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: volunteerId,
//       type: "mission_rejected",
//       message: `${organizationUser.name} has rejected your mission request.`,
//       meta: { missionId },
//     }, connection);

//     notifyUser(volunteerId, notification);

//     await connection.commit();

//     return {
//       alreadyAssigned: false,
//       deleted: true,
//       missionName: mission.name || "Unknown Mission",
//       volunteerName: volunteer.name || "Unknown Volunteer",
//       message: "Volunteer request successfully rejected.",
//     };
//   } catch (err) {
//     await connection.rollback();
//     console.error("Error in rejectMissionRequest:", err);
//     throw err instanceof AppError
//       ? err
//       : new AppError(err.message || "Failed to reject mission request", 500);
//   } finally {
//     connection.release();
//   }
// };

// Before Group Request process 24 July
// exports.rejectMissionRequest = async (missionId, volunteerId) => {
//   if (!missionId || !volunteerId) {
//     throw new AppError("Mission ID and Volunteer ID are required", 400);
//   }

//   const pool = await connectDB();
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const mission = await missionModel.findById(missionId);
//     if (!mission) {
//       throw new AppError("Mission not found", 404);
//     }

//     const volunteer = await volunteerModel.findById(volunteerId);
//     if (!volunteer) {
//       throw new AppError("Volunteer not found", 404);
//     }

//     const alreadyAssigned = await missionModel.isVolunteerAssigned(missionId, volunteerId);
//     if (alreadyAssigned) {
//       await connection.rollback();
//       return {
//         alreadyAssigned: true,
//         deleted: false,
//         missionName: mission.name || "Unknown Mission",
//         volunteerName: volunteer.name || "Unknown Volunteer",
//         message: "Volunteer is already assigned to this mission.",
//       };
//     }

//     const deleted = await missionModel.deletePendingRequest(missionId, volunteerId);
//     if (!deleted) {
//       throw new AppError("No pending mission request found", 404);
//     }

//     await missionModel.updateStatus(missionId, "open");

//     const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//     await notificationModel.deleteNotificationByMeta({
//       sender_id: volunteerId,
//       receiver_id: organizationUser.id,
//       type: "mission_request",
//       mission_id: missionId
//     }, connection);

//     const notification = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: volunteerId,
//       type: "mission_rejected",
//       message: `${organizationUser.name} has rejected your mission request.`,
//       meta: { missionId },
//     }, connection);

//     notifyUser(volunteerId, notification);

//     await connection.commit();

//     return {
//       alreadyAssigned: false,
//       deleted: true,
//       missionName: mission.name || "Unknown Mission",
//       volunteerName: volunteer.name || "Unknown Volunteer",
//       message: "Volunteer request successfully rejected.",
//     };
//   } catch (err) {
//     await connection.rollback();
//     console.error("Error in rejectMissionRequest:", err);
//     throw err instanceof AppError
//       ? err
//       : new AppError(err.message || "Failed to reject mission request", 500);
//   } finally {
//     connection.release();
//   }
// };

// exports.rejectMissionRequest = async (missionId, volunteerId) => {
//   if (!missionId || !volunteerId) {
//     throw new AppError("Mission ID and Volunteer ID are required", 400);
//   }

//   const pool = await connectDB();
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const mission = await missionModel.findById(missionId);
//     if (!mission) {
//       throw new AppError("Mission not found", 404);
//     }

//     const volunteer = await volunteerModel.findById(volunteerId);
//     if (!volunteer) {
//       throw new AppError("Volunteer not found", 404);
//     }

//     const alreadyAssigned = await missionModel.isVolunteerAssigned(missionId, volunteerId);
//     if (alreadyAssigned) {
//       await connection.rollback();
//       return {
//         alreadyAssigned: true,
//         deleted: false,
//         missionName: mission.name || "Unknown Mission",
//         volunteerName: volunteer.name || "Unknown Volunteer",
//         message: "Volunteer is already assigned to this mission.",
//       };
//     }

//     const deleted = await missionModel.deletePendingRequest(missionId, volunteerId);
//     if (!deleted) {
//       throw new AppError("No pending mission request found", 404);
//     }

//     await missionModel.updateStatus(missionId, "open");

//     const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//     await notificationModel.deleteNotificationByMeta({
//       sender_id: volunteerId,
//       receiver_id: organizationUser.id,
//       type: "mission_request",
//       mission_id: missionId
//     }, connection);

//     const notification = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: volunteerId,
//       type: "mission_rejected",
//       message: `${organizationUser.name} has rejected your mission request.`,
//       meta: { missionId },
//     }, connection);

//     notifyUser(volunteerId, notification);

//     await connection.commit();

//     return {
//       alreadyAssigned: false,
//       deleted: true,
//       missionName: mission.name || "Unknown Mission",
//       volunteerName: volunteer.name || "Unknown Volunteer",
//       message: "Volunteer request successfully rejected.",
//     };
//   } catch (err) {
//     await connection.rollback();
//     console.error("Error in rejectMissionRequest:", err);
//     throw err instanceof AppError
//       ? err
//       : new AppError(err.message || "Failed to reject mission request", 500);
//   } finally {
//     connection.release();
//   }
// };

// exports.rejectMissionRequest = async (missionId, volunteerId) => {
//   if (!missionId || !volunteerId) {
//     throw new AppError("Mission ID and Volunteer ID are required", 400);
//   }

//   const pool = await connectDB();
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     // Use the same connection for all DB operations
//     const mission = await missionModel.findById(missionId, connection);
//     if (!mission) {
//       throw new AppError("Mission not found", 404);
//     }

//     const volunteer = await volunteerModel.findById(volunteerId, connection);
//     if (!volunteer) {
//       throw new AppError("Volunteer not found", 404);
//     }

//     const alreadyAssigned = await missionModel.isVolunteerAssigned(
//       missionId,
//       volunteerId,
//       connection
//     );

//     if (alreadyAssigned) {
//       await connection.rollback();
//       return {
//         alreadyAssigned: true,
//         deleted: false,
//         missionName: mission.name || "Unknown Mission",
//         volunteerName: volunteer.name || "Unknown Volunteer",
//         message: "Volunteer is already assigned to this mission.",
//       };
//     }

//     // Delete pending request
//     const deleted = await missionModel.deletePendingRequest(
//       missionId,
//       volunteerId,
//       connection
//     );

//     if (!deleted) {
//       throw new AppError("No pending mission request found", 404);
//     }

//     // Update mission status
//     await missionModel.updateStatus(missionId, "open", connection);

//     // Get mission creator
//     const organizationUser =
//       await missionRequestModel.findMissionCreatorUser(
//         missionId,
//         connection
//       );

//     // Delete previous mission request notification
//     await notificationModel.deleteNotificationByMeta(
//       {
//         sender_id: Number(volunteerId),
//         receiver_id: Number(organizationUser.id),
//         type: "mission_request",
//         mission_id: Number(missionId),
//       },
//       connection
//     );

//     // Create rejection notification using the same connection
//     const notification = await notificationModel.sendNotification(
//       {
//         sender_id: Number(organizationUser.id),
//         receiver_id: Number(volunteerId),
//         type: "mission_rejected",
//         message: `${organizationUser.name} has rejected your mission request.`,
//         meta: { mission_id: Number(missionId) }, // Standardized key
//       },
//       connection
//     );

//     // Commit transaction before emitting socket event
//     await connection.commit();

//     // Emit real-time notification after successful commit
//     notifyUser(volunteerId, notification);

//     return {
//       alreadyAssigned: false,
//       deleted: true,
//       missionName: mission.name || "Unknown Mission",
//       volunteerName: volunteer.name || "Unknown Volunteer",
//       message: "Volunteer request successfully rejected.",
//     };
//   } catch (err) {
//     await connection.rollback();
//     console.error("Error in rejectMissionRequest:", err);

//     throw err instanceof AppError
//       ? err
//       : new AppError(
//           err.message || "Failed to reject mission request",
//           500
//         );
//   } finally {
//     connection.release();
//   }
// };


// exports.rejectMissionRequest = async (missionId, volunteerId) => {
//   if (!missionId || !volunteerId) {
//     throw new AppError("Mission ID and Volunteer ID are required", 400);
//   }

//   const pool = await connectDB();
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const mission = await missionModel.findById(missionId);
//     if (!mission) {
//       throw new AppError("Mission not found", 404);
//     }

//     const volunteer = await volunteerModel.findById(volunteerId);
//     if (!volunteer) {
//       throw new AppError("Volunteer not found", 404);
//     }

//     const alreadyAssigned = await missionModel.isVolunteerAssigned(missionId, volunteerId);
//     if (alreadyAssigned) {
//       await connection.rollback();
//       return {
//         alreadyAssigned: true,
//         deleted: false,
//         missionName: mission.name || "Unknown Mission",
//         volunteerName: volunteer.name || "Unknown Volunteer",
//         message: "Volunteer is already assigned to this mission.",
//       };
//     }

//     const deleted = await missionModel.deletePendingRequest(missionId, volunteerId);
//     if (!deleted) {
//       throw new AppError("No pending mission request found", 404);
//     }

//     await missionModel.updateStatus(missionId, "open");

//     const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//     console.log("Delete Notification Params:", {
//       sender_id: volunteerId,
//       receiver_id: organizationUser.id,
//       type: "mission_request",
//       mission_id: missionId,
//     });

//     await notificationModel.deleteNotificationByMeta({
//       sender_id: volunteerId,
//       receiver_id: organizationUser.id,
//       type: "mission_request",
//       mission_id: missionId
//     }, connection);

//     const notification = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: volunteerId,
//       type: "mission_rejected",
//       message: `${organizationUser.name} has rejected your mission request.`,
//       meta: { missionId },
//     });

//     notifyUser(volunteerId, notification);

//     await connection.commit();

//     return {
//       alreadyAssigned: false,
//       deleted: true,
//       missionName: mission.name || "Unknown Mission",
//       volunteerName: volunteer.name || "Unknown Volunteer",
//       message: "Volunteer request successfully rejected.",
//     };
//   } catch (err) {
//     await connection.rollback();
//     console.error("Error in rejectMissionRequest:", err);
//     throw err instanceof AppError
//       ? err
//       : new AppError(err.message || "Failed to reject mission request", 500);
//   } finally {
//     connection.release();
//   }
// };

// exports.rejectMissionRequest = async (missionId, volunteerId) => {
//   if (!missionId || !volunteerId) {
//     throw new AppError("Mission ID and Volunteer ID are required", 400);
//   }

//   const pool = await connectDB();
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const mission = await missionModel.findById(missionId);
//     if (!mission) {
//       throw new AppError("Mission not found", 404);
//     }

//     const volunteer = await volunteerModel.findById(volunteerId);
//     if (!volunteer) {
//       throw new AppError("Volunteer not found", 404);
//     }

//     const alreadyAssigned = await missionModel.isVolunteerAssigned(missionId, volunteerId);
//     if (alreadyAssigned) {
//       await connection.rollback();
//       return {
//         alreadyAssigned: true,
//         deleted: false,
//         missionName: mission.name || "Unknown Mission",
//         volunteerName: volunteer.name || "Unknown Volunteer",
//         message: "Volunteer is already assigned to this mission.",
//       };
//     }

//     const deleted = await missionModel.deletePendingRequest(missionId, volunteerId);
//     if (!deleted) {
//       throw new AppError("No pending mission request found", 404);
//     }

//     await missionModel.updateStatus(missionId, "open");
//     // await missionModel.updateStatus(missionId, "pending");

//     const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//     const notification = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: volunteerId,
//       type: "mission_rejected",
//       message: `${organizationUser.name} has rejected your mission request.`,
//       meta: { missionId },
//     });

//     notifyUser(volunteerId, notification);

//     await connection.commit();

//     return {
//       alreadyAssigned: false,
//       deleted: true,
//       missionName: mission.name || "Unknown Mission",
//       volunteerName: volunteer.name || "Unknown Volunteer",
//       message: "Volunteer request successfully rejected.",
//     };
//   } catch (err) {
//     await connection.rollback();
//     console.error("Error in rejectMissionRequest:", err);
//     throw err instanceof AppError
//       ? err
//       : new AppError(err.message || "Failed to reject mission request", 500);
//   } finally {
//     connection.release();
//   }
// };


exports.rejectMissionCompletion = async (missionId, volunteerId) => {
  const pool = await connectDB();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Mark mission back to assigned status
    const [updateResult] = await conn.query(
      "UPDATE missions SET status = 'rejected' WHERE id = ?",
      [missionId]
    );

    if (updateResult.affectedRows === 0) {
      throw new AppError(404, `Mission with ID ${missionId} not found.`);
    }

    // Delete the pending completion request logic if applicable
    await missionModel.deletePendingRequest(missionId, volunteerId, conn);

    await conn.commit();

  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  // Notify volunteer or group
  try {
    const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
    const volunteer = await volunteerModel.findById(volunteerId);
    const invitedBy = volunteer && (volunteer.invitedBy !== undefined ? volunteer.invitedBy : volunteer.invitedby);

    if (organizationUser) {
      const senderOfRequest = invitedBy || volunteerId;
      const receiverId = invitedBy || volunteerId;

      // Delete previous completion request notification
      await notificationModel.deleteNotificationByMeta({
        sender_id: senderOfRequest,
        receiver_id: organizationUser.id,
        type: "mission_completion_request",
        mission_id: missionId
      });

      const notification = await notificationModel.sendNotification({
        sender_id: organizationUser.id,
        receiver_id: receiverId,
        type: "mission_completion_rejected",
        message: `${organizationUser.name} has rejected your mission completion request.`,
        meta: { missionId, volunteerId },
      });

      notifyUser(receiverId, notification);
    }
  } catch (notifyError) {
    console.error("Notification failed:", notifyError.message);
  }

  return { success: true, message: "Mission completion rejected successfully." };
};

// exports.rejectMissionCompletion = async (missionId, volunteerId) => {
//   const pool = await connectDB();
//   const conn = await pool.getConnection();

//   try {
//     await conn.beginTransaction();

// console.log("Updating mission:", missionId);
// const [updateResult] = await conn.query(
//   "UPDATE missions SET status = 'rejected' WHERE id = ?",
//   [missionId]
// );
// console.log("Update result:", updateResult);

//     if (updateResult.affectedRows === 0) {
//       throw new AppError(404, `Mission with ID ${missionId} not found.`);
//     }

//     // Delete the pending completion request logic if applicable
//     await missionModel.deletePendingRequest(missionId, volunteerId, conn);

//     await conn.commit();

//   } catch (error) {
//     await conn.rollback();
//     throw error;
//   } finally {
//     conn.release();
//   }

//   // Notify volunteer
//   try {
//     const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//     if (organizationUser) {
//       const notification = await notificationModel.sendNotification({
//         sender_id: organizationUser.id,
//         receiver_id: volunteerId,
//         type: "mission_completion_rejected",
//         message: `${organizationUser.name} has rejected your mission completion request.`,
//         meta: { missionId },
//       });

//       notifyUser(volunteerId, notification);
//     }
//   } catch (notifyError) {
//     console.error("Notification failed:", notifyError.message);
//   }

//   return { success: true, message: "Mission completion rejected successfully." };
// };

// exports.rejectMissionCompletionService = async (missionId, volunteerId) => {
//   if (!missionId || !volunteerId) {
//     throw new AppError("Mission ID and Volunteer ID are required", 400);
//   }

//   const pool = await connectDB();
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const mission = await missionModel.findById(missionId);
//     if (!mission) {
//       throw new AppError("Mission not found", 404);
//     }

//     const volunteer = await volunteerModel.findById(volunteerId);
//     if (!volunteer) {
//       throw new AppError("Volunteer not found", 404);
//     }

//     // const deleted = await missionModel.deletePendingRequest(missionId, volunteerId);
//     // if (!deleted) {
//     //   throw new AppError("No pending mission request found", 404);
//     // }

//     await missionModel.updateStatus(missionId, "rejected");

//     const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//     const notification = await notificationModel.sendNotification({
//       sender_id: organizationUser.id,
//       receiver_id: volunteerId,
//       type: "mission_rejected",
//       message: `${organizationUser.name} has rejected your mission completion request.`,
//       meta: { missionId },
//     });

//     notifyUser(volunteerId, notification);

//     await connection.commit();

//     return {
//       alreadyAssigned: false,
//       deleted: true,
//       missionName: mission.name || "Unknown Mission",
//       volunteerName: volunteer.name || "Unknown Volunteer",
//       message: "Volunteer request successfully rejected.",
//     };
//   } catch (err) {
//     await connection.rollback();
//     console.error("Error in rejectMissionRequest:", err);
//     throw err instanceof AppError
//       ? err
//       : new AppError(err.message || "Failed to reject mission request", 500);
//   } finally {
//     connection.release();
//   }
// };


// exports.rejectMissionRequest = async (missionId, volunteerId) => {
//   // Validate input
//   if (!missionId || !volunteerId) {
//     throw new AppError("Mission ID and Volunteer ID are required", 400);
//   }

//   // Fetch mission
//   const mission = await missionModel.findById(missionId);
//   if (!mission) {
//     throw new AppError("Mission not found", 404);
//   }

//   // Fetch volunteer
//   const volunteer = await volunteerModel.findById(volunteerId);
//   if (!volunteer) {
//     throw new AppError("Volunteer not found", 404);
//   }

//   // Check if already assigned
//   const alreadyAssigned = await missionModel.isVolunteerAssigned(missionId, volunteerId);

//   if (alreadyAssigned) {
//     return {
//       alreadyAssigned: true,
//       deleted: false,
//       missionName: mission.name || "Unknown Mission",
//       volunteerName: volunteer.name || "Unknown Volunteer",
//       message: "Volunteer is already assigned to this mission.",
//     };
//   }

//   const deleted = await missionModel.deletePendingRequest(missionId, volunteerId);

//   if (!deleted) {
//     throw new AppError("No any mission request available", 404);
//   }

//   await missionModel.updateStatus(missionId, "pending");
//   const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
//   const notification = await notificationModel.sendNotification({
//     sender_id: organizationUser.id,
//     receiver_id: volunteerId,
//     type: "mission_request",
//     message: `${organizationUser.name} has rejected your mission request.`,
//     meta: { missionId }
//   });

//   notifyUser(volunteerId, notification);

//   return {
//     alreadyAssigned: false,
//     deleted: true,
//     missionName: mission.name || "Unknown Mission",
//     volunteerName: volunteer.name || "Unknown Volunteer",
//     message: "Volunteer request successfully rejected.",
//   };
// };


exports.completeMission = async (missionId, volunteerId) => {
  const pool = await connectDB();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const updateResult = await missionModel.updateMissionStatus(missionId, conn);
    if (updateResult.affectedRows === 0) {
      throw new AppError(404, `Mission with ID ${missionId} not found.`);
    }

    // Ensure the main volunteerId passed is also marked as completed in mission_assigned_volunteers
    await conn.query(
      "UPDATE mission_assigned_volunteers SET status = 'completed' WHERE mission_id = ? AND volunteer_id = ?",
      [missionId, volunteerId]
    );

    // Query all completed volunteers for this mission
    const [completedVolunteers] = await conn.query(
      "SELECT volunteer_id FROM mission_assigned_volunteers WHERE mission_id = ? AND status = 'completed'",
      [missionId]
    );

    // Award points and clean up requests for every volunteer who completed their task
    for (const row of completedVolunteers) {
      await missionModel.addPoints(missionId, row.volunteer_id, conn);
      await missionModel.deletePendingRequest(missionId, row.volunteer_id, conn);
    }

    // await volunteerModel.updatePreviousRanks();
    await conn.query(
      `UPDATE mission_assigned_volunteers 
       SET status = 'ended' 
       WHERE mission_id = ? AND status != 'completed'`,
      [missionId]
    );

    await conn.commit();

  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  // Non-transactional actions AFTER commit
  try {
    const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);
    const volunteer = await volunteerModel.findById(volunteerId);
    const invitedBy = volunteer && (volunteer.invitedBy !== undefined ? volunteer.invitedBy : volunteer.invitedby);

    if (organizationUser) {
      const receiverId = invitedBy || volunteerId;
      const notification = await notificationModel.sendNotification({
        sender_id: organizationUser.id,
        receiver_id: receiverId,
        type: "mission_completed",
        message: `${organizationUser.name} has accepted your mission completion request.`,
        meta: { missionId, volunteerId },
      });

      notifyUser(receiverId, notification);
    }
  } catch (notifyError) {
    console.error("Notification failed:", notifyError.message);
  }

  return { success: true, message: "Mission completed successfully." };
};

// exports.completeMission = async (missionId, volunteerId) => {
//   const pool = await connectDB();
//   const conn = await pool.getConnection();

//   try {
//     await conn.beginTransaction();

//     const updateResult = await missionModel.updateMissionStatus(missionId, conn);
//     if (updateResult.affectedRows === 0) {
//       throw new AppError(404, `Mission with ID ${missionId} not found.`);
//     }

//     await missionModel.addPoints(missionId, volunteerId, conn);
//     // await volunteerModel.updatePreviousRanks();
//     await missionModel.deletePendingRequest(missionId, volunteerId, conn);

//     await conn.commit();

//   } catch (error) {
//     await conn.rollback();
//     throw error;
//   } finally {
//     conn.release();
//   }

//   // Non-transactional actions AFTER commit
//   try {
//     const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//     if (organizationUser) {
//       const notification = await notificationModel.sendNotification({
//         sender_id: organizationUser.id,
//         receiver_id: volunteerId,
//         type: "mission_completed",
//         message: `${organizationUser.name} has accepted your mission completion request.`,
//         meta: { missionId },
//       });

//       notifyUser(volunteerId, notification);
//     }
//   } catch (notifyError) {
//     console.error("Notification failed:", notifyError.message);
//   }

//   // Notify volunteer's group who added him
//   try {
//     const volunteer = await volunteerModel.findById(volunteerId);
//     const mission = await missionModel.findById(missionId);
//     const invitedBy = volunteer && (volunteer.invitedBy !== undefined ? volunteer.invitedBy : volunteer.invitedby);
//     if (volunteer && invitedBy && mission) {
//       const groupNotif = await notificationModel.sendNotification({
//         sender_id: volunteerId,
//         receiver_id: invitedBy,
//         type: "volunteer_completed_mission",
//         message: `${volunteer.name} has completed the mission "${mission.name}".`,
//         meta: { missionId, volunteerId },
//       });
//       notifyUser(invitedBy, groupNotif);
//     }
//   } catch (notifErr) {
//     console.error("⚠️  Group notification on completion failed:", notifErr.message);
//   }

//   return { success: true, message: "Mission completed successfully." };
// };

//////// Previous 17 july
exports.canPost = async (missionId, userId) => {
  return await missionModel.updateCanPost(missionId, userId);
};


// exports.completeMission = async (missionId, volunteerId) => {
//   const pool = await connectDB();
//   const conn = await pool.getConnection();

//   try {
//     await conn.beginTransaction();

//     const updateResult = await missionModel.updateMissionStatus(missionId, conn);
//     if (updateResult.affectedRows === 0) {
//       throw new AppError(404, `Mission with ID ${missionId} not found.`);
//     }

//     await missionModel.addPoints(missionId, volunteerId, conn);
//     // await volunteerModel.updatePreviousRanks();
//     await missionModel.deletePendingRequest(missionId, volunteerId, conn);


//     await conn.commit();

//   } catch (error) {
//     await conn.rollback();
//     throw error;
//   } finally {
//     conn.release();
//   }

//   try {
//     const organizationUser = await missionRequestModel.findMissionCreatorUser(missionId);

//     if (organizationUser) {
//       const notification = await notificationModel.sendNotification({
//         sender_id: organizationUser.id,
//         receiver_id: volunteerId,
//         type: "mission_completed",
//         message: `${organizationUser.name} has accepted your mission completion request.`,
//         meta: { missionId },
//       });

//       notifyUser(volunteerId, notification);
//     }
//   } catch (notifyError) {
//     console.error("Notification failed:", notifyError.message);
//   }

//   return { success: true, message: "Mission completed successfully." };
// };


exports.updateMission = async (missionId, missionData, files) => {
  const lat = missionData.lat ? parseFloat(missionData.lat) : null;
  const lng = missionData.lng ? parseFloat(missionData.lng) : null;

  let filePath = null;
  if (files && files.file && files.file.length > 0) {
    filePath = `/uploads/missions/images/${files.file[0].filename}`;
  }

  // Check if mission exists
  const existing = await missionModel.findById(missionId, missionData.organization_id);
  if (!existing) {
    throw { type: "not_found", message: "Mission not found" };
  }

  // If name is changed, check for duplicate
  if (missionData.name && missionData.name !== existing.name) {
    const duplicate = await missionModel.findByNameAndOrg(
      missionData.name,
      missionData.organization_id
    );
    if (duplicate.length > 0) {
      throw { type: "conflict", message: "Mission name already exists" };
    }
  }

  const affectedRows = await missionModel.updateMission(missionId, {
    ...missionData,
    lat,
    lng,
    file: filePath || existing.file,
  });

  return affectedRows > 0;
};

exports.deleteMission = async (missionId, organizationId) => {
  const affectedRows = await missionModel.deleteMission(missionId, organizationId);
  if (affectedRows === 0) {
    throw { type: "not_found", message: "Mission not found" };
  }
  return true;
};


exports.addComment = async (missionId, userId, comment) => {
  const saved = await missionModel.addComment(missionId, userId, comment);

  const owner = await missionModel.findMissionCreatorUser(missionId);
  const ownerId = owner?.id;

  const mission = await missionModel.findById(missionId);
  if (!mission) throw { type: "not_found", message: "Mission does not exist" };

  if (ownerId && ownerId !== userId) {
    const pool = await connectDB();
    const [[user]] = await pool.query(
      `SELECT name FROM users WHERE id = ?`,
      [userId]
    );

    const notif = await notificationModel.sendNotification({
      sender_id: userId,
      receiver_id: mission.posted_by,
      type: "mission_comment",
      message: `${user?.name} commented on your feed "${mission.name}".`,
      meta: { mission_id: missionId }
    });

    notifyUser(ownerId, notif);
  }

  return saved;
};


exports.getComments = async (missionId, userId) => {
  return await missionModel.getComments(missionId, userId);
};

exports.updateComment = async (commentId, userId, newComment) => {
  return await missionModel.updateComment(commentId, userId, newComment);
};

exports.toggleComment = async (commentId, userId) => {
  return await missionModel.toggleCommentStatus(commentId, userId);
};

exports.deleteComment = async (commentId, userId) => {
  return await missionModel.deleteComment(commentId, userId);
};

// exports.assignVolunteer = async (missionId, volunteerId) => {
//   try {
//     const pool = await connectDB();

//     const [[mission]] = await pool.query(
//       'SELECT name FROM missions WHERE id = ?',
//       [missionId]
//     );

//     if (!mission) {
//       return {
//         error: true,
//         message: `Mission does not exist`
//       };
//     }

//     const [[volunteer]] = await pool.query(
//       'SELECT name FROM users WHERE id = ?',
//       [volunteerId]
//     );

//     if (!volunteer) {
//       return {
//         error: true,
//         message: `Volunteer does not exist`
//       };
//     }

//     const [rows] = await pool.query(
//       'SELECT id FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?',
//       [missionId, volunteerId]
//     );

//     if (rows.length > 0) {
//       return {
//         alreadyAssigned: true,
//         missionName: mission.name,
//         volunteerName: volunteer.name
//       };
//     }

//     await pool.query(
//       'INSERT INTO mission_assigned_volunteers (mission_id, volunteer_id) VALUES (?, ?)',
//       [missionId, volunteerId]
//     );

//     await pool.query(
//       "UPDATE missions SET status = 'process' WHERE id = ?",
//       [missionId]
//     );

//     return {
//       alreadyAssigned: false,
//       missionName: mission.name,
//       volunteerName: volunteer.name
//     };

//   } catch (error) {
//     console.error("Error in assignVolunteer:", error);
//     throw error;
//   }
// };



// exports.addPendingRequests = async (missionId, volunteerIds) => {
//   try {
//     const pool = await connectDB();

//     for (let userId of volunteerIds) {
//       await pool.query(
//         `INSERT INTO mission_pending_requests (mission_id, user_id) VALUES (?, ?)`,
//         [missionId, userId]
//       );
//     }

//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

// exports.rejectMissionRequest = async (missionId, volunteerId) => {
//   try {
//     const pool = await connectDB();

//     const [rows] = await pool.query('SELECT id FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?',[missionId, volunteerId]);
//       const [[mission]] = await pool.query('SELECT name FROM missions WHERE id = ?', [missionId]);
//       const [[volunteer]] = await pool.query('SELECT name FROM users WHERE id = ?', [volunteerId]);

//       if(rows.length > 0){
//         return {
//           alreadyAssigned: true,
//           missionName: mission?.name || "Unknown Mission",
//           volunteerName: volunteer?.name || "Unknown Volunteer"
//         };
//       }

//     const [[assigned]] = await pool.query(
//       "SELECT * FROM mission_assigned_volunteers WHERE mission_id = ? AND volunteer_id = ?",
//       [missionId, volunteerId]
//     );

//     if (assigned) {
//       return { alreadyAssigned: true };
//     }

//     const [result] = await pool.query(
//       "DELETE FROM mission_pending_requests WHERE mission_id = ? AND volunteer_id = ?",
//       [missionId, volunteerId]
//     );

//     const wasDeleted = result.affectedRows > 0;

//     return {
//       alreadyAssigned: false,
//       deleted: wasDeleted,
//       missionName: mission?.name || "Unknown Mission",
//       volunteerName: volunteer?.name || "Unknown Volunteer"
//     };
//   } catch (error) {
//     throw error;
//   }
// };


// exports.canPost = async (mission_id) => {
//   const pool = await connectDB();

//   // const [alreayPosted] = await pool.query('SELECT * FROM missions WHERE id = ? AND can_post = ?'[])

//   await pool.query("UPDATE missions SET can_post = 'yes' WHERE id = ? ", [mission_id]);

//   const [rows] = await pool.query('SELECT id, can_post FROM missions WHERE id = ? ',[mission_id]);

//   return rows.length > 0 ? rows[0]: null;
// }

exports.rejectedMissions = async (req, res) => {
  try {
    const pool = await connectDB();

    const [rejectedMissions] = await pool.query("SELECT * FROM missions WHERE status = 'rejected' ");
    return rejectedMissions;
  } catch (error) {
    throw error;
  }
}

exports.addCheckIn = async (missionId, volunteerId, checkInTime, checkOutTime = null, pointsEarned = 0) => {
  try {
    const pool = await connectDB();

    const [result] = await pool.query(
      `INSERT INTO mission_checkins (mission_id, volunteer_id, check_in_time, check_out_time, points_earned)
       VALUES (?, ?, ?, ?, ?)`,
      [missionId, volunteerId, checkInTime, checkOutTime, pointsEarned]
    );

    return { checkInId: result.insertId };

  } catch (error) {
    console.error(error);
    throw error;
  }
};



exports.updateCheckOut = async (checkInId, checkOutTime, pointsEarned) => {
  try {
    const pool = await connectDB();

    await pool.query(
      `UPDATE mission_checkins 
       SET check_out_time = ?, points_earned = ? 
       WHERE id = ?`,
      [checkOutTime, pointsEarned, checkInId]
    );

  } catch (error) {
    console.error(error);
    throw error;
  }
};

