const asyncHandler = require("../middleware/asyncHandler")
const postService = require("../services/postService");
const { emitCrudEvent } = require('../services/socket');

exports.createPost = asyncHandler(async (req,res) => {
    const actorId = req.user._id || req.user.id;
    const post = await postService.createPost(req.body,req.files,actorId);

    emitCrudEvent({
        resource: 'post',
        action: 'created',
        id: post?._id,
        data: post,
        actorId,
        room: 'public'
    });

    res.status(201).json({ message: 'Post created successfully', post });
});

exports.getMyPosts = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const myPosts = await postService.myPosts(req.user._id);

  if (!myPosts || myPosts.length === 0) {
    return res.status(404).json({ message: 'Posts not available' });
  }

  return res.status(200).json({ my_posts: myPosts });
});


exports.allPosts = asyncHandler(async (req, res) => {
    const viewerId = req.user._id;
    const allposts = await postService.allPosts(viewerId);

  if (!allposts || allposts.length === 0) {
    return res.status(404).json({ message: 'Posts not available' });
  }

  return res.status(200).json({ all_posts: allposts });
});


// exports.getPostDetail = asyncHandler(async (req,res) => {
//     const { id } = req.params; 
//     const postDetail = await postService.postDetails(id);
//     if (!postDetail) {
//         return res.status(404).json({ message: 'Post not found' });
//     }
//     return res.status(200).json({ post_detail: postDetail });
// })

exports.getPostDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const postDetail = await postService.postDetails(id, userId);

  if (!postDetail) {
    return res.status(404).json({ message: 'Post not found' });
  }

  return res.status(200).json({ post_detail: postDetail });
});


exports.likePost = asyncHandler(async (req,res) => {
    const postId = req.params.id;
    const userId = req.user._id || req.user.id;

    const result = await postService.toggleLike(postId,userId);

    emitCrudEvent({
        resource: 'post',
        action: 'updated',
        id: postId,
        data: { id: postId, liked: result.liked, total_likes: result.totalLikes },
        actorId: userId,
        room: 'public',
        meta: { type: 'like', liked: result.liked }
    });

    res.status(200).json({ message: result.liked ? 'Post Liked': 'Post unLiked',total_likes: result.totalLikes});
})