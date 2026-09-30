const axios = require('axios');

async function main() {
  const apiBase = process.env.VITE_API_URL_PRODUCTION || 'https://papayawhip-wren-332567.hostingersite.com/api';
  try {
    const res = await axios.get(`${apiBase}/volunteer/leaderboard`, {
      params: { page: 1, limit: 10 }
    });
    console.log('Leaderboard response data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error fetching leaderboard:', err.message);
  }
}

main();
