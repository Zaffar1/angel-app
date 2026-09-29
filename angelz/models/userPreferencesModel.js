const connectDB = require("../config/db");

exports.replacePreferences = async (userId, preferences) => {
    const pool = await connectDB();
    await pool.query('DELETE FROM user_preferences WHERE user_id = ?',[userId]);
    for(const pref of preferences){
        await pool.query("INSERT INTO user_preferences (user_id, preference) VALUES (?, ?)",[userId, pref]);
    }
}