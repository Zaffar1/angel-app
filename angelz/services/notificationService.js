const notificationModel = require("../models/notificationModel");

const formatMeta = (notifications) => {
  return notifications.map(n => {
    if (!n.meta) return n;
    try {
      let metaObj = typeof n.meta === 'string' ? JSON.parse(n.meta) : n.meta;
      if (metaObj) {
        if (metaObj.mission_id && !metaObj.missionId) {
          metaObj.missionId = metaObj.mission_id;
        }
        if (metaObj.missionId && !metaObj.mission_id) {
          metaObj.mission_id = metaObj.missionId;
        }
      }
      return {
        ...n,
        meta: JSON.stringify(metaObj)
      };
    } catch (e) {
      return n;
    }
  });
};

exports.getUserNotifications = async (user_id) => {
  const notifications = await notificationModel.getUserNotifications(user_id);
  const count = await notificationModel.countUnreadNotifications(user_id);
  return { notifications: formatMeta(notifications), count };
};

exports.getUnReadNotifications = async (user_id) => {
  const notifications = await notificationModel.getUnReadNotifications(user_id);
  return formatMeta(notifications);
};

exports.allNotifications = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    notificationModel.allNotifications(limit, offset),
    notificationModel.allNotificationsCount()
  ]);

  return {
    notifications: formatMeta(notifications),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.markNotificationsAsRead = async (user_id) => {
  await notificationModel.markAllAsRead(user_id);
  return { success: true, message: "All notifications marked as read." };
};