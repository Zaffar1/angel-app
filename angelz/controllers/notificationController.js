const notificationService = require("../services/notificationService");

exports.getMyNotifications = async (req, res) => {
  try {
    // user_id comes from auth middleware (req.user set after JWT verification)
    const user_id = req.user.id;  
    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 10;

    // const data = await notificationService.getUserNotifications(user_id, page, limit);
    const {notifications,count} = await notificationService.getUserNotifications(user_id);
    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
      count,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getUnReadNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;  
    
    const notifications = await notificationService.getUnReadNotifications(user_id);
    res.status(200).json({
      success: true,
      message: "Unread notifications fetched successfully",
      data: notifications
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.allNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const data = await notificationService.allNotifications(page, limit);

        res.status(200).json({success: true, data});

    } catch (error) {
        res.status(500).json({success: false, message: "Server Error"})
    }
};

exports.markNotificationsAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await notificationService.markNotificationsAsRead(user_id);

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};