const adminService = require('../services/Admin/userListService');
const { parsePagination } = require('../utils/paginate');
const { userListValidation, volunteerGroupListValidation } = require('../validations/adminValidation');
const {approveUser, rejectUser } = require('../services/Admin/userApproveService');
const { orgDetail, rejectOrg, approveOrg } = require('../services/Admin/organizationService');
const AppError = require('../utils/AppError');
const badgeService = require('../services/Admin/badgeService');
const asyncHandler = require('../middleware/asyncHandler');

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const result = await adminService.getDashboardSummary();
    res.status(200).json({
      success: true,
      message: 'Dashboard data fetched successfully',
      ...result,
    });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(err.message, 500));
  }
};

exports.dashboardStats = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "id";
    const sortOrder = req.query.sortOrder || "desc";

    const stats = await adminService.getDashboardStats(page, limit, sortBy, sortOrder);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { error, value } = userListValidation.validate(req.query, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        errors: error.details.map(d => d.message.replace(/"/g, ''))
      });
    }

    const { page, limit, skip } = (() => {
      const p = parseInt(value.page || 1, 10);
      const l = parseInt(value.limit || 10, 10);
      return { page: p, limit: l, skip: (p - 1) * l };
    })();

    const resObj = await adminService.listUsers({
      page,
      limit,
      skip,
      search: value.search,
      sortBy: value.sortBy || 'created_at',
      sortOrder: value.sortOrder || 'desc',
      type: value.type,
      status: value.status,
      currentUserId: req.user.id
    });

    res.json({ success: true, ...resObj });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.approvedUsers = async (req, res, next) => {
  // validate query params
  const { error, value } = userListValidation.validate(req.query, { stripUnknown: true });
  if (error) return res.status(400).json({ errors: error.details.map(d => d.message.replace(/"/g, '')) });

  const { page, limit, skip } = (() => {
    const p = parseInt(value.page || 1, 10);
    const l = parseInt(value.limit || 10, 10);
    return { page: p, limit: l, skip: (p - 1) * l };
  })();

  const resObj = await adminService.approvedUsers({
    page,
    limit,
    skip,
    search: value.search,
    sortBy: value.sortBy || 'createdAt',
    sortOrder: value.sortOrder || 'desc',
    type: value.type,
    status: value.status,
    currentUserId: req.user._id
  });

  res.json({ success: true, ...resObj });
};

exports.approveUser = async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) return next(new AppError("User ID is required", 400));

  const apprUser = await approveUser(userId);
  if (!apprUser) return next(new AppError("User not found", 404));

  res.json({ success: true, message: "User approved successfully", user: apprUser });
};

exports.rejectUser = async (req, res, next) => {
  const {userId} = req.params;

  if(!userId) return next(new AppError("User ID is required",400));
  
  const rejUser = await rejectUser(userId);
  
  if (!rejUser) return next(new AppError("User not found",404));
  
  res.json({ success: true, message:"User rejected successfully", user: rejUser });
};

exports.orgDetails = async (req,res) => {
  const org = await orgDetail(req.params.id);
  res.json({ success: true, org_details: org });
};


exports.getOrganizations = async (req, res, next) => {
  try {
    const { error, value } = userListValidation.validate(req.query, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        errors: error.details.map(d => d.message.replace(/"/g, ''))
      });
    }

    const { page, limit, skip } = (() => {
      const p = parseInt(value.page || 1, 10);
      const l = parseInt(value.limit || 10, 10);
      return { page: p, limit: l, skip: (p - 1) * l };
    })();

    const resObj = await adminService.listOrganizations({
      page,
      limit,
      skip,
      search: value.search,
      sortBy: value.sortBy || 'created_at',
      sortOrder: value.sortOrder || 'desc',
      status: value.status,
      currentUserId: req.user.id
    });

    res.json({ success: true, ...resObj });
  } catch (error) {
    console.error("Get organizations error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.approveOrganization = async (req, res, next) => {
  const { orgId } = req.params;

  if (!orgId) return next(new AppError("Organization ID is required", 400));

  const apprOrg = await approveOrg(orgId);
  if (!apprOrg) return next(new AppError("Organization not found", 404));

  res.json({ success: true, message: "Organization approved successfully", organization: apprOrg });
};

exports.rejectOrganization = async (req, res, next) => {
  const {orgId} = req.params;

  if(!orgId) return next(new AppError("Organization ID is required",400));
  
  const rejOrg = await rejectOrg(orgId);
  
  if (!rejOrg) return next(new AppError("Organization not found",404));
  
  res.json({ success: true, message:"Organization rejected successfully", organization: rejOrg });
};


exports.allBadges = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const result = await badgeService.listBadges({
      page: Number(page),
      limit: Number(limit),
      search
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(err.message, 500));
  }
};

exports.createBadge = async (req, res, next) => {
  try {
    const badge = await badgeService.createBadge(req.body);
    res.status(201).json({
      success: true,
      message: "Badge created successfully",
      badge
    });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(err.message, 400));
  }
};


exports.getBadge = asyncHandler(async (req, res, next) => {
  const badge = await badgeService.getBadge(req.params.id);
  res.json({ success: true, badge });
});

exports.updateBadge = async (req, res, next) => {
  try {
    const badge = await badgeService.updateBadge(req.params.id, req.body);
    res.json({
      success: true,
      message: "Badge updated successfully",
      badge
    });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(err.message, 400));
  }
};


exports.deleteBadge = async (req, res, next) => {
  try {
    await badgeService.deleteBadge(req.params.id);
    res.json({
      success: true,
      message: "Badge deleted successfully"
    });
  } catch (err) {
    next(err instanceof AppError ? err : new AppError(err.message, 400));
  }
};

exports.getVolunteerGroups = async (req, res, next) => {
  try {
    const { error, value } = volunteerGroupListValidation.validate(req.query, { stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map(d => d.message.replace(/"/g, ''))
      });
    }

    const page = parseInt(value.page || 1, 10);
    const limit = parseInt(value.limit || 10, 10);
    const skip = (page - 1) * limit;

    const resObj = await adminService.listVolunteerGroups({
      page,
      limit,
      skip,
      search: value.search,
      sortBy: value.sortBy || 'created_at',
      sortOrder: value.sortOrder || 'desc',
      status: value.status,
      city: value.city,
      state: value.state,
      country: value.country,
    });

    res.status(200).json({
      success: true,
      message: 'Volunteer groups fetched successfully',
      page: resObj.page,
      limit: resObj.limit,
      total: resObj.total,
      totalPages: resObj.totalPages,
      data: resObj.volunteer_groups,
      volunteer_groups: resObj.volunteer_groups,
    });
  } catch (error) {
    console.error('Get volunteer groups error:', error);
    next(error instanceof AppError ? error : new AppError(error.message, 500));
  }
};

exports.getVolunteerGroupDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await adminService.getVolunteerGroupDetails(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer group not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Volunteer group details fetched successfully',
      data: group,
      volunteer_group: group
    });
  } catch (error) {
    console.error('Get volunteer group details error:', error);
    next(error instanceof AppError ? error : new AppError(error.message, 500));
  }
};