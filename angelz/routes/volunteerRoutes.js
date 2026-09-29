const express = require('express');
const { requireVolunteer } = require('../middleware/requireAdminChecks');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const { auth } = require('../middleware/authMiddleware');

router.get('/all',auth, volunteerController.allVolunteers);
router.get("/leaderboard", volunteerController.getLeaderboard);
router.get("/org-leaderboard", volunteerController.getOrgLeaderboard);
router.get("/group-leaderboard", volunteerController.getGroupLeaderboard);
router.post('/request',auth, requireVolunteer, volunteerController.requestMission);

router.get("/volunteer-groups", auth, volunteerController.getAllVolunteerGroups);
router.get("/volunteer-group/:id", auth, volunteerController.getVolunteerGroupById);
router.get("/volunteer-group/:id/volunteers", auth, volunteerController.getVolunteersOfGroup);

router.get("/:id", auth, volunteerController.getVolunteerData);
router.post('/completion-request',auth, requireVolunteer, volunteerController.requestMissionCompletion);

router.post('/invite', auth, volunteerController.inviteVolunteer);
router.post('/join/:orgId', auth, volunteerController.acceptInvite);
router.post('/reject/:orgId', auth, volunteerController.rejectOrganizationInvite);

module.exports = router;