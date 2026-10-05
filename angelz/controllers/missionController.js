const asyncHandler = require('../middleware/asyncHandler');
const missionService = require('../services/missionService');
const { missionValidation } = require('../validations/missionValidation');
const notificationModel = require("../models/notificationModel");
const { notifyUser, emitCrudEvent } = require("../services/socket");
const connectDB = require('../config/db');
const userPostService = require('../services/userPostService');

exports.createMission = async (req, res) => {
  try {
    const result = await missionService.createMission(req.body, req.files, req.user.organization_id);
    const missionId = result?.missionId;
    const fullMission = missionId ? await missionService.getMissionById(missionId).catch(() => null) : null;

    emitCrudEvent({
      resource: 'mission',
      action: 'created',
      id: missionId,
      data: fullMission || { id: missionId, ...req.body },
      actorId: req.user?.id,
      room: 'public'
    });

    res.status(201).json({
      message: "Mission created successfully",
    });
  } catch (err) {
    console.error("Mission creation failed:", err);
    if (err.type === "conflict") {
      return res.status(409).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.allMissions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "id";
  const sortOrder = req.query.sortOrder || "desc";

  const result = await missionService.missions(req.user, page, limit, sortBy, sortOrder);

  res.status(200).json({
    success: true,
    page: result.page,
    totalPages: result.totalPages,
    totalMissions: result.totalMissions,
    count: result.missions.length,
    missions: result.missions
  });
});


// exports.allMissions = asyncHandler(async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;

//   const result = await missionService.missions(req.user, page, limit);

//   res.status(200).json({
//     success: true,
//     page: result.page,
//     totalPages: result.totalPages,
//     totalMissions: result.totalMissions,
//     count: result.missions.length,
//     missions: result.missions
//   });
// });


// exports.allMissions = asyncHandler(async (req, res) => {
//   const missions = await missionService.missions(req.user);

//   res.status(200).json({
//     success: true,
//     count: missions.length,
//     missions
//   });
// });


exports.getAllMissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortBy = req.query.sortBy || "id";
    const sortOrder = req.query.sortOrder || "desc";

    const result = await missionService.getAllMissions(
      page,
      limit,
      sortBy,
      sortOrder
    );

    res.status(200).json({
      success: true,
      page: result.page,
      totalPages: result.totalPages,
      totalMissions: result.totalMissions,
      count: result.missions.length,
      missions: result.missions,
    });
  } catch (error) {
    console.error("Get All Missions Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching missions",
    });
  }
};

exports.likeMission = asyncHandler(async (req, res) => {
  const { missionId, id, type } = req.body;
  const targetId = id || missionId;
  const userId = req.user.id;

  if (type === 'post') {
    const result = await userPostService.toggleLike(targetId, userId);

    emitCrudEvent({
      resource: 'user_post',
      action: 'updated',
      id: Number(targetId),
      data: { id: Number(targetId), liked: result.liked, userId },
      actorId: userId,
      room: 'public',
      meta: { type: 'like', liked: result.liked }
    });

    // Add notification similar to mission if posts have an owner field (optional)
    if (result.liked && result.post && result.post.user_id && result.post.user_id !== userId) {
      const pool = await connectDB();
      const [rows] = await pool.query("SELECT id, name FROM users WHERE id = ?", [userId]);
      const likerName = rows[0]?.name || "Someone";

      const notif = await notificationModel.sendNotification({
        sender_id: userId,
        receiver_id: result.post.user_id,
        type: "post_like",
        message: `${likerName} liked your post.`,
        meta: { post_id: targetId, liked_by: userId },
      });
      notifyUser(result.post.user_id, notif);
    }

    return res.json({
      success: true,
      liked: result.liked,
      message: result.liked ? "Post liked" : "Post unliked",
    });
  }

  const result = await missionService.toggleLike(targetId, userId);

  emitCrudEvent({
    resource: 'mission',
    action: 'updated',
    id: Number(targetId),
    data: { id: Number(targetId), liked: result.liked, userId },
    actorId: userId,
    room: 'public',
    meta: { type: 'like', liked: result.liked }
  });

  // Only send notification if liked and not own mission
  const ownerId = result.ownerId || result.mission?.posted_by;
  if (result.liked && ownerId && ownerId !== userId) {
    try {
      const pool = await connectDB();

      const [rows] = await pool.query(
        "SELECT id, name FROM users WHERE id = ?",
        [userId]
      );

      const volunteerName = rows[0]?.name || "Someone";
      const missionName = result.mission?.name || "mission";

      const notif = await notificationModel.sendNotification({
        sender_id: userId,
        receiver_id: ownerId,
        type: "mission_like",
        message: `${volunteerName} liked your mission "${missionName}".`,
        meta: { 
          mission_id: Number(targetId), 
          missionId: Number(targetId), 
          mission_name: missionName, 
          liked_by: userId 
        },
      });

      notifyUser(ownerId, notif);
    } catch (notifErr) {
      console.error("Failed to send mission like notification:", notifErr);
    }
  }

  return res.json({
    success: true,
    liked: result.liked,
    message: result.liked ? "Mission liked" : "Mission unliked",
  });
});

