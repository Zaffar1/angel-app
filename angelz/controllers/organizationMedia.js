const OrganizationMedia = require('../models/OrganizationMedia');
const path = require('path');
const connectDB = require('../config/db');

exports.uploadMedia = async (req, res) => {
  try {
    const pool = await connectDB();
    const files = req.files;
    const organizationId = parseInt(req.body.organization_id);

    if (!organizationId || isNaN(organizationId)) {
      return res.status(400).json({ message: 'Invalid organization ID' });
    }

    const results = [];

    for (const file of files) {
      const type = file.mimetype.startsWith('video') ? 'video' : 'image';
      const url = `/uploads/organizations/${type === 'video' ? 'videos' : 'images'}/${file.filename}`;

      const [result] = await pool.query(
        `INSERT INTO organization_media (organization_id, type, url) VALUES (?, ?, ?)`,
        [organizationId, type, url]
      );

      results.push({ id: result.insertId, organization_id: organizationId, type, url });
    }

    res.status(200).json({ uploaded_media: results });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Local upload failed', error: error.message });
  }
};
