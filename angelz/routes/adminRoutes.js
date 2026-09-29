const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const asyncHandler = require('../middleware/asyncHandler');
const { auth } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireAdminChecks');
const organizationController = require('../controllers/organizationController');
const volunteerController = require('../controllers/volunteerController');
const missionController = require('../controllers/missionController');

// console.log('requireAdmin is a function:', typeof requireAdmin === 'function');

router.get('/summary', auth, adminController.getDashboardSummary);
router.get('/dashboard', requireAdmin, adminController.dashboardStats);
router.get('/users', auth, requireAdmin, asyncHandler(adminController.getUsers));
router.get('/organizations', auth, asyncHandler(adminController.getOrganizations));
router.get('/volunteer-groups', auth, requireAdmin, asyncHandler(adminController.getVolunteerGroups));
router.get('/volunteer-group/:id', auth, requireAdmin, asyncHandler(adminController.getVolunteerGroupDetails));
router.get('/volunteers',auth, volunteerController.allVolunteers);
router.get('/missions', auth, missionController.allMissions);

router.get('/mission/:id',auth, missionController.getMissionById);

router.get('/badges', auth, asyncHandler(adminController.allBadges));
router.get("/badges/:id", auth, adminController.getBadge);
router.post('/badges', auth, asyncHandler(adminController.createBadge));
router.put('/badges/:id', auth, asyncHandler(adminController.updateBadge));
router.delete('/badges/:id', auth, asyncHandler(adminController.deleteBadge));


router.get("/organization/:id", auth, organizationController.getOrgData);
router.get("/volunteer/:id", auth,volunteerController.getVolunteerData);

// These Routes are pending Mysql work pending


router.post('/user/:userId/approve', auth, requireAdmin, asyncHandler(adminController.approveUser));
router.post('/user/:userId/reject', auth, requireAdmin, asyncHandler(adminController.rejectUser));
router.get('/approved-users', auth, requireAdmin, asyncHandler(adminController.approvedUsers));

router.post('/organization/:orgId/approve', auth, requireAdmin, asyncHandler(adminController.approveOrganization));
router.post('/organization/:orgId/reject', auth, requireAdmin, asyncHandler(adminController.rejectOrganization));

router.get('/org-detail/:id',auth,requireAdmin,asyncHandler(adminController.orgDetails));


module.exports = router;