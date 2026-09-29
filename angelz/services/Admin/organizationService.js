const mongoose = require('mongoose');
const Organization = require('../../models/Organization');
const connectDB = require('../../config/db');

async function orgDetail(orgId) {
    $org = Organization.findById(orgId);
    return $org;
}

async function approveOrg(orgId) {
  const pool = await connectDB();

  await pool.query(
    `UPDATE organizations SET status = 'active' WHERE id = ?`,
    [orgId]
  );

  const [rows] = await pool.query(
    `SELECT id, company_name, email, status, created_at 
     FROM organizations WHERE id = ?`,
    [orgId]
  );

  return rows[0] || null;
}


async function rejectOrg(orgId) {
  const pool = await connectDB();

  await pool.query("UPDATE organizations SET status = 'inactive' WHERE id = ?",[orgId]);
  
  const [rows] = await pool.query(
    `SELECT id, company_name, email, status, created_at 
     FROM organizations WHERE id = ?`,
    [orgId]
  );

  return rows[0] || null;

};


module.exports = { orgDetail, approveOrg, rejectOrg  }