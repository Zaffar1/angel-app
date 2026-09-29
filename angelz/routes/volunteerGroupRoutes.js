const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { requireVolunteerGroupOrAdmin,requireAdmin } = require('../middleware/requireAdminChecks');
const volunteerGroupController = require('../controllers/volunteerGroupController');
const adminController = require('../controllers/adminController');
const asyncHandler = require('../middleware/asyncHandler');

// ─── Public routes ─────────────────────────────────────────────────────────
// POST /register — Register a new Volunteer Group
router.post('/register', volunteerGroupController.registerGroup);

// POST /login — Login for Volunteer Groups
router.post('/login', volunteerGroupController.loginGroup);

router.get('/', auth, requireAdmin, asyncHandler(adminController.getVolunteerGroups));
// ─── Protected routes (auth + Volunteer Group or Admin) ────────────────────
// POST /invite — Invite a new volunteer (group sends invitation)
router.post('/invite', auth, requireVolunteerGroupOrAdmin, volunteerGroupController.inviteVolunteer);

// GET /volunteers — List all volunteers invited by this group (or all, if admin)
router.get('/volunteers', auth, requireVolunteerGroupOrAdmin, volunteerGroupController.getVolunteers);

// GET /volunteers/:id — Get a specific invited volunteer's profile
router.get('/volunteers/:id', auth, requireVolunteerGroupOrAdmin, volunteerGroupController.getVolunteerById);

// PUT /volunteers/:id — Update an invited volunteer's details
router.put('/volunteers/:id', auth, requireVolunteerGroupOrAdmin, volunteerGroupController.updateVolunteer);

// DELETE /volunteers/:id — Delete an invited volunteer
router.delete('/volunteers/:id', auth, requireVolunteerGroupOrAdmin, volunteerGroupController.deleteVolunteer);

router.post('/assign-mission', auth, requireVolunteerGroupOrAdmin, volunteerGroupController.assignToMission);

// POST /assign-organization — Assign group's volunteers to an organization
router.post('/assign-organization', auth, requireVolunteerGroupOrAdmin, volunteerGroupController.assignToOrganization);

router.post('/update-mission-status', auth, requireVolunteerGroupOrAdmin, volunteerGroupController.updateMissionStatus);

module.exports = router;
