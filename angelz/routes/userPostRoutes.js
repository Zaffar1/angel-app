const express = require('express');
const router = express.Router();
const userPostController = require('../controllers/userPostController');
const { createPostSchema } = require('../validations/userPostValidation');
const validateRequest = require('../middleware/validateRequest');
const getUploadMiddleware = require('../middleware/upload');
const { auth } = require('../middleware/authMiddleware');

/**
 * Upload middleware with 'posts' destination. 
 * Expected field name: 'image'
 */
const upload = getUploadMiddleware('posts');

/**
 * POST /api/user-posts/
 * Create a new post with title, image, and tags.
 * This route is intended for all types of users (auth required).
 */
router.post(
  '/', 
  auth, 
  upload.single('image'), 
  validateRequest(createPostSchema), 
  userPostController.createPost
);

router.get('/all', auth, userPostController.getAllPosts);

router.post('/:postId/like', auth, userPostController.toggleLike);
router.get('/:postId/comments', auth, userPostController.getComments);
router.post('/:postId/comment', auth, userPostController.addComment);
router.put('/comment/:commentId', auth, userPostController.updateComment);
router.delete('/comment/:commentId', auth, userPostController.deleteComment);

module.exports = router;
