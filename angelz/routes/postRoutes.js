const express = require('express');
const router = express.Router();

const postController = require('../controllers/postController');
const validateRequest = require('../middleware/validateRequest');
const { createPostSchema } = require('../validations/postValidation');
const getUploadMiddleware = require('../middleware/upload');
const {auth} = require('../middleware/authMiddleware');

const upload = getUploadMiddleware('posts');

router.post(
  '/',
  auth,
  upload.fields([{ name: 'image', maxCount: 1 }]),
  validateRequest(createPostSchema),
  postController.createPost
);

router.get('/my-posts',auth,postController.getMyPosts);
router.get('/all-posts',auth,postController.allPosts);
router.get('/post/:id',auth,postController.getPostDetail);
router.post('/like/:id', auth, postController.likePost);

module.exports = router;