const asyncHandler = require("../middleware/asyncHandler");
const Post = require("../models/Post");
const path = require('path');
const { uploadToS3 } = require('../utils/s3');

// exports.createPost = async (payload, files, userId) => {
//  const image = files?.image?.[0]?.path || null;
 
//  const post = await Post.create({
//     title: payload.title,
//     description: payload.description,
//     image: image,
//     status: payload.status,
//     can_post: payload.can_post,
//     user: userId
//  });
//  return post;
// };

// exports.createPost = async (payload, files, userId) => {
//   const imageFile = files?.image?.[0];
//   let imagePath = null;

//   if (imageFile) {
//     if (process.env.STORAGE_TYPE === 's3') {
//       // Upload to S3
//       imagePath = await uploadToS3(imageFile); // S3 public URL
//     } else {
//       // Local storage (relative path)
//       imagePath = `/uploads/post-images/${path.basename(imageFile.path)}`;
//     }
//   }

//   const post = await Post.create({
//     title: payload.title,
//     description: payload.description,
//     image: imagePath,
//     status: payload.status,
//     can_post: payload.can_post,
//     user: userId,
//   });

//   return post;
// };

exports.createPost = async (payload, files, userId) => {
  const imageFile = files?.image?.[0];
  let imagePath = null;

  if (imageFile) {
    if (process.env.STORAGE_TYPE === 's3') {
      // Upload to S3 and get public URL
      imagePath = await uploadToS3(imageFile);
    } else {
      // Local storage — make path web-accessible
      // Convert full local path to relative web path
      const relativePath = imageFile.path.split('uploads')[1]; // e.g. /posts/images/filename.jpg
      imagePath = `/uploads${relativePath.replace(/\\/g, '/')}`; // replace \ with / on Windows
    }
  }

  const post = await Post.create({
    title: payload.title,
    description: payload.description,
    image: imagePath,
    status: payload.status,
    can_post: payload.can_post,
    user: userId,
  });

  return post;
};


// exports.myPosts = asyncHandler(async(userId) => {
//     const userPosts = await Post.find({user: userId}).lean();
//     return userPosts;
// });

exports.myPosts = async (userId) => {
  const userPosts = await Post.find({ user: userId }).lean();

  return userPosts.map(post => {
    const likes = post.likes || [];

    const isLiked = userId
      ? likes.some(id => id?.toString?.() === userId.toString())
      : false;

    return {
      ...post,
      total_likes: likes.length,
      isLiked
    };
  });
};


exports.allPosts = asyncHandler(async (viewerId = null) => {
  const allPosts = await Post.find()
    .populate('user')
    .lean();

  const enrichedPosts = allPosts.map(post => {
    const likes = post.likes || [];

    const isLiked = viewerId
      ? likes.some(like => like?.toString?.() === viewerId?.toString?.())
      : false;

    return {
      ...post,
      total_likes: likes.length,
      isLiked
    };
  });

  return enrichedPosts;
});


exports.postDetails = asyncHandler(async (id, userId) => {
  const postDetail = await Post.findById(id).populate('user','-password').lean();

  if (!postDetail) return null;

  postDetail.total_likes = postDetail.likes?.length || 0;
  postDetail.isLiked = postDetail.likes?.some(like => like.toString() === userId.toString()) || false;

  return postDetail;
});


exports.toggleLike = asyncHandler(async (postId, userId) => {
  const post = await Post.findById(postId);
  if(!post) throw new Error('Post not found');

  const alreadyLiked = post.likes.includes(userId);

  if(alreadyLiked){
    post.likes = post.likes.filter(id=>id.toString() !== userId.toString());
  }else{
    post.likes.push(userId);
  }
  await post.save();
  return { liked: !alreadyLiked, totalLikes: post.likes.length };
})