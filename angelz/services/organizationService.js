const Organization = require('../models/Organization');
const OrganizationMedia = require('../models/OrganizationMedia');
const { organizationValidation } = require('../validations/organizationValidation');
const connectDB = require('../config/db');
const organizationModel = require('../models/Organization');
const allowedMimeType = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
const maxFileSize = 40 * 1024 * 1024; // 40MB
const userModel = require('../models/userModel');


exports.createOrganization = async (payload, files, userId) => {
    const { error } = organizationValidation.validate(payload);
    if (error) {
        const messages = error.details.map(err => err.message.replace(/"/g, ''));
        throw { type: 'validation', errors: messages };
    }

    const pool = await connectDB();

    const [existing] = await pool.query(
        'SELECT * FROM organizations WHERE company_name = ?',
        [payload.company_name]
    );

    if (existing.length > 0) {
        throw { type: 'conflict', message: 'Company name already exists' };
    }

    if (files && files.length > 0) {
        for (const file of files) {
            if (!allowedMimeType.includes(file.mimetype)) {
                throw {
                    type: 'conflict',
                    message: 'Invalid file type. Only JPG, PNG images and MP4/MOV videos are allowed',
                    file: file.originalname
                };
            }

            if (file.size > maxFileSize) {
                throw {
                    type: 'conflict',
                    message: 'File size is too large, Max size allowed is 40MB',
                    file: file.originalname
                };
            }
        }
    }

const [result] = await db.query(
  `INSERT INTO organizations
   (company_name, description, email, type, services, organization_website, contact, address, city, state, zipcode, country, status, user_id)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    company_name,
    description,
    email,
    type,
    services,
    organization_website,
    contact,
    address,
    city,
    state,
    zipcode,
    country,
    status,
    user_id
  ]
);

    // const [result] = await pool.query(
    //     `INSERT INTO organizations 
    //     (company_name, description, email, type,services, contact, address, city, state, zipcode, country, status, user_id) 
    //     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    //     [
    //         payload.company_name,
    //         payload.description || null,
    //         payload.email,
    //         payload.type || null,
    //         payload.services || null,
    //         payload.contact || null,
    //         payload.address || null,
    //         payload.city || null,
    //         payload.state || null,
    //         payload.zipcode || null,
    //         payload.country || null,
    //         payload.status || 'active',
    //         userId
    //     ]
    // );

    const organizationId = result.insertId;

    if (files && files.length > 0) {
        for (const file of files) {
            const type = file.mimetype.startsWith('video') ? 'video' : 'image';
            await pool.query(
                `INSERT INTO organization_media (organization_id, type, url) VALUES (?, ?, ?)`,
                [
                    organizationId,
                    type,
                    `/uploads/organizations/${type === 'video' ? 'videos' : 'images'}/${file.filename}`
                ]
            );
        }
    }

    return { organizationId };
};


exports.getOrgData = async (orgId) => {
  const user = await userModel.getProfileById(orgId);
  if (!user || user.type !== "organization") throw new Error("Organization not found");

  const { password, ...userSafe } = user;

  const orgDetails = await organizationModel.findByUserId(user.id);
  if (orgDetails) {
    Object.assign(userSafe, orgDetails);
  }

  return userSafe;
};

exports.getOrgVolsData = async (orgId) => {
  const user = await userModel.getProfileById(orgId);
  if (!user || user.type !== "organization") throw new Error("Organization not found");

  return await organizationModel.orgVols(user.id);
};

exports.getOrganizationsWithMedia = async (userId) => {
    const myOrgs = await Organization.find({ user: userId }).lean();

    if (!myOrgs || myOrgs.length === 0) {
        return null;
    }

    const orgIds = myOrgs.map(org => org._id);
    const media = await OrganizationMedia.find({ organization_id: { $in: orgIds } }).lean();

    const orgWithMedia = myOrgs.map(org => {
        const orgMedia = media.filter(m => m.organization_id.toString() === org._id.toString());

        return {
            organization: org,
            images: orgMedia.filter(m => m.type === 'image'),
            videos: orgMedia.filter(m => m.type === 'video'),
        };
    });

    return orgWithMedia;
};


exports.getOrganizationDetailsWithMedia = async (organizationId) => {
  const pool = await connectDB();

  // Organization + User
  const [orgRows] = await pool.query(
    `SELECT o.*, u.name AS user_name, u.email AS user_email, u.type AS user_type
     FROM organizations o
     JOIN users u ON o.user_id = u.id
     WHERE o.id = ?`,
    [organizationId]
  );

  if (orgRows.length === 0) return null;
  const org = orgRows[0];

  // Media
  const [mediaRows] = await pool.query(
    `SELECT * FROM organization_media WHERE organization_id = ?`,
    [organizationId]
  );

  const images = mediaRows.filter(m => m.type === 'image');
  const videos = mediaRows.filter(m => m.type === 'video');

  // Missions
  const [missions] = await pool.query(
    `SELECT id, name, description, lat, lng, start_time, end_time, status
     FROM missions
     WHERE organization_id = ?`,
    [organizationId]
  );

    for (let mission of missions) {
    const [volunteers] = await pool.query(
      `SELECT u.id, u.name, u.email 
       FROM mission_assigned_volunteers mav
       JOIN users u ON mav.volunteer_id = u.id
       WHERE mav.mission_id = ?`,
      [mission.id]
    );
    mission.assigned_volunteers = volunteers;
  }

  return {
    organization_details: org,
    images,
    videos,
    missions
  };
};



exports.deleteOrg = async (organization_id) => {
    const pool = await connectDB();

    const [result] = await pool.query('DELETE FROM organizations WHERE id = ?', [organization_id]);
    return result.affectedRows;
}


// exports.allOrgs = async () => {
//     const pool = await connectDB();

//     // const [records] = await pool.query('SELECT * FROM organizations');
//     // const [records] = await pool.query('SELECT u.id AS user_id, u.name AS user_name, u.email AS user_email, o.* FROM organizations o JOIN users u ON o.user_id = u.id');
//     const [records] = await pool.query('SELECT u.name,u.email, u.type, o.company_name, o.description AS company_description, o.type AS company_type FROM organizations o JOIN users u ON o.user_id = u.id');
//     return records;
// }


exports.allOrgs = async ({ page = 1, limit = 10 }) => {
  const pool = await connectDB();

  const offset = (page - 1) * limit;

  const [all_orgs] = await pool.query(
    `SELECT 
    u.id,
        u.name, 
        u.email, 
        u.type, 
        u.image,
        o.company_name,
        o.description AS company_description, 
        o.type AS company_type,
        o.services,
        o.id AS organization_id,
        o.organization_website
     FROM organizations o 
     JOIN users u ON o.user_id = u.id
     WHERE u.type != 'admin'
     ORDER BY u.id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total 
     FROM organizations o 
     JOIN users u ON o.user_id = u.id 
     WHERE u.type != 'admin'`
  );

  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    all_orgs,
  };
};

exports.orgTypes = async () => {
  try {
    const orgTypes = await Organization.getAllOrgTypes();
    return orgTypes;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getOrgTypesList = async () => {
  const types = await Organization.getAllOrgTypes();
  return types.map(t => t.name);
};


exports.addOrgType = async (name) => {
  const pool = await connectDB();
  await pool.query("INSERT INTO organization_types (name) VALUES (?)", [name]);
  return name;
};

exports.getPendingMissionRequests = async (organizationAdminId) => {
  const db = await connectDB();

  const [rows] = await db.execute(
    `SELECT 
        o.company_name as organization_name,
        m.id AS mission_id,
        m.name,
        m.description,
        r.volunteer_id,
        u.name AS volunteer_name,
        u.email AS volunteer_email
      FROM organizations o
      JOIN missions m ON o.id = m.organization_id
      JOIN mission_pending_requests r ON m.id = r.mission_id
      JOIN users u ON r.volunteer_id = u.id
      WHERE o.user_id = ?`,
    [organizationAdminId]
  );

  return rows;
};
