const connectDB = require('../config/db');

/**
 * Handles database operations for user-generated posts.
 */

exports.insertPost = async (postData) => {
  const pool = await connectDB();
  const { title, image, tags, allow_interaction, userId } = postData;

  const [result] = await pool.query(
    `INSERT INTO user_posts 
     (title, image, tags, allow_interaction, user_id) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      title,
      image || null,
      JSON.stringify(tags || []),
      JSON.stringify(allow_interaction || {}),
      userId
    ]
  );

  return result.insertId;
};

// exports.insertPost = async (postData) => {
//   const pool = await connectDB();
//   const { title, image, tags, userId } = postData;

//   const [result] = await pool.query(
//     `INSERT INTO user_posts (title, image, tags, user_id) VALUES (?, ?, ?, ?)`,
//     [
//       title,
//       image || null,
//       JSON.stringify(tags || []),
//       userId
//     ]
//   );

//   return result.insertId;
// };


exports.getPostById = async (id) => {
  const pool = await connectDB();
  const [rows] = await pool.query(
    `SELECT p.*, u.name as user_name 
     FROM user_posts p 
     LEFT JOIN users u ON p.user_id = u.id 
     WHERE p.id = ?`, 
    [id]
  );
  
  if (rows.length > 0) {
    // ✅ Existing tags parsing (unchanged)
    if (typeof rows[0].tags === 'string') {
      try {
        rows[0].tags = JSON.parse(rows[0].tags);
      } catch (e) {
        rows[0].tags = [];
      }
    }

    // ✅ NEW: allow_interaction parsing (non-breaking)
    if (typeof rows[0].allow_interaction === 'string') {
      try {
        rows[0].allow_interaction = JSON.parse(rows[0].allow_interaction);
      } catch (e) {
        rows[0].allow_interaction = {};
      }
    }
  }
  
  return rows[0];
};

// exports.getPostById = async (id) => {
//   const pool = await connectDB();
//   const [rows] = await pool.query(
//     `SELECT p.*, u.name as user_name 
//      FROM user_posts p 
//      LEFT JOIN users u ON p.user_id = u.id 
//      WHERE p.id = ?`, 
//     [id]
//   );
  
//   if (rows.length > 0 && typeof rows[0].tags === 'string') {
//     try {
//       rows[0].tags = JSON.parse(rows[0].tags);
//     } catch (e) {
//       rows[0].tags = [];
//     }
//   }
  
//   return rows[0];
// };

exports.getAllPosts = async (currentUserId, page = 1, limit = 10) => {
    const pool = await connectDB();
    const offset = (page - 1) * limit;

    // Get total count
    const [totalRows] = await pool.query(`SELECT COUNT(*) as count FROM user_posts`);
    const totalPosts = totalRows[0].count;

    // Get posts with likes and comments counts
    const [rows] = await pool.query(
        `SELECT p.*, u.name as user_name, u.image as user_image,
         CASE WHEN l.id IS NOT NULL THEN TRUE ELSE FALSE END AS liked,
         (SELECT COUNT(*) FROM user_post_likes WHERE post_id = p.id) as total_likes,
         (SELECT COUNT(*) FROM user_post_comments WHERE post_id = p.id) as total_comments
         FROM user_posts p 
         LEFT JOIN users u ON p.user_id = u.id 
         LEFT JOIN user_post_likes l ON l.post_id = p.id AND l.user_id = ?
         ORDER BY p.created_at DESC 
         LIMIT ? OFFSET ?`,
        [currentUserId, limit, offset]
    );

    const postIds = rows.map(p => p.id);
    let commentsMap = {};

    if (postIds.length > 0) {
        const [comments] = await pool.query(
            `SELECT c.*, u.name as user_name, u.image as user_image
             FROM user_post_comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id IN (?)
             ORDER BY c.created_at DESC`,
            [postIds]
        );

        commentsMap = comments.reduce((acc, c) => {
            if (!acc[c.post_id]) acc[c.post_id] = [];
            acc[c.post_id].push(c);
            return acc;
        }, {});
    }

    const posts = rows.map((post) => {
        if (typeof post.tags === "string") {
            try {
                post.tags = JSON.parse(post.tags);
            } catch (e) {
                post.tags = [];
            }
        }
        if (typeof post.allow_interaction === "string") {
            try {
                post.allow_interaction = JSON.parse(post.allow_interaction);
            } catch (e) {
                post.allow_interaction = { comments: true, likes: true, share: true };
            }
        }
        post.comments = commentsMap[post.id] || [];
        return post;
    });

    return {
        posts,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        page,
    };
};

// exports.getAllPosts = async (page = 1, limit = 10) => {
//   const pool = await connectDB();
//   const offset = (page - 1) * limit;

//   const [rows] = await pool.query(
//     `SELECT p.*, u.name as user_name 
//      FROM user_posts p 
//      LEFT JOIN users u ON p.user_id = u.id 
//      ORDER BY p.created_at DESC 
//      LIMIT ? OFFSET ?`,
//     [limit, offset]
//   );

//   const [totalRows] = await pool.query(`SELECT COUNT(*) as count FROM user_posts`);
//   const totalPosts = totalRows[0].count;

//   const posts = rows.map((post) => {
//     if (typeof post.tags === "string") {
//       try {
//         post.tags = JSON.parse(post.tags);
//       } catch (e) {
//         post.tags = [];
//       }
//     }
//     return post;
//   });

//   return {
//     posts,
//     totalPosts,
//     totalPages: Math.ceil(totalPosts / limit),
//     page,
//   };
// };


exports.toggleLike = async (postId, userId) => {
    const pool = await connectDB();

    // Check if post exists
    const [[post]] = await pool.query(
        "SELECT id, user_id FROM user_posts WHERE id = ?",
        [postId]
    );
    if (!post) throw { type: "not_found", message: "Post does not exist" };

    // Check if already liked
    const [existing] = await pool.query(
        "SELECT id FROM user_post_likes WHERE post_id = ? AND user_id = ?",
        [postId, userId]
    );

    const ownerId = post.user_id;

    if (existing.length > 0) {
        // Unlike
        await pool.query(
            "DELETE FROM user_post_likes WHERE post_id = ? AND user_id = ?",
            [postId, userId]
        );
        return { liked: false, post, ownerId };
    }

    // Like
    await pool.query(
        "INSERT INTO user_post_likes (post_id, user_id) VALUES (?, ?)",
        [postId, userId]
    );

    return { liked: true, post, ownerId };
};

exports.addComment = async (postId, userId, comment) => {
    const pool = await connectDB();
    
    // Check if post exists
    const [[post]] = await pool.query("SELECT id, user_id FROM user_posts WHERE id = ?", [postId]);
    if (!post) throw { type: "not_found", message: "Post does not exist" };

    const [result] = await pool.query(
        "INSERT INTO user_post_comments (post_id, user_id, comment) VALUES (?, ?, ?)",
        [postId, userId, comment]
    );

    return { id: result.insertId, ownerId: post.user_id };
};

exports.getComments = async (postId, userId) => {
    const pool = await connectDB();
    const [comments] = await pool.query(
        `SELECT c.id, c.user_id, c.comment, c.created_at, u.name as user_name 
         FROM user_post_comments c 
         JOIN users u ON c.user_id = u.id 
         WHERE c.post_id = ? 
         ORDER BY c.created_at DESC`,
        [postId]
    );
    return comments;
};

// exports.deleteComment = async (commentId, userId) => {
//     const pool = await connectDB();
//     const [result] = await pool.query(
//         "DELETE FROM user_post_comments WHERE id = ? AND user_id = ?",
//         [commentId, userId]
//     );
//     return result.affectedRows > 0;
// };

exports.deleteComment = async (commentId, userId) => {
    const pool = await connectDB();

    // Check if the user is the comment author
    const [commentRows] = await pool.query("SELECT post_id, user_id FROM user_post_comments WHERE id = ?", [commentId]);
    if (commentRows.length === 0) return false;

    const comment = commentRows[0];
    if (comment.user_id == userId) {
        const [result] = await pool.query("DELETE FROM user_post_comments WHERE id = ?", [commentId]);
        return result.affectedRows > 0;
    }

    // Check if the user is the post owner
    const [postRows] = await pool.query("SELECT user_id FROM user_posts WHERE id = ?", [comment.post_id]);
    if (postRows.length > 0 && postRows[0].user_id == userId) {
        const [result] = await pool.query("DELETE FROM user_post_comments WHERE id = ?", [commentId]);
        return result.affectedRows > 0;
    }

    return false;
};

exports.updateComment = async (commentId, userId, newComment) => {
    const pool = await connectDB();
    const [result] = await pool.query(
        "UPDATE user_post_comments SET comment = ? WHERE id = ? AND user_id = ?",
        [newComment, commentId, userId]
    );
    return result.affectedRows > 0;
};
