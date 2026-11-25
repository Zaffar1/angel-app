const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

const connectDB = async () => {
  try {
    if (!pool) {
      pool = mysql.createPool({

        host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
        port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
        user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : ''),
        database: process.env.DB_NAME || process.env.MYSQL_DB,
        //        for local
        // host: process.env.MYSQL_HOST,
        // user: process.env.MYSQL_USER,
        // password: process.env.MYSQL_PASSWORD,
        // database: process.env.MYSQL_DB,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log("MySQL Connected (via phpMyAdmin)");
    }
    return pool;
  } catch (err) {
    console.error("MySQL Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

// const mysql = require('mysql2/promise');
// require('dotenv').config();

// let pool;

// const connectDB = async () => {
//   try {
//     if (!pool) {
//       pool = mysql.createPool({
//         host: process.env.MYSQL_HOST,
//         user: process.env.MYSQL_USER,
//         password: process.env.MYSQL_PASSWORD,
//         database: process.env.MYSQL_DB,
//         waitForConnections: true,
//         connectionLimit: 10,
//         queueLimit: 0
//       });
//       console.log("MySQL Connected (via phpMyAdmin)");
//     }
//     return pool;
//   } catch (err) {
//     console.error("MySQL Connection Error:", err.message);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;


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