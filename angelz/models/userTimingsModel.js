const connectDB = require('../config/db');

exports.replaceTimings = async (userId, timings) => {
  const pool = await connectDB();

  await pool.query("DELETE FROM user_timings WHERE user_id = ?", [userId]);

  // Insert new timings
  for (const t of timings) {
    const start = t.start_time || null;
    const end = t.end_time || null;

    if (t.day && start && end) {
      await pool.query(
        "INSERT INTO user_timings (user_id, day, `from`, `to`) VALUES (?, ?, ?, ?)",
        [userId, t.day, start, end]
      );
    } else {
      console.warn("Skipping invalid timing entry:", t);
    }
  }
};
