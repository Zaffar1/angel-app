const userPostService = require('../services/userPostService');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Controller for handling new post creation requests.
 * Uses userPostService to process business logic.
 */
exports.createPost = asyncHandler(async (req, res) => {
  // Pass req.user.id from authentication middleware and req.file from multer
  const post = await userPostService.createPost(req.body, req.file, req.user.id);
  
  res.status(201).json({
    message: 'Post created successfully',
    post
  });
});

/**
 * Could easily be extended with other methods:
 * exports.getAllPosts = ...
 * exports.getUserPosts = ...
 */


exports.getAllPosts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await userPostService.getAllPosts(req.user.id, page, limit);

    res.status(200).json({
        success: true,
        ...result
    });
});

exports.addComment = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim() === "") {
        return res.status(400).json({ success: false, message: "Comment cannot be empty" });
    }

    const result = await userPostService.addComment(postId, userId, comment);

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
                meta: { post_id: postId, comment_id: result.id },
            });
            notifyUser(result.ownerId, notif);
        } catch (notifErr) {
            console.error("Failed to send comment notification:", notifErr);
        }
    }

    res.status(201).json({
        success: true,
        message: "Comment added successfully",
        commentId: result.id
    });
});

exports.getComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    const comments = await userPostService.getComments(postId, userId);

    res.status(200).json({
        success: true,
        total: comments.length,
        comments
    });
});

exports.deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    const deleted = await userPostService.deleteComment(commentId, userId);
    if (!deleted) {
        return res.status(403).json({ success: false, message: "Not authorized to delete this comment" });
    }

    res.json({ success: true, message: "Comment deleted" });
});

exports.toggleLike = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    const result = await userPostService.toggleLike(postId, userId);

    res.json({
        success: true,
        liked: result.liked,
        message: result.liked ? "Post liked" : "Post unliked"
    });
});

exports.updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    const updated = await userPostService.updateComment(commentId, userId, comment);
    if (!updated) {
        return res.status(403).json({ success: false, message: "Not authorized to edit this comment" });
    }

    res.json({ success: true, message: "Comment updated" });
});