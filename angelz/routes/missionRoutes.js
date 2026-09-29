const express = require('express');
const router = express.Router();
const missionController = require('../controllers/missionController');
const {auth} = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const upload = require('../middleware/upload')('missions');
const {missionValidation,assignVolunteerValidation,
  pendingRequestsValidation,
  checkInValidation,
  checkOutValidation,
  rejectRequestValidation,startMissionValidation,
  canPost} = require('../validations/missionValidation');
const { requireOrganization } = require('../middleware/requireAdminChecks'); 

router.get('/all', auth, requireOrganization, missionController.allMissions);
router.get('/list', auth, missionController.getAllMissions);
router.get('/nearby', auth, missionController.getNearbyMissions);
router.get("/all-feeds", auth, missionController.getFeedsMissions);

router.get(
  "/:missionId/comments",
  auth,
  missionController.getComments
);




router.post(
  '/create',
  auth,
  requireOrganization,
  upload.fields([{ name: 'file', maxCount: 1 }]),
  validateRequest(missionValidation),
  missionController.createMission
);
router.post('/can-post/:id',auth, missionController.canPost);

router.post(
  '/accept',auth,requireOrganization,
  validateRequest(assignVolunteerValidation),
  missionController.assignVolunteer
);

router.post(
  '/start',auth,
  validateRequest(startMissionValidation),
  missionController.startMission
);

router.post(
  '/pending-requests',
  validateRequest(pendingRequestsValidation),
  missionController.addPendingRequests
);

router.post(
  '/reject',
  validateRequest(rejectRequestValidation),
  missionController.rejectMissionRequest
);
router.post('/reject-completion', auth, requireOrganization, missionController.rejectMissionCompletion);
// router.post(
//   '/reject-completion',
//   auth,
//   requireOrganization,
//   validateRequest(rejectRequestValidation),
//   missionController.rejectMissionCompletion
// );
router.post('/complete', auth, requireOrganization, missionController.completeMission);

router.post(
  '/checkin',
  validateRequest(checkInValidation),
  missionController.addCheckIn
);

router.post("/like", auth, missionController.likeMission);

router.post(
  "/:missionId/comment",
  auth,
  missionController.addComment
);

router.put("/comment/:commentId", auth, missionController.updateComment);
router.put("/comment/:commentId/toggle",auth,missionController.toggleComment);
router.delete("/comment/:commentId", auth, missionController.deleteComment);

router.put(
  '/checkout',
  validateRequest(checkOutValidation),
  missionController.updateCheckOut
);

router.get(
  '/:id',
  auth, missionController.getMissionById
);
router.put(
  "/:id",
  auth,
  requireOrganization,
  upload.fields([{ name: "file", maxCount: 1 }]),
  missionController.updateMission
);

router.delete(
  "/:id",
  auth,
  requireOrganization,
  missionController.deleteMission
);

module.exports = router;