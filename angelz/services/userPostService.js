const userPostModel = require('../models/userPostModel');

exports.createPost = async (payload, file, userId) => {
    let imagePath = null;

    if (file) {
        // Correctly formatting file path for public access URL
        const relativePath = file.path.split('uploads')[1];
        imagePath = `/uploads${relativePath.replace(/\\/g, '/')}`;
    }

    // Consistent handling of JSON tags from both raw body and multi-part data
    let tags = payload.tags;
    if (typeof tags === 'string') {
        try {
            tags = JSON.parse(tags);
        } catch (e) {
            console.warn("Could not parse tags JSON string:", e.message);
            tags = [];
        }
    }


    let allowInteraction = payload.allow_interaction;
    if (typeof allowInteraction === 'string') {
        try {
            allowInteraction = JSON.parse(allowInteraction);
        } catch (e) {
            console.warn("Could not parse allow_interaction:", e.message);
            allowInteraction = {};
        }
    }

    // Insert to MySQL via model
    const postId = await userPostModel.insertPost({
        title: payload.title,
        image: imagePath,
        tags: tags || [],
        allow_interaction: allowInteraction || {},
        userId: userId
    });

    // Fetch created post for confirmation
    return await userPostModel.getPostById(postId);
};


// exports.createPost = async (payload, file, userId) => {
//   let imagePath = null;
  
//   if (file) {
//     // Correctly formatting file path for public access URL
//     const relativePath = file.path.split('uploads')[1]; 
//     imagePath = `/uploads${relativePath.replace(/\\/g, '/')}`; 
//   }

//   // Consistent handling of JSON tags from both raw body and multi-part data
//   let tags = payload.tags;
//   if (typeof tags === 'string') {
//     try {
//       tags = JSON.parse(tags);
//     } catch (e) {
//       console.warn("Could not parse tags JSON string:", e.message);
//       tags = [];
//     }
//   }

//   // Insert to MySQL via model
//   const postId = await userPostModel.insertPost({
//     title: payload.title,
//     image: imagePath,
//     tags: tags || [],
//     userId: userId
//   });

//   // Fetch created post for confirmation
//   return await userPostModel.getPostById(postId);
// };

exports.getAllPosts = async (userId, page = 1, limit = 10) => {
    return await userPostModel.getAllPosts(userId, page, limit);
};
// exports.getAllPosts = async (page = 1, limit = 10) => {
//   return await userPostModel.getAllPosts(page, limit);
// };

exports.toggleLike = async (postId, userId) => {
    return await userPostModel.toggleLike(postId, userId);
};

exports.addComment = async (postId, userId, comment) => {
    return await userPostModel.addComment(postId, userId, comment);
};

exports.getComments = async (postId, userId) => {
    return await userPostModel.getComments(postId, userId);
};

exports.deleteComment = async (commentId, userId) => {
    return await userPostModel.deleteComment(commentId, userId);
};

exports.updateComment = async (commentId, userId, comment) => {
    return await userPostModel.updateComment(commentId, userId, comment);
};
