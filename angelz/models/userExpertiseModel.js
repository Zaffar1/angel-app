const connectDB = require("../config/db");

exports.replaceExpertise = async (userId, expertiseList) => {
    const pool = await connectDB();
    await pool.query('DELETE FROM user_expertise WHERE user_id = ? ',[userId]);
    for(const skill of expertiseList){
        await pool.query('INSERT INTO user_expertise (user_id,expertise) VALUES (?, ?) ',[userId, skill]);
    }
}