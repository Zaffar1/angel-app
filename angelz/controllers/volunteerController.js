const { requestMissionValidation } = require('../validations/missionValidation');
const volunteerService  = require('../services/volunteerService');
const Leaderboard = require('../models/volunteerModel');
const AppError = require('../utils/AppError');

exports.allVolunteers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const sortBy = req.query.sortBy || "created_at";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    const result = await volunteerService.getAllVolunteers(
      page,
      limit,
      sortBy,
      sortOrder
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};


exports.requestMission = async (req, res) => {
  try {
    const result = await volunteerService.requestMission({
      mission_id: req.body.mission_id,
      volunteer_id: req.user.id,
    });

    res.status(201).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};

// exports.getLeaderboard = async (req, res, next) => {
//   try {
//     const limit = parseInt(req.query.limit) || 10;
//     const page = parseInt(req.query.page) || 1;

//     const filters = {
//       city: req.query.city || null,
//       state: req.query.state || null,
//       country: req.query.country || null,
//     };

//     const result = await Leaderboard.getFilteredVolunteers(limit, (page - 1) * limit, filters);

//     const total = await Leaderboard.countFilteredVolunteers(filters);

//     const leaderboard = result.map((user, index) => {
//       const rank = (page - 1) * limit + index + 1;
//       let trend = "same";
//       if (user.previous_rank !== null) {
//         if (user.previous_rank > rank) trend = "up";
//         else if (user.previous_rank < rank) trend = "down";
//       }
//       return {
//         id: user.id,
//         name: user.name,
//         image: user.image,
//         points: user.points,
//         city: user.city,
//         state: user.state,
//         country: user.country,
//         rank,
//         trend,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       total,
//       page,
//       limit,
//       pages: Math.ceil(total / limit),
//       data: leaderboard,
//     });
//   } catch (err) {
//     next(err instanceof AppError ? err : new AppError(err.message, 500));
//   }
// };


exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const filters = {
      city: req.query.city || null,
      state: req.query.state || null,
      country: req.query.country || null,
      volunteer_group_id: req.query.volunteer_group_id || null
    };

    const result = await volunteerService.getLeaderboard(limit, page, filters);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getOrgLeaderboard = async (req, res, next) => {
  try {
    console.log(`Matched getOrgLeaderboard route`);
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const organization_id = req.query.organization_id || req.params.orgId;

    if (!organization_id) {
      return res.status(400).json({ success: false, message: "organization_id is required" });
    }

    const filters = {
      organization_id,
      city: req.query.city || null,
      state: req.query.state || null,
      country: req.query.country || null,
      volunteer_group_id: req.query.volunteer_group_id || null
    };

    const result = await volunteerService.getOrgLeaderboard(limit, page, filters);

    console.log(`Organization Leaderboard for Org ID ${organization_id}:`, JSON.stringify(result.data, null, 2));

    res.status(200).json({
      success: true,
      message: 'Organization Leaderboard fetched successfully',
      ...result,
    });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(err.message, 500));
  }
};


exports.getGroupLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const filters = {
      city: req.query.city || null,
      state: req.query.state || null,
      country: req.query.country || null
    };

    const result = await volunteerService.getGroupLeaderboard(limit, page, filters);

    res.status(200).json({
      success: true,
      message: 'Volunteer Group Leaderboard fetched successfully',
      ...result,
    });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(err.message, 500));
  }
};

exports.requestMissionCompletion = async (req, res) => {
  try {
    const result = await volunteerService.requestMissionComplete({
      mission_id: req.body.mission_id,
      volunteer_id: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Mission completion request sent to organization.",
      data: result
    });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};


exports.getVolunteerData = async (req, res) => {
  try {
    const { id } = req.params;
    const volunteer = await volunteerService.getVolunteerData(id);
    res.json({ volunteer });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};


exports.inviteVolunteer = async (req, res) => {
  try {
    await volunteerService.inviteVolunteer(req.user.id, req.body.userId);
    res.json({ success: true, message: 'Invite sent successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.params.orgId;

    if (!userId || !orgId) throw new Error("Missing userId or orgId");

    await volunteerService.acceptInvite({ orgId, userId });
    res.json({ success: true, message: 'Joined organization successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.rejectOrganizationInvite = async (req, res) => {
  try {
    const userId = req.user?.id;
    const orgId = req.params.orgId;

    if (!userId || !orgId) throw new Error("Missing userId or orgId");

    await volunteerService.rejectInvite({ orgId, userId });

    res.json({ success: true, message: 'Invitation rejected successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getAllVolunteerGroups = async (req, res, next) => {
  try {
    const result = await volunteerService.getAllVolunteerGroups();
    res.status(200).json({
      success: true,
      message: 'Volunteer groups fetched successfully',
      data: result,
    });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(err.message, 500));
  }
};

exports.getVolunteerGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await volunteerService.getVolunteerGroupById(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Volunteer group details fetched successfully',
      data: result,
    });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(err.message, 500));
  }
};

exports.getVolunteersOfGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await volunteerService.getVolunteersOfGroup(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Volunteers of group fetched successfully',
      data: result,
    });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(err.message, 500));
  }
};


// exports.requestMission = async (req,res) => {
//     try {
//         const {error, value} = requestMissionValidation.validate(req.body || {},{ stripUnknown:true });
//         if(error){
//             return res.status(400).json({ success: false, error: error.details.map(err => err.message) });
//         }
//         const result = await requestMissionService({ mission_id: value.mission_id, volunteer_id: req.user.id });
//         return res.status(201).json({ success: true, message: 'Mission request submitted successfully', data: result });
//     } catch (error) {
//         return res.status(500).json({ success:false, message: error.message || 'Something wend wrong' });
//     }
// }