// exports.likeMission = asyncHandler(async (req, res) => {
//   const { missionId } = req.body;
//   const userId = req.user.id;
//   const volunteerName = req.user.name || "Someone"; // Use name from auth middleware

//   const result = await missionService.toggleLike(missionId, userId);

//   // Only send notification if liked and not own mission
//   // if (result.liked && result.ownerId && result.ownerId !== userId) {
//     if (result.liked && result.mission.posted_by && result.mission.posted_by !== userId) {
//     const pool = await connectDB();

//     const [rows] = await pool.query(
//       "SELECT id, name FROM users WHERE id = ?",
//       [userId]
//     );

//     const volunteerName = rows[0]?.name || "Someone";

//     const notif = await notificationModel.sendNotification({
//       sender_id: userId,
//       receiver_id: result.mission.posted_by,
//       type: "mission_like",
//       message: `${volunteerName} liked your feed "${result.mission.name}".`,
//       meta: { mission_id: missionId, liked_by: userId },
//     });

//     notifyUser(result.ownerId, notif);
//   }

//   return res.json({
//     success: true,
//     liked: result.liked,
//     message: result.liked ? "Mission liked" : "Mission unliked",
//   });
// });


// exports.getAllMissions = async (req, res) => {
//   try {
//     const missions = await missionService.getAllMissions();
//     res.json({ success: true, count: missions.length, missions });
//   } catch (error) {
//     console.error('Get All Missions Error:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

exports.assignVolunteer = async (req, res) => {
  try {
    const result = await missionService.assignVolunteer(
      req.body.missionId,
      req.body.volunteerId
    );

    emitCrudEvent({
      resource: 'mission',
      action: 'updated',
      id: req.body.missionId,
      data: result,
      actorId: req.user?.id,
      room: ['public', `user:${req.body.volunteerId}`, 'role:admin'],
      meta: { type: 'assign_volunteer', volunteerId: req.body.volunteerId }
    });

    res.json(result);
  } catch (err) {
    console.error("Error assigning volunteer:", err);

    // Handle different error types with proper status and message
    if (err.type === "not_found") {
      return res.status(404).json({ message: err.message });
    }
    if (err.type === "not_started") {
      return res.status(400).json({ message: err.message });
    }
    if (err.type === "invalid") {
      return res.status(400).json({ message: err.message });
    }

    // Fallback for unexpected errors
    res.status(500).json({ message: "Server error", error: err.message || err });
  }
};


exports.startMission = async (req, res) => {
  try {
    const { mission_id } = req.body;
    let { volunteer_id } = req.body;

    // Fallback/Override: If the logged-in user is a volunteer, start the mission for themselves
    if (req.user && req.user.type === 'volunteer') {
      volunteer_id = req.user.id;
    }

    const result = await missionService.startMission(mission_id, volunteer_id);

    emitCrudEvent({
      resource: 'mission',
      action: 'updated',
      id: mission_id,
      data: result,
      actorId: req.user?.id,
      room: ['public', `user:${volunteer_id}`, 'role:admin'],
      meta: { type: 'start_mission', status: 'started' }
    });

    res.json({
      message: result.message,
      data: result,
    });
  } catch (err) {
    console.error("Error starting mission:", err);

    if (err.type === "not_found") {
      return res.status(404).json({ message: err.message });
    }

    res.status(500).json({
      message: "Server error while starting mission",
      error: err.message,
    });
  }
};

/////// Previous COde before above

// exports.startMission = async (req, res) => {
//   try {
//     const { mission_id, volunteer_id } = req.body;

//     const result = await missionService.startMission(mission_id, volunteer_id);

//     res.json({
//       message: result.message,
//       data: result,
//     });
//   } catch (err) {
//     console.error("Error starting mission:", err);

//     if (err.type === "not_found") {
//       return res.status(404).json({ message: err.message });
//     }

//     res.status(500).json({
//       message: "Server error while starting mission",
//       error: err.message,
//     });
//   }
// };

exports.getFeedsMissions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const currentUserId = req.user.id;

//   const result = await missionService.getAllFeeds(page, limit, currentUserId);
  const missionResult = await missionService.getAllFeeds(page, limit, currentUserId);
//   const postResult = await userPostService.getAllPosts(page, limit);
const postResult = await userPostService.getAllPosts(currentUserId, page, limit);

  res.status(200).json({
    success: true,
    page: missionResult.page,
    totalPages: missionResult.totalPages,
    totalFeeds: missionResult.totalFeeds,
    feeds: missionResult.feeds,
    "all-posts": postResult.posts
    // page: result.page,
    // totalPages: result.totalPages,
    // totalFeeds: result.totalFeeds,
    // feeds: result.feeds
  });
});


// exports.assignVolunteer = async (req, res) => {
//   try {
//     const result = await missionService.assignVolunteer(
//       req.body.missionId,
//       req.body.volunteerId
//     );

//     res.json(result);
//   } catch (err) {
//     console.error("assignVolunteer error:", err);

//     if (err.type === "not_found") {
//       return res.status(404).json({ message: err.message });
//     }

//     // handle mission not started yet
//     if (err.type === "invalid_time") {
//       return res.status(400).json({ message: err.message });
//     }

//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };


// exports.assignVolunteer = async (req, res) => {
//   try {
//     const result = await missionService.assignVolunteer(
//       req.body.missionId,
//       req.body.volunteerId
//     );
//     res.json(result);
//   } catch (err) {
//     if (err.type === "not_found") {
//       return res.status(404).json({ message: err.message });
//     }
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

