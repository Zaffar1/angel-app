const express = require('express');
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { auth } = require('../middleware/authMiddleware');

router.get("/all", auth, notificationController.getMyNotifications);
router.get("/unread", auth, notificationController.getUnReadNotifications);
router.put("/read", auth, notificationController.markNotificationsAsRead);
router.get("/all-notifications", auth, notificationController.allNotifications);

module.exports = router;