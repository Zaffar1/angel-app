const userPostService = require('../services/userPostService');
const asyncHandler = require('../middleware/asyncHandler');
const connectDB = require('../config/db');
const notificationModel = require('../models/notificationModel');
const { notifyUser, emitCrudEvent } = require('../services/socket');

/**
 * Controller for handling new post creation requests.
 * Uses userPostService to process business logic.
 */
exports.createPost = asyncHandler(async (req, res) => {
  // Pass req.user.id from authentication middleware and req.file from multer
  const post = await userPostService.createPost(req.body, req.file, req.user.id);
  
  emitCrudEvent({
    resource: 'user_post',
    action: 'created',
    id: post?.id,
    data: post,
    actorId: req.user.id,
    room: 'public'
  });

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

    // Fetch comment with user details for authoritative payload
    let commentData = { id: result.id, post_id: Number(postId), user_id: userId, comment, created_at: new Date().toISOString() };
    try {
        const pool = await connectDB();
        const [rows] = await pool.query(
            `SELECT c.id, c.user_id, c.comment, c.created_at, u.name as user_name, u.image as user_image 
             FROM user_post_comments c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.id = ?`,
            [result.id]
        );
        if (rows.length > 0) {
            commentData = rows[0];
        }
    } catch (e) {
        console.error("Error fetching comment row for realtime sync:", e);
    }

    emitCrudEvent({
        resource: 'post_comment',
        action: 'created',
        id: result.id,
        data: commentData,
        actorId: userId,
        room: 'public',
        meta: { postId: Number(postId) }
    });

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

    emitCrudEvent({
        resource: 'post_comment',
        action: 'deleted',
        id: Number(commentId),
        actorId: userId,
        room: 'public',
        meta: { commentId: Number(commentId) }
    });

    res.json({ success: true, message: "Comment deleted" });
});

exports.toggleLike = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    const result = await userPostService.toggleLike(postId, userId);

    // Fetch authoritative like count
    let totalLikes = 0;
    try {
        const pool = await connectDB();
        const [[row]] = await pool.query("SELECT COUNT(*) as count FROM user_post_likes WHERE post_id = ?", [postId]);
        totalLikes = row?.count || 0;
    } catch (e) {
        console.error("Error fetching likes count:", e);
    }

    emitCrudEvent({
        resource: 'user_post',
        action: 'updated',
        id: Number(postId),
        data: { id: Number(postId), liked: result.liked, total_likes: totalLikes, userId },
        actorId: userId,
        room: 'public',
        meta: { type: 'like', liked: result.liked, total_likes: totalLikes }
    });

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

    emitCrudEvent({
        resource: 'post_comment',
        action: 'updated',
        id: Number(commentId),
        data: { id: Number(commentId), comment },
        actorId: userId,
        room: 'public'
    });

    res.json({ success: true, message: "Comment updated" });
});