exports.addPendingRequests = async (req, res) => {
  try {
    await missionService.addPendingRequests(req.params.missionId, req.body.volunteers);

    emitCrudEvent({
      resource: 'mission',
      action: 'updated',
      id: req.params.missionId,
      data: { missionId: req.params.missionId, volunteers: req.body.volunteers },
      actorId: req.user?.id,
      room: ['public', 'role:admin'],
      meta: { type: 'pending_requests' }
    });

    res.json({ message: "Pending requests added" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.rejectMissionRequest = async (req, res) => {
  const { missionId, volunteerId } = req.body;
  try {

    if (!missionId || !volunteerId) {
      return res.status(400).json({
        message: "missionId and volunteerId are required in the request body.",
      });
    }
    const result = await missionService.rejectMissionRequest(
      missionId,
      volunteerId
    );

    emitCrudEvent({
      resource: 'mission',
      action: 'updated',
      id: missionId,
      data: result,
      actorId: req.user?.id,
      room: ['public', `user:${volunteerId}`, 'role:admin'],
      meta: { type: 'reject_request', volunteerId }
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.canPost = async (req, res) => {
  try {
    const result = await missionService.canPost(req.params.id,req.user.id);
    if (!result) {
      return res.status(404).json({ message: "Mission not found" });
    }

    emitCrudEvent({
      resource: 'mission',
      action: 'updated',
      id: req.params.id,
      data: result,
      actorId: req.user?.id,
      room: 'public',
      meta: { type: 'can_post' }
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.rejectedMissions = async (req, res, next) => {
  try {
    const rejectedMissions = await missionService.rejectedMissions();

    if (!rejectedMissions || rejectedMissions.length === 0) {
      return res.status(404).json({
        status: false,
        message: 'No rejected missions found',
      });
    }

    return res.status(200).json({ success: true, data: rejectedMissions });

  } catch (error) {
    next(error);
  }
};

exports.getMissionById = async (req, res) => {
  try {
    const missionId = req.params.id;

    const mission = await missionService.getMissionById(missionId);

    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }

    res.status(200).json({
      success: true,
      data: mission,
    });
  } catch (err) {
    console.error("Error fetching mission:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

exports.completeMission = async (req, res, next) => {
  const { missionId, volunteerId } = req.body;

  try {
    const result = await missionService.completeMission(missionId, volunteerId);

    emitCrudEvent({
      resource: 'mission',
      action: 'updated',
      id: missionId,
      data: result,
      actorId: req.user?.id,
      room: ['public', `user:${volunteerId}`, 'role:admin'],
      meta: { type: 'complete_mission', status: 'completed' }
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


exports.rejectMissionCompletion = async (req, res, next) => {
  const { missionId, volunteerId } = req.body;

  try {
    const result = await missionService.rejectMissionCompletion(missionId, volunteerId);

    emitCrudEvent({
      resource: 'mission',
      action: 'updated',
      id: missionId,
      data: result,
      actorId: req.user?.id,
      room: ['public', `user:${volunteerId}`, 'role:admin'],
      meta: { type: 'reject_completion' }
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateMission = async (req, res) => {
  try {
    const missionId = req.params.id;
    const organizationId = req.user.organization_id;

    const updated = await missionService.updateMission(
      missionId,
      { ...req.body, organization_id: organizationId },
      req.files
    );

    if (!updated) {
      return res.status(404).json({ message: "Mission not found" });
    }

    const fullMission = await missionService.getMissionById(missionId).catch(() => null);

    emitCrudEvent({
      resource: 'mission',
      action: 'updated',
      id: missionId,
      data: fullMission || { id: missionId, ...req.body },
      actorId: req.user?.id,
      room: 'public'
    });

    res.json({ message: "Mission updated successfully" });
  } catch (err) {
    console.error("Mission update failed:", err);
    if (err.type === "not_found") {
      return res.status(404).json({ message: err.message });
    }
    if (err.type === "conflict") {
      return res.status(409).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteMission = async (req, res) => {
  try {
    const missionId = req.params.id;
    const organizationId = req.user.organization_id;

    await missionService.deleteMission(missionId, organizationId);

    emitCrudEvent({
      resource: 'mission',
      action: 'deleted',
      id: missionId,
      actorId: req.user?.id,
      room: 'public'
    });

    res.json({ message: "Mission deleted successfully" });
  } catch (err) {
    console.error("Mission delete failed:", err);
    if (err.type === "not_found") {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getNearbyMissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;
    const userApproved = req.user.isApproved;
    const radius = req.query.radius;
    // console.log(userApproved)
    if (userType !== "volunteer") {
      return res.status(403).json({ success: false, message: "Only volunteers can view nearby missions" });
    }

    if (userApproved !== "approved") {
      return res.status(403).json({ success: false, message: "Your account is not approved by admin" });
    }

    const missions = await missionService.getNearbyMissions(userId, radius);

    res.json({
      success: true,
      count: missions.length,
      missions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.addComment = asyncHandler(async (req, res) => {
  const { id, type: bodyType, postId, comment } = req.body;
  const targetId = req.params.missionId || id || postId;
  const type = bodyType || req.query.type || (postId ? 'post' : 'mission');
  const userId = req.user.id;

  if (!comment || comment.trim() === "") {
    return res.status(400).json({ success: false, message: "Comment cannot be empty" });
  }

  if (type === 'post') {
    const result = await userPostService.addComment(targetId, userId, comment);

    emitCrudEvent({
      resource: 'post_comment',
      action: 'created',
      id: result.id,
      data: { id: result.id, post_id: Number(targetId), user_id: userId, comment, created_at: new Date().toISOString() },
      actorId: userId,
      room: 'public',
      meta: { postId: Number(targetId) }
    });

    // Notify post owner
    if (result.ownerId && result.ownerId !== userId) {
      try {
        const pool = await connectDB();
        const [rows] = await pool.query("SELECT id, name FROM users WHERE id = ?", [userId]);
        const commenterName = rows[0]?.name || "Someone";

        const notif = await notificationModel.sendNotification({
          sender_id: userId,
          receiver_id: result.ownerId,
          type: "post_comment",
          message: `${commenterName} commented on your post: "${comment.substring(0, 30)}${comment.length > 30 ? '...' : ''}"`,
          meta: { post_id: targetId, comment_id: result.id },
        });
        notifyUser(result.ownerId, notif);
      } catch (notifErr) {
        console.error("Failed to send post comment notification:", notifErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Commented on post",
      commentId: result.id
    });
  }

  const result = await missionService.addComment(targetId, userId, comment);
  const commentId = result?.id || result;

  emitCrudEvent({
    resource: 'mission_comment',
    action: 'created',
    id: commentId,
    data: { id: commentId, mission_id: Number(targetId), user_id: userId, comment, created_at: new Date().toISOString() },
    actorId: userId,
    room: 'public',
    meta: { missionId: Number(targetId) }
  });

  res.status(201).json({
    success: true,
    message: "Commented on mission",
    commentId
  });
});



// exports.addComment = asyncHandler(async (req, res) => {
//   const missionId = req.params.missionId;
//   const userId = req.user.id;
//   const { comment } = req.body;

//   if (!comment || comment.trim() === "") {
//     return res.status(400).json({ success: false, message: "Comment cannot be empty" });
//   }

//   const result = await missionService.addComment(missionId, userId, comment);

//   res.status(201).json({
//     success: true,
//     message: "Comment added successfully",
//     commentId: result.id
//   });
// });


exports.getComments = asyncHandler(async (req, res) => {
  const missionId = req.params.missionId;
  const userId = req.user.id;

  const comments = await missionService.getComments(missionId, userId);

  res.status(200).json({
    success: true,
    total: comments.length,
    comments
  });
});

exports.updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { comment, type: bodyType } = req.body || {};
  const type = bodyType || req.query.type;
  const userId = req.user.id;

  // If type is explicitly 'post', use post service
  if (type === 'post') {
    const updated = await userPostService.updateComment(commentId, userId, comment);
    if (!updated) return res.status(403).json({ success: false, message: "Not authorized to edit this comment" });

    emitCrudEvent({
      resource: 'post_comment',
      action: 'updated',
      id: Number(commentId),
      data: { id: Number(commentId), comment },
      actorId: userId,
      room: 'public'
    });

    return res.json({ success: true, message: "Comment updated" });
  }

  // If type is explicitly 'mission', use mission service
  if (type === 'mission') {
    const updated = await missionService.updateComment(commentId, userId, comment);
    if (!updated) return res.status(403).json({ success: false, message: "Not authorized to edit this comment" });

    emitCrudEvent({
      resource: 'mission_comment',
      action: 'updated',
      id: Number(commentId),
      data: { id: Number(commentId), comment },
      actorId: userId,
      room: 'public'
    });

    return res.json({ success: true, message: "Comment updated" });
  }

  // If type is missing, try both (fallback)
  let updated = await userPostService.updateComment(commentId, userId, comment);
  if (updated) {
    emitCrudEvent({
      resource: 'post_comment',
      action: 'updated',
      id: Number(commentId),
      data: { id: Number(commentId), comment },
      actorId: userId,
      room: 'public'
    });
    return res.json({ success: true, message: "Comment updated" });
  }

  updated = await missionService.updateComment(commentId, userId, comment);
  if (updated) {
    emitCrudEvent({
      resource: 'mission_comment',
      action: 'updated',
      id: Number(commentId),
      data: { id: Number(commentId), comment },
      actorId: userId,
      room: 'public'
    });
    return res.json({ success: true, message: "Comment updated" });
  }

  // Default error if neither worked
  res.status(403).json({ success: false, message: "Not authorized to edit this comment or comment not found" });
});

exports.toggleComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const result = await missionService.toggleComment(commentId, userId);

  if (!result.success) {
    return res.status(403).json({
      success: false,
      message: result.message
    });
  }

  emitCrudEvent({
    resource: 'mission_comment',
    action: 'updated',
    id: Number(commentId),
    data: { id: Number(commentId), isDisabled: result.isDisabled },
    actorId: userId,
    room: 'public',
    meta: { type: 'toggle', isDisabled: result.isDisabled }
  });

  res.json({
    success: true,
    message: result.isDisabled
      ? "Comment disabled successfully"
      : "Comment enabled successfully",
  });
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { type: bodyType } = req.body || {};
  const type = bodyType || req.query.type;
  const userId = req.user.id;

  // If type is explicitly 'post', use post service
  if (type === 'post') {
    const deleted = await userPostService.deleteComment(commentId, userId);
    if (deleted) {
      emitCrudEvent({
        resource: 'post_comment',
        action: 'deleted',
        id: Number(commentId),
        actorId: userId,
        room: 'public'
      });
      return res.json({ success: true, message: "Comment deleted" });
    }
    return res.status(403).json({ success: false, message: "Not authorized to delete this comment or comment not found" });
  }

  // If type is explicitly 'mission', use mission service
  if (type === 'mission') {
    const deleted = await missionService.deleteComment(commentId, userId);
    if (deleted) {
      emitCrudEvent({
        resource: 'mission_comment',
        action: 'deleted',
        id: Number(commentId),
        actorId: userId,
        room: 'public'
      });
      return res.json({ success: true, message: "Comment deleted" });
    }
    return res.status(403).json({ success: false, message: "Not authorized to delete this comment or comment not found" });
  }

  // If no type is provided, try searching in both tables as a fallback
  let deleted = await userPostService.deleteComment(commentId, userId);
  if (deleted) {
    emitCrudEvent({
      resource: 'post_comment',
      action: 'deleted',
      id: Number(commentId),
      actorId: userId,
      room: 'public'
    });
    return res.json({ success: true, message: "Comment deleted" });
  }

  deleted = await missionService.deleteComment(commentId, userId);
  if (deleted) {
    emitCrudEvent({
      resource: 'mission_comment',
      action: 'deleted',
      id: Number(commentId),
      actorId: userId,
      room: 'public'
    });
    return res.json({ success: true, message: "Comment deleted" });
  }

  res.status(403).json({ success: false, message: "Not authorized to delete this comment or comment not found" });
});

// Add Check-In
exports.addCheckIn = async (req, res) => {
  try {
    const { missionId, volunteerId, checkInTime, checkOutTime, pointsEarned } = req.body;
    const result = await missionService.addCheckIn(missionId, volunteerId, checkInTime, checkOutTime, pointsEarned);

    emitCrudEvent({
      resource: 'mission_checkin',
      action: 'created',
      id: result.checkInId,
      data: { checkInId: result.checkInId, missionId, volunteerId, checkInTime, checkOutTime, pointsEarned },
      actorId: req.user?.id,
      room: ['public', `user:${volunteerId}`, 'role:admin']
    });

    res.status(201).json({
      success: true,
      message: 'Volunteer checked in successfully',
      checkInId: result.checkInId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Check-Out
exports.updateCheckOut = async (req, res) => {
  try {
    const { checkInId, checkOutTime, pointsEarned } = req.body;
    await missionService.updateCheckOut(checkInId, checkOutTime, pointsEarned);

    emitCrudEvent({
      resource: 'mission_checkin',
      action: 'updated',
      id: checkInId,
      data: { checkInId, checkOutTime, pointsEarned },
      actorId: req.user?.id,
      room: ['public', 'role:admin']
    });

    res.status(200).json({
      success: true,
      message: 'Check-out updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// exports.canPost = asyncHandler(async (req, res) => {
//   const mission_id = req.params.id;

//   if(!mission_id){
//     return res.status(400).json({ succeess: false, message: "mission_id is required" });
//   }

//   const updateMission = await missionService.canPost(mission_id);

//   if(!updateMission){
//     return res.status(404).json({ success: false, message: "Mission not found" });
//   }

//   res.status(200).json({ succeess: true, message: "Mission posted successfully", data: updateMission });

// })

// // Assign Volunteers
// exports.assignVolunteer = async (req, res) => {
//   try {
//     const { missionId, volunteerId } = req.body;

//     if (!missionId || !volunteerId) {
//       return res.status(400).json({
//         success: false,
//         message: "missionId and volunteerId are required"
//       });
//     }

//     const result = await missionService.assignVolunteer(missionId, volunteerId);

//     if (result.error) {
//       return res.status(404).json({
//         success: false,
//         message: result.message
//       });
//     }


//     if (result.alreadyAssigned) {
//       return res.status(409).json({
//         success: false,
//         message: `Volunteer ${result.volunteerName} is already assigned to mission ${result.missionName}`
//       });
//     } 

//     res.status(201).json({
//       success: true,
//       message: `Volunteer ${result.volunteerName} assigned to mission ${result.missionName}`
//     });

//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


// // Add Pending Requests
// exports.addPendingRequests = async (req, res) => {
//   try {
//     const { missionId, volunteerIds } = req.body;
//     await missionService.addPendingRequests(missionId, volunteerIds);

//     res.status(200).json({
//       success: true,
//       message: 'Pending requests added successfully'
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


// exports.rejectMissionRequest = async (req, res) => {
//   try {
//     const { missionId, volunteerId } = req.body;

//     const result = await missionService.rejectMissionRequest(missionId, volunteerId);

//     if (result.alreadyAssigned) {
//       return res.status(400).json({
//         success: false,
//         message: `You can not reject this mission [ ${result.missionName} ] request because it is already in process`
//       });
//     }

//     if (!result.deleted) {
//       return res.status(404).json({
//         success: false,
//         message: "No pending request found to reject"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: `The mission [ ${result.missionName} ] of volunteer [ ${result.volunteerName} ] request has been rejected successfully`
//     });

//   } catch (error) {
//     console.error("Error in rejectMissionRequest:", error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// };
