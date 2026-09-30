const mysql = require('mysql2/promise');

async function check() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'angelz_app'
    });

    const [rows] = await connection.query(`
      SELECT 
        v.id, v.name, v.email, v.image, v.points,
        mav.status AS assigned_status, mav.assigned_by
      FROM mission_assigned_volunteers mav
      JOIN users v ON v.id = mav.volunteer_id
      WHERE mav.mission_id = 250
    `);

    console.log("Database results for mission 250 assigned volunteers:");
    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
  } catch (err) {
    console.error("Error connecting to DB:", err.message);
  }
}

check();
