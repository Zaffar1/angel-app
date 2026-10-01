const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

const APP_TIMEZONE = process.env.APP_TIMEZONE || process.env.TIMEZONE || '+05:00';

const connectDB = async () => {
  try {
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: APP_TIMEZONE
      });

      // Synchronize MySQL session time_zone on every connection
      pool.pool.on('connection', (connection) => {
        connection.query(`SET time_zone = '${APP_TIMEZONE}'`, (err) => {
          if (err) {
            console.error('Failed to set MySQL session time_zone:', err.message);
          }
        });
      });

      // Set session time_zone for initial connection
      try {
        await pool.query(`SET time_zone = ?`, [APP_TIMEZONE]);
      } catch (tzErr) {
        console.warn('Initial SET time_zone warning:', tzErr.message);
      }

      console.log(`MySQL Connected (via phpMyAdmin) with session time_zone: ${APP_TIMEZONE}`);
    }
    return pool;
  } catch (err) {
    console.error("MySQL Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;


// const mongoose = require('mongoose');
// require('dotenv').config();

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('MongoDB Connected');
//   } catch (err) {
//     console.error(err);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;