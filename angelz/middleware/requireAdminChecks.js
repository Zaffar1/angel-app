// Role-based access middlewares
const pool = require('../config/db');
const connectDB = require('../config/db');
const jwt = require('jsonwebtoken');


const requireAdmin = async (req, res, next) => {
  try {
    //  Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not Authenticated" });
    }

    // Verify JWT
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from MySQL
    const pool = await connectDB();
    const [rows] = await pool.query("SELECT id, name, email, type FROM users WHERE id = ?", [decoded.id]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = rows[0];

    // Check admin
    if (user.type !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Attach user to request and continue
    req.user = user;
    next();

  } catch (error) {
    console.error("requireAdmin error:", error);
    res.status(401).json({ message: "Token expired. Please log in again." });
  }
};


async function requireOrganization(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please log in.' 
      });
    }

    // Fetch user from MySQL
    const db = await pool();
    const [rows] = await db.query(
      'SELECT id, type, isApproved FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = rows[0];

    if (user.type !== 'organization') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Organization account required.' 
      });
    }

    // if ((user.isApproved || '').toString().toLowerCase() !== 'approved') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Your organization account has not been approved by the admin yet.'
    //   });
    // }


    // Fetch organization record for this user
    const [orgs] = await db.query(
      "SELECT id FROM organizations WHERE user_id = ?",
      [user.id]
    );

    if (orgs.length === 0) {
      return res.status(403).json({
        success: false,
        message: "No organization found for this user",
      });
    }

    // Attach full user object to req.user for downstream usage
    req.user = user;
    req.user.organization_id = orgs[0].id;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// async function requireOrganization(req, res, next) {
//   try {
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Authentication required. Please log in.' 
//       });
//     }

//     // Fetch user from MySQL
//     const db = await pool();
//     const [rows] = await db.query(
//       'SELECT id, type, isApproved FROM users WHERE id = ?',
//       [req.user.id]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     const user = rows[0];

//     if (user.type !== 'organization') {
//       return res.status(403).json({ 
//         success: false, 
//         message: 'Access denied. Organization account required.' 
//       });
//     }

//     if ((user.isApproved || '').toString().toLowerCase() !== 'approved') {
//       return res.status(403).json({
//         success: false,
//         message: 'Your organization account has not been approved by the admin yet.'
//       });
//     }

//     // Attach full user object to req.user for downstream usage
//     req.user = user;

//     next();
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error', error: err.message });
//   }
// }

async function requireVolunteer(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const pool = await connectDB();

    const [rows] = await pool.query(
      'SELECT id, type, isApproved FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = rows[0];

    if (user.type !== 'volunteer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Volunteer account required.',
      });
    }

    // if ((user.isApproved || '').toString().toLowerCase() !== 'approved') {
    //   return res.status(403).json({
    //     success: false,
    //     message:
    //       'Your volunteer account has not been approved by the admin yet.',
    //   });
    // }

    // Attach validated user object
    req.user = user;

    next();
  } catch (err) {
    console.error('requireVolunteer error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
}



// function requireOrganization(req, res, next) {
//   if (!req.user) {
//     return res.status(401).json({ 
//       success: false, 
//       message: 'Authentication required. Please log in.' 
//     });
//   }

//   if (req.user.type !== 'organization') {
//     return res.status(403).json({ 
//       success: false, 
//       message: 'Access denied. Organization account required.' 
//     });
//   }

// if ((req.user.isApproved || '').toString().toLowerCase() !== 'approved') {
//     return res.status(403).json({
//         success: false,
//         message: 'Your organization account has not been approved by the admin yet.'
//     });
// }

//   next();
// }

// function requireVolunteer(req, res, next) {
//   if (!req.user) {
//     return res.status(401).json({ message: 'Not Authenticated' });
//   }
//   if (req.user.type !== 'volunteer') {
//     return res.status(403).json({ message: 'Volunteer access required' });
//   }
//   next();
// }

async function requireVolunteerGroupOrAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const pool = await connectDB();
    const [rows] = await pool.query(
      'SELECT id, type, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = rows[0];
    const type = (user.type || '').toLowerCase();
    const role = (user.role || '').toUpperCase();

    const isVolunteerGroup = type === 'volunteer_group' || role === 'VOLUNTEER_GROUP';
    const isAdmin = type === 'admin' || role === 'ADMIN';

    if (!isVolunteerGroup && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Volunteer Group or Admin account required.',
      });
    }

    req.user = { ...req.user, type: user.type, role: user.role };
    next();
  } catch (err) {
    console.error('requireVolunteerGroupOrAdmin error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = {
  requireAdmin,
  requireOrganization,
  requireVolunteer,
  requireVolunteerGroupOrAdmin,